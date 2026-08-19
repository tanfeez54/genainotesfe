'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Trash2, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'))?.[2];
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) setEmail(payload.email);
        if (payload.user_metadata?.full_name) setFullName(payload.user_metadata.full_name);
      } catch (e) {
        console.error('Failed to parse session token', e);
      }
    }
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Profile updates are not fully supported without a backend endpoint, mocking for now
    await new Promise(res => setTimeout(res, 500));
    toast.success('Profile updated locally');
    setIsSaving(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    document.cookie = 'notegen_session=; path=/; max-age=0; samesite=lax';
    router.push('/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account? All your notes and data will be permanently deleted. This cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? Type "yes" to confirm.')) return;
    setIsDeleting(true);
    toast.error('Account deletion must be done from Supabase dashboard for security reasons.');
    setIsDeleting(false);
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">
              {email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Update your display name</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Email address</Label>
            <Input value={email} disabled className="h-10 bg-muted/50 text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Display name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="h-10"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="gradient-brand text-white hover:opacity-90">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
          <CardDescription>Sign out or manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Sign out
          </Button>

          <Separator />

          <div>
            <h4 className="text-sm font-medium text-destructive mb-1">Danger Zone</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
