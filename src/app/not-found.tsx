'use client';

import Link from 'next/link';
import { BookOpen, Home, FolderOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
          <BookOpen className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            404 — Page Not Found
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Looks like you're lost
          </h1>
          <p className="text-sm text-slate-500">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        <div className="space-y-2.5 pt-2">
          <Link href="/classes" className="block w-full">
            <Button className="w-full gradient-brand text-white font-semibold rounded-xl h-10 shadow-sm cursor-pointer">
              <FolderOpen className="w-4 h-4 mr-2" /> Go to School Portal
            </Button>
          </Link>
          <Link href="/login" className="block w-full">
            <Button variant="outline" className="w-full border-slate-200 text-slate-700 font-medium rounded-xl h-10 cursor-pointer">
              <Home className="w-4 h-4 mr-2" /> Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
