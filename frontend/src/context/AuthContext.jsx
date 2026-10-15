import { useEffect, useState } from 'react'
import { api, resetCsrfToken } from '../services/apiClient'
import { AuthContext } from './useAuth'

const mapUser = (value) => value ? { ...value, name: value.fullName, roles: value.roles?.length ? value.roles : [value.role] } : null
export function AuthProvider({ children }) {
  const [user,setUser]=useState(null),[loading,setLoading]=useState(true)
  useEffect(()=>{let active=true;api.get('/api/auth/me').then(v=>active&&setUser(mapUser(v))).catch(()=>active&&setUser(null)).finally(()=>active&&setLoading(false));return()=>{active=false}},[])
  const login=async(email,password)=>{const r=await api.post('/api/auth/login',{email:email.trim(),password});resetCsrfToken();const u=mapUser({...r.user,roles:r.roles});setUser(u);return u}
  const loginWithGoogle=async(credential)=>{const r=await api.post('/api/auth/google',{credential});resetCsrfToken();const u=mapUser({...r.user,roles:r.roles});setUser(u);return u}
  const register=async({name,email,password})=>{const r=await api.post('/api/auth/register',{fullName:name.trim(),email:email.trim(),password});if(!r.emailVerificationRequired){resetCsrfToken();setUser(mapUser({...r.user,roles:r.roles}))}return{...r,user:mapUser({...r.user,roles:r.roles})}}
  const verifyEmail=async(email,otp)=>{const r=await api.post('/api/auth/email/verify',{email:email.trim(),otp:otp.trim()});resetCsrfToken();const u=mapUser({...r.user,roles:r.roles});setUser(u);return u}
  const refreshUser=async()=>{const u=mapUser(await api.get('/api/auth/me'));setUser(u);return u}
  const hasRole=(role)=>Boolean(user?.roles?.includes(role)||user?.role===role)
  const logout=async()=>{try{await api.post('/api/auth/logout')}catch{/* Backend may be offline. */}finally{resetCsrfToken();setUser(null)}}
  return <AuthContext.Provider value={{user,loading,login,loginWithGoogle,register,verifyEmail,refreshUser,hasRole,logout}}>{children}</AuthContext.Provider>
}
