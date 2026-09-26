import { useEffect, useState } from 'react'
import { api, resetCsrfToken } from '../services/apiClient'
import { AuthContext } from './useAuth'
const mapUser = (v) => v ? { ...v, name: v.fullName } : null
export function AuthProvider({ children }) {
  const [user,setUser]=useState(null), [loading,setLoading]=useState(true)
  useEffect(()=>{let active=true;api.get('/api/auth/me').then(v=>active&&setUser(mapUser(v))).catch(()=>active&&setUser(null)).finally(()=>active&&setLoading(false));return()=>{active=false}},[])
  const login=async(email,password)=>{const r=await api.post('/api/auth/login',{email:email.trim(),password});resetCsrfToken();const u=mapUser(r.user);setUser(u);return u}
  const register=async({name,email,password})=>{const r=await api.post('/api/auth/register',{fullName:name.trim(),email:email.trim(),password});if(!r.emailVerificationRequired){resetCsrfToken();setUser(mapUser(r.user))}return{...r,user:mapUser(r.user)}}
  const verifyEmail=async(email,otp)=>{const r=await api.post('/api/auth/email/verify',{email:email.trim(),otp:otp.trim()});resetCsrfToken();const u=mapUser(r.user);setUser(u);return u}
  const logout=async()=>{try{await api.post('/api/auth/logout')}catch{/* Backend may be offline. */}finally{resetCsrfToken();setUser(null)}}
  return <AuthContext.Provider value={{user,loading,login,register,verifyEmail,logout}}>{children}</AuthContext.Provider>
}
