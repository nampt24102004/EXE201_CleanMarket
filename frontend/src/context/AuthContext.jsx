import { useCallback, useEffect, useRef, useState } from 'react'
import { api, resetCsrfToken, AUTH_DENIED_EVENT } from '../services/apiClient'
import { AuthContext } from './useAuth'

const mapUser = (value) => value ? { ...value, name: value.fullName, roles: value.roles?.length ? value.roles : [value.role] } : null
const sameAccount = (a, b) => (a?.id ?? null) === (b?.id ?? null) && [...(a?.roles || [])].sort().join() === [...(b?.roles || [])].sort().join()
// The session cookie is shared by every tab, so a login/logout in one tab must be announced to the others.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cleanmarket-auth') : null

export function AuthProvider({ children }) {
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true)
  const syncing=useRef(null)

  // Swap in the account the server now reports. A different account means a different session, whose CSRF token we do not have yet.
  const apply=useCallback((next)=>{setUser(prev=>{if(sameAccount(prev,next))return prev;resetCsrfToken();return next});return next},[])
  const announce=()=>channel?.postMessage('changed')

  // Re-reads /api/auth/me; concurrent callers share one request.
  const sync=useCallback(()=>{
    if(!syncing.current)syncing.current=api.get('/api/auth/me').then(v=>apply(mapUser(v))).catch(()=>apply(null)).finally(()=>{syncing.current=null})
    return syncing.current
  },[apply])

  useEffect(()=>{let active=true;api.get('/api/auth/me').then(v=>active&&setUser(mapUser(v))).catch(()=>active&&setUser(null)).finally(()=>active&&setLoading(false));return()=>{active=false}},[])
  useEffect(()=>{
    const onMessage=()=>{void sync()}
    const onVisible=()=>{if(document.visibilityState==='visible')void sync()}
    channel?.addEventListener('message',onMessage)
    window.addEventListener(AUTH_DENIED_EVENT,onMessage)
    document.addEventListener('visibilitychange',onVisible)
    return()=>{channel?.removeEventListener('message',onMessage);window.removeEventListener(AUTH_DENIED_EVENT,onMessage);document.removeEventListener('visibilitychange',onVisible)}
  },[sync])

  const signedIn=(r)=>{resetCsrfToken();const u=mapUser({...r.user,roles:r.roles});setUser(u);announce();return u}
  const login=async(email,password)=>signedIn(await api.post('/api/auth/login',{email:email.trim(),password}))
  const loginWithGoogle=async(credential)=>signedIn(await api.post('/api/auth/google',{credential}))
  const register=async({name,email,password})=>{const r=await api.post('/api/auth/register',{fullName:name.trim(),email:email.trim(),password});if(!r.emailVerificationRequired)signedIn(r);return{...r,user:mapUser({...r.user,roles:r.roles})}}
  const verifyEmail=async(email,otp)=>signedIn(await api.post('/api/auth/email/verify',{email:email.trim(),otp:otp.trim()}))
  const refreshUser=async()=>{const u=mapUser(await api.get('/api/auth/me'));apply(u);return u}
  const hasRole=(role)=>Boolean(user?.roles?.includes(role)||user?.role===role)
  const logout=async()=>{try{await api.post('/api/auth/logout')}catch{/* Backend may be offline. */}finally{resetCsrfToken();setUser(null);announce()}}
  return <AuthContext.Provider value={{user,loading,login,loginWithGoogle,register,verifyEmail,refreshUser,hasRole,logout}}>{children}</AuthContext.Provider>
}
