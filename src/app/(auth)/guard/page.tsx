'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

export default function AccessGuardPage() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Card className="shadow-none border-0 lg:border lg:shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="text-2xl">Business access pending</CardTitle>
          <CardDescription>
            Login successful hai, lekin is account ko abhi kisi XeroWA business workspace ka access nahi mila.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Apne XeroWA administrator se business aur role assignment complete karwayein. Access milne ke baad dobara login karein.
        </p>
        <Button type="button" variant="outline" className="w-full" onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out and use another account'}
        </Button>
      </CardContent>
    </Card>
  );
}
