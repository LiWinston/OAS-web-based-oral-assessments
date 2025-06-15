'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, role } = useAuth();

  useEffect(() => {
    // Always redirect to login page on app start for better UX
    // Users can then choose which account to login with
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-6 space-y-4 text-center">
        <h1 className="text-2xl font-bold">OAS - Oral Assessment System</h1>
        <p className="text-muted-foreground">Loading...</p>
      </Card>
    </div>
  );
}
