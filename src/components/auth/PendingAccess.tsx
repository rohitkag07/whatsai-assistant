'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card,CardContent,CardDescription,CardHeader,CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
export function PendingAccess() {
  const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState('');
  async function signOut(){if(pending)return;setPending(true);setError('');try{const {error:failure}=await createClient().auth.signOut();if(failure)throw failure;router.replace('/login');router.refresh();}catch{setError('Sign-out could not be confirmed. Try again; your session may still be active.');}finally{setPending(false);}}
  return <section className="fr-auth-card"><div className="fr-auth-mark">Account / pending business access</div><h1>Your workspace<br />is not assigned yet.</h1><p>You have reached the access checkpoint. A verified business membership and role are required before setup or customer records can open.</p><div className="fr-auth-help"><h2>Next step</h2><p>Ask your workspace administrator to assign your business and role. Then sign in again. No business or permission is created by this page.</p></div>{error&&<p role="alert" className="fr-auth-error">{error}</p>}<button className="x-button" onClick={()=>void signOut()} disabled={pending}>{pending?'Signing out…':'Sign out and use another account'}</button></section>;
}
// Flag-off keeps the previous access page and its original sign-out behavior.
export function LegacyPendingAccess() {
  const router=useRouter();const [signingOut,setSigningOut]=useState(false);
  async function signOut(){setSigningOut(true);try{await createClient().auth.signOut();router.replace('/login');router.refresh();}finally{setSigningOut(false);}}
  return <Card className="shadow-none border-0 lg:border lg:shadow-sm"><CardHeader className="space-y-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><ShieldAlert className="h-5 w-5" aria-hidden="true" /></div><div><CardTitle className="text-2xl">Business access pending</CardTitle><CardDescription>Login successful hai, lekin is account ko abhi kisi XeroWA business workspace ka access nahi mila.</CardDescription></div></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Apne XeroWA administrator se business aur role assignment complete karwayein. Access milne ke baad dobara login karein.</p><Button type="button" variant="outline" className="w-full" onClick={signOut} disabled={signingOut}>{signingOut?'Signing out…':'Sign out and use another account'}</Button></CardContent></Card>;
}
