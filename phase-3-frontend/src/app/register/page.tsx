"use client";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { getApiError } from "@/lib/errors";
import { useAuth } from "@/contexts/AuthContext";

export default function RegisterPage(){
 const router=useRouter(); const {register}=useAuth(); const [form,setForm]=useState({name:"",email:"",phone:"",password:"",confirm:""}); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
 const set=(k:string,v:string)=>setForm(f=>({...f,[k]:v}));
 const submit=async(e:FormEvent)=>{e.preventDefault();setError(""); if(form.name.trim().length<1) return setError("Enter your name."); if(!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email."); if(form.phone.trim().length<6) return setError("Enter a valid phone number."); if(form.password.length<8||form.password.length>72) return setError("Password must be 8–72 characters."); if(form.password!==form.confirm) return setError("Passwords do not match."); setLoading(true); try{await register({name:form.name.trim(),email:form.email.trim(),phone:form.phone.trim(),password:form.password}); router.replace("/parking");}catch(err){setError(getApiError(err).message);}finally{setLoading(false);}};
 return <AuthCard eyebrow="Get started" title="Create your Parkkar account" footer={<span>Already have an account? <Link className="font-semibold text-cyan-600 hover:text-cyan-500" href="/login">Log in</Link></span>}><form onSubmit={submit} className="space-y-4">{error&&<Alert message={error}/>}<Input label="Full name" value={form.name} onChange={e=>set("name",e.target.value)} autoComplete="name" placeholder="Siddhartha Gupta"/><Input label="Email" type="email" value={form.email} onChange={e=>set("email",e.target.value)} autoComplete="email" placeholder="you@example.com"/><Input label="Phone" value={form.phone} onChange={e=>set("phone",e.target.value)} autoComplete="tel" placeholder="9000000000"/><Input label="Password" type="password" value={form.password} onChange={e=>set("password",e.target.value)} autoComplete="new-password" placeholder="At least 8 characters"/><Input label="Confirm password" type="password" value={form.confirm} onChange={e=>set("confirm",e.target.value)} autoComplete="new-password" placeholder="Repeat your password"/><Button type="submit" loading={loading} className="mt-2 w-full">Create account</Button></form></AuthCard>
}
