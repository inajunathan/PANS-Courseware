import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]">
      <Header />
      <main className="flex-1 pt-28 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#7C3AED] mb-3" />
        <p className="font-['Montserrat',sans-serif] font-bold text-slate-700">
          Loading Student Tutorial & Revision Guide...
        </p>
      </main>
      <Footer />
    </div>
  );
}
