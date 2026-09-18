"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PARKKAR_COPY, type AppLanguage } from "@/data/parkkarData";

type LanguageContextValue = { language: AppLanguage; setLanguage:(language:AppLanguage)=>void; t: typeof PARKKAR_COPY["en"] };
const LanguageContext=createContext<LanguageContextValue | null>(null);
export function LanguageProvider({children}:{children:ReactNode}){
 const [language,setLanguageState]=useState<AppLanguage>("en");
 useEffect(()=>{const saved=window.localStorage.getItem("parkkar-language") as AppLanguage|null;if(saved&&saved in PARKKAR_COPY)setLanguageState(saved)},[]);
 const setLanguage=(next:AppLanguage)=>{setLanguageState(next);window.localStorage.setItem("parkkar-language",next)};
 return <LanguageContext.Provider value={{language,setLanguage,t:PARKKAR_COPY[language]}}>{children}</LanguageContext.Provider>
}
export function useLanguage(){const value=useContext(LanguageContext);if(!value)throw new Error("useLanguage must be used inside LanguageProvider");return value;}
