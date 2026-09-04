'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock, Loader2, LogIn, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to login');

      // Set the HTTP-only cookie equivalent
      document.cookie = `notegen_session=${result.session.access_token}; path=/; max-age=${60 * 60 * 24}; samesite=lax`;

      toast.success('Welcome back!');
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      toast.error('Login Failed', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden border border-border bg-card shadow-xl">
        {/* Left: Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-16 bg-card">
          <div className="w-full max-w-sm animate-fade-in">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-3 mb-12 group">
              <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-heading font-bold text-foreground">ExamPrep AI</span>
            </Link>

            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground mb-8 text-sm">
              Sign in to your enterprise account to manage assessments.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Work Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@school.edu"
                    className="pl-10 h-11 bg-background"
                    autoComplete="email"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Link href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 h-11 bg-background"
                    autoComplete="current-password"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-md mt-4"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <LogIn className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Request Access
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Info panel */}
        <div className="hidden lg:flex flex-1 bg-muted/40 items-center justify-center p-12 border-l border-border relative">
          <div className="absolute inset-0 dotted-bg opacity-50"></div>
          
          <div className="relative z-10 text-center max-w-sm">
            <div className="w-16 h-16 rounded-xl bg-background border border-border flex items-center justify-center mx-auto mb-8 shadow-sm">
              <LayoutTemplate className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading font-bold mb-4 text-foreground">Standardize Assessments</h2>
            <p className="text-muted-foreground leading-relaxed text-sm mb-8">
              Generate consistent, high-quality examination papers aligned with your institutional standards.
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm font-medium">
              {['Auto-Formatting', 'Syllabus Alignment', 'Secure Storage', 'Print Ready'].map((f) => (
                <div key={f} className="bg-background rounded-md px-3 py-2 border border-border text-foreground">
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
