"use client";
import Link from "next/link";
import { CarFront, Menu, X, UserCircle2, Globe2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppLanguage } from "@/data/parkkarData";

export function Navbar(){
 const {user,logout,isAuthenticated}=useAuth(); const {language,setLanguage,t}=useLanguage(); const [open,setOpen]=useState(false); const [langOpen,setLangOpen]=useState(false);
 const home=user?.role==="ADMIN"?"/admin":user?.role==="PARTNER"?"/partner":"/profile";
 const labels:{id:AppLanguage;label:string}[]=[{id:"en",label:"English"},{id:"hi",label:"हिन्दी"},{id:"hinglish",label:"Hinglish"}];
 return <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur-xl"><div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
  <Link href="/" className="flex shrink-0 items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-slate-950"><CarFront className="h-5 w-5"/></span><span><span className="block text-lg font-bold tracking-tight">parkkar<span className="text-cyan-400">.</span></span><span className="block text-[9px] uppercase tracking-[.25em] text-slate-400">smart parking</span></span></Link>
  <nav className="hidden items-center gap-6 text-sm text-slate-300 lg:flex"><Link href="/parking" className="hover:text-white">{t.findParking}</Link><Link href="/#how" className="hover:text-white">{t.howItWorks}</Link><Link href="/care" className="hover:text-white">{t.care}</Link><Link href="/bookings" className="hover:text-white">Bookings</Link></nav>
  <div className="flex items-center gap-2"><div className="relative"><button type="button" onClick={()=>setLangOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"><Globe2 className="h-4 w-4 text-cyan-400"/>{language === "hi" ? "HI" : language === "hinglish" ? "Hinglish" : "EN"}<ChevronDown className="h-3.5 w-3.5"/></button>{langOpen&&<div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-sm">{labels.map(x=><button key={x.id} type="button" onClick={()=>{setLanguage(x.id);setLangOpen(false)}} className={`block w-full rounded-xl px-3 py-2 text-left hover:bg-slate-100 ${language===x.id?"font-bold text-cyan-700":""}`}>{x.label}</button>)}</div>}</div>
  {isAuthenticated?<Link href={home} className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm md:inline-flex"><UserCircle2 className="h-4 w-4"/>{user?.name?.split(" ")[0]||"Account"}</Link>:<Link href="/login" className="hidden rounded-2xl border border-white/10 px-3 py-2 text-sm md:inline-flex">Log in</Link>}
  {isAuthenticated&&<button type="button" onClick={logout} className="hidden rounded-2xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 md:inline-flex">Log out</button>}
  <button type="button" className="rounded-2xl border border-white/10 p-2 lg:hidden" onClick={()=>setOpen(v=>!v)} aria-label="Toggle menu">{open?<X/>:<Menu/>}</button></div>
 </div>{open&&<div className="border-t border-white/10 px-4 pb-4 pt-3 lg:hidden"><div className="flex flex-col gap-1 text-sm"><Link onClick={()=>setOpen(false)} href="/parking" className="rounded-xl px-3 py-3">{t.findParking}</Link><Link onClick={()=>setOpen(false)} href="/#how" className="rounded-xl px-3 py-3">{t.howItWorks}</Link><Link onClick={()=>setOpen(false)} href="/care" className="rounded-xl px-3 py-3">{t.care}</Link><Link onClick={()=>setOpen(false)} href="/bookings" className="rounded-xl px-3 py-3">Bookings</Link>{isAuthenticated&&<button type="button" onClick={()=>{setOpen(false);logout()}} className="rounded-xl px-3 py-3 text-left">Log out</button>}</div></div>}</header>
}
