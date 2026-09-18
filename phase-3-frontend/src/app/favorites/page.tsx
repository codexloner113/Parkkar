"use client";
import Link from "next/link";
import { Heart, MapPin, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useFavorites, useRemoveFavorite } from "@/hooks/useResources";
import { EmptyState } from "@/components/ui/EmptyState";
//import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getApiError } from "@/lib/errors";

export default function FavoritesPage(){return <ProtectedRoute><AppShell><main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><div className="mb-8"><div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">SAVED</div><h1 className="mt-2 text-4xl font-bold">Favorite parking</h1></div><Favorites/></main></AppShell></ProtectedRoute>}
function Favorites(){const {data,isLoading}=useFavorites();const remove=useRemoveFavorite();if(isLoading)return <div className="grid gap-4 md:grid-cols-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-32"/>)}</div>;if(!data?.data.length)return <EmptyState icon={<Heart className="h-5 w-5"/>} title="Nothing saved yet" description="Tap the heart on a parking location to keep it close." action={<Link href="/parking" className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Explore parking</Link>}/>;return <div className="grid gap-4 md:grid-cols-2">{data.data.map(f=><div key={f.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><Link href={`/parking/${f.id}`} className="text-lg font-bold hover:text-cyan-600">{f.name}</Link><div className="mt-2 text-sm text-slate-500"><MapPin className="mr-1 inline h-4 w-4"/>{f.city} · {f.property_type.replaceAll("_"," ")}</div></div><button onClick={()=>{try{remove.mutate(f.id)}catch(e){void getApiError(e)}}} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Remove favorite"><Trash2 className="h-4 w-4"/></button></div><Link href={`/parking/${f.id}`} className="mt-5 inline-flex text-sm font-semibold text-cyan-600">View location →</Link></div>)}</div>}
