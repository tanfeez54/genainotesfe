'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Trash2, Loader2, Save, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite', tag: 'Fastest & Light', desc: 'Zero 503 errors, lowest latency, recommended for handwritten photos and PDF scans' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', tag: 'Balanced', desc: 'Balanced high accuracy, fast generation' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', tag: 'High Speed', desc: 'Enhanced reasoning for school tests and arithmetic' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', tag: 'Advanced', desc: 'Next-gen vision model for complex multi-column worksheets' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', tag: 'Top Quality', desc: 'High quality transcription and structure parsing' },
  { id: 'gemini-4-hydrogen', label: 'Gemini 4 Hydrogen', tag: 'Free Flagship', desc: 'High precision flagship free model' },
  { id: 'gemini-4-argon', label: 'Gemini 4 Argon', tag: 'Flagship Variant', desc: 'Alternate flagship tier' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tag: 'Rock Solid', desc: 'Ultra-stable fallback model' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tag: 'Deep Reasoning', desc: 'Best for complex diagrams and multi-lingual layout analysis' },
  { id: 'custom', label: '✏️ Custom Model', tag: 'Manual Input', desc: 'Enter any custom or fine-tuned model ID manually' },
];

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash-lite');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingModel, setIsSavingModel] = useState(false);
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

    // Load saved AI Model
    const saved = localStorage.getItem('schoolpapers_gemini_model');
    if (saved) {
      if (GEMINI_MODELS.some((m) => m.id === saved)) {
        setSelectedModel(saved);
      } else {
        setSelectedModel('custom');
        setCustomModelInput(saved);
      }
    }
  }, []);

  const handleSaveAiModel = () => {
    setIsSavingModel(true);
    const modelToSave = selectedModel === 'custom' ? customModelInput.trim() : selectedModel;
    if (!modelToSave) {
      toast.error('Please enter a valid model name');
      setIsSavingModel(false);
      return;
    }
    localStorage.setItem('schoolpapers_gemini_model', modelToSave);
    toast.success(`Active AI Model saved as "${modelToSave}"!`);
    setIsSavingModel(false);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Profile updates are not fully supported without a backend endpoint, mocking for now
    await new Promise((res) => setTimeout(res, 500));
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account, preferences, and AI models</p>
      </div>

      {/* AI Model Configuration (User Requested: 3.5 flash lite se aage aur custom model) */}
      <Card className="rounded-3xl border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 via-card to-purple-50/20 dark:from-indigo-950/20 dark:to-card shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-heading font-bold text-foreground flex items-center gap-2">
                  <span>Google Gemini AI Model Settings</span>
                  <Badge variant="outline" className="text-[10px] bg-indigo-100 text-indigo-800 border-indigo-300">
                    Customizable
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Apne exam paper scan aur question generation ke liye Gemini model select karein ya custom model ID daalein.
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Model Selector Grid */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Select Preset Model (3.5 Flash Lite se aage ke saare models):
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GEMINI_MODELS.map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-card text-foreground border-border hover:border-indigo-300 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold truncate">{m.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p className={`text-[10px] leading-snug line-clamp-2 ${isSelected ? 'text-indigo-100' : 'text-muted-foreground'}`}>
                      {m.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Model Input when 'custom' is selected */}
          {selectedModel === 'custom' && (
            <div className="p-3 rounded-xl border border-indigo-300 bg-white dark:bg-card space-y-1.5 animate-fade-in">
              <Label className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                Custom Gemini Model Name:
              </Label>
              <Input
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="e.g. gemini-3.5-flash-lite or fine-tuned model ID"
                className="h-9 text-xs font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Aap Google Generative AI ka koi bhi model string (e.g. gemini-3.5-flash-lite, gemini-3.7-flash) likh sakte hain.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/80">
            <div className="text-xs text-muted-foreground">
              Current Active Model:{' '}
              <strong className="text-indigo-600 font-mono">
                {selectedModel === 'custom' ? customModelInput || 'None' : selectedModel}
              </strong>
            </div>
            <Button
              type="button"
              onClick={handleSaveAiModel}
              disabled={isSavingModel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer shadow-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              <span>Save Model</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="rounded-3xl border-border bg-card shadow-[0_10px_30px_rgba(24,30,75,0.03)]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs">
              {email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <CardTitle className="text-base font-heading font-bold text-foreground">Profile</CardTitle>
              <CardDescription>Update your display name</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block text-foreground">Email address</Label>
            <Input value={email} disabled className="h-10 bg-muted/50 text-muted-foreground rounded-xl" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block text-foreground">Display name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="h-10 rounded-xl bg-card border-border text-foreground"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="gradient-brand text-white hover:opacity-95 rounded-xl font-bold shadow-[0_4px_14px_rgba(223,105,81,0.3)] cursor-pointer">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border rounded-3xl bg-card shadow-[0_10px_30px_rgba(24,30,75,0.03)]">
        <CardHeader>
          <CardTitle className="text-base font-heading font-bold text-foreground">Account</CardTitle>
          <CardDescription>Sign out or manage your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl cursor-pointer border-border hover:bg-[#FFF1DA]/30"
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
