'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send reset code');

      toast.success(result.message || 'Reset code sent!');
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error('Failed to send reset code', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center justify-center p-8 bg-card rounded-2xl border border-border shadow-xl">
        <div className="w-full animate-fade-in">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3 mb-10 group justify-center w-full">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">ExamPrep AI</span>
          </Link>

          <h1 className="text-2xl font-heading font-bold text-foreground mb-2 text-center">Reset Password</h1>
          <p className="text-muted-foreground mb-8 text-sm text-center">
            Enter your email address and we'll send you a code to reset your password.
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

            <Button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground hover:opacity-90 font-medium rounded-md mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Reset Code
                  <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-sm text-center text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
