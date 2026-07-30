'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function AdminClientViewButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function inspect() {
    setLoading(true);
    const response = await fetch('/api/admin/active-business', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_id: businessId }),
    });
    const payload = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) return toast.error(payload?.error || 'Client switch failed.');
    router.push('/dashboard');
  }

  return (
    <Button type="button" onClick={inspect} disabled={loading} className="bg-white text-[#075e54] hover:bg-[#e7f7f2]">
      <Eye className="mr-2 h-4 w-4" />
      {loading ? 'Opening...' : 'Inspect client view'}
    </Button>
  );
}
