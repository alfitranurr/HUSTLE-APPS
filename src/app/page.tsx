'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Loading Hustle.Nunn...
        </p>
      </div>
    </div>
  );
}
