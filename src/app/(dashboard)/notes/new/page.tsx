'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Loader2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  source_url: z.string().url('Enter a valid URL (include https://)'),
  subject_id: z.string().optional(),
  topic: z.string().max(200).optional(),
  purpose: z.enum(['exam_prep', 'revision', 'beginner_learning', 'deep_understanding']).default('exam_prep'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  language: z.string().default('English'),
  note_length: z.enum(['short', 'medium', 'detailed']).default('medium'),
  include_summary: z.boolean().default(true),
  include_key_points: z.boolean().default(true),
  include_examples: z.boolean().default(true),
  include_formulas: z.boolean().default(false),
  include_common_mistakes: z.boolean().default(false),
  include_practice_questions: z.boolean().default(false),
  custom_instruction: z.string().max(1000).optional(),
});

type FormData = z.input<typeof schema>;

interface Subject { id: string; name: string; }
interface ProgressStep {
  label: string;
  progress: number;
}

const STEPS: ProgressStep[] = [
  { label: 'Validating URL...', progress: 5 },
  { label: 'Fetching page content...', progress: 15 },
  { label: 'Cleaning and extracting content...', progress: 35 },
  { label: 'Preparing AI prompt...', progress: 50 },
  { label: 'Generating notes with AI...', progress: 60 },
  { label: 'Saving notes to database...', progress: 85 },
  { label: 'Notes generated successfully!', progress: 100 },
];

const purposeOptions = [
  { value: 'exam_prep', label: '📝 Exam Preparation', desc: 'Focus on key concepts & formulas' },
  { value: 'revision', label: '🔄 Quick Revision', desc: 'Concise summaries & key points' },
  { value: 'beginner_learning', label: '🌱 Beginner Learning', desc: 'Simple explanations with examples' },
  { value: 'deep_understanding', label: '🧠 Deep Understanding', desc: 'Thorough explanations & nuances' },
];

const languages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Arabic', 'Chinese', 'Japanese', 'Portuguese'];

const checkboxes = [
  { key: 'include_summary', label: 'Summary', desc: 'Brief overview' },
  { key: 'include_key_points', label: 'Key Points', desc: 'Bullet points' },
  { key: 'include_examples', label: 'Examples', desc: 'Real examples' },
  { key: 'include_formulas', label: 'Formulas', desc: 'Math & equations' },
  { key: 'include_common_mistakes', label: 'Common Mistakes', desc: 'Avoid errors' },
  { key: 'include_practice_questions', label: 'Practice Q&A', desc: 'Test yourself' },
] as const;

export default function NewNotePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>('idle');
  const [urlPreview, setUrlPreview] = useState<{ title?: string; domain?: string; wordCount?: number } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showNewSubject, setShowNewSubject] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      purpose: 'exam_prep',
      level: 'intermediate',
      language: 'English',
      note_length: 'medium',
      include_summary: true,
      include_key_points: true,
      include_examples: true,
      include_formulas: false,
      include_common_mistakes: false,
      include_practice_questions: false,
    },
  });

  const sourceUrl = watch('source_url');

  useEffect(() => {
    api.subjects.list().then((res) => setSubjects((res.data as Subject[]) ?? [])).catch(() => {});
  }, []);

  // URL preview with debounce
  useEffect(() => {
    if (!sourceUrl || errors.source_url) return;
    try { new URL(sourceUrl); } catch { return; }

    setIsPreviewLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.sources.extract(sourceUrl);
        setUrlPreview(res.data as { title?: string; domain?: string; wordCount?: number });
      } catch {
        setUrlPreview(null);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 800);

    return () => clearTimeout(t);
  }, [sourceUrl, errors.source_url]);

  // Poll generation status
  useEffect(() => {
    if (!noteId || generationStatus !== 'generating') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.notes.status(noteId);
        const job = res.data as {
          status: string;
          progress: number;
          current_step: string;
        };

        setGenerationProgress(job.progress);
        setCurrentStep(job.current_step ?? '');

        if (job.status === 'completed') {
          setGenerationStatus('completed');
          clearInterval(interval);
          toast.success('Notes generated!', { description: 'Redirecting to your note...' });
          setTimeout(() => router.push(`/notes/${noteId}`), 1500);
        } else if (job.status === 'failed') {
          setGenerationStatus('failed');
          clearInterval(interval);
          toast.error('Generation failed', { description: job.current_step });
          setIsGenerating(false);
        }
      } catch {
        // keep polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [noteId, generationStatus, router]);

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const res = await api.subjects.create({ name: newSubjectName });
      const s = res.data as Subject;
      setSubjects((prev) => [...prev, s]);
      setValue('subject_id', s.id);
      setNewSubjectName('');
      setShowNewSubject(false);
      toast.success('Subject created');
    } catch {
      toast.error('Failed to create subject');
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    setGenerationStatus('generating');
    setGenerationProgress(0);
    setCurrentStep('Creating note...');

    try {
      // Create the note
      const createRes = await api.notes.create(data);
      const note = createRes.data as { id: string };
      setNoteId(note.id);

      // Kick off generation
      await api.notes.generate(note.id);
      setCurrentStep('Validating URL...');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start generation';
      toast.error(message);
      setIsGenerating(false);
      setGenerationStatus('idle');
    }
  };

  // Generating state UI
  if (isGenerating || generationStatus === 'completed') {
    return (
      <div className="min-h-full flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className={cn(
            'w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg',
            generationStatus === 'completed'
              ? 'bg-green-50 dark:bg-green-950/40'
              : 'gradient-brand'
          )}>
            {generationStatus === 'completed' ? (
              <CheckCircle className="w-10 h-10 text-green-500" />
            ) : generationStatus === 'failed' ? (
              <AlertCircle className="w-10 h-10 text-white" />
            ) : (
              <Sparkles className="w-10 h-10 text-white animate-pulse" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {generationStatus === 'completed'
              ? 'Notes Ready! 🎉'
              : generationStatus === 'failed'
              ? 'Generation Failed'
              : 'Generating your notes...'}
          </h2>
          <p className="text-muted-foreground mb-8 text-sm">
            {currentStep || 'Please wait while AI generates your study notes'}
          </p>

          <div className="space-y-3">
            <Progress value={generationProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{currentStep}</span>
              <span>{generationProgress}%</span>
            </div>
          </div>

          <div className="mt-8 space-y-2">
            {STEPS.map((step) => (
              <div
                key={step.label}
                className={cn(
                  'flex items-center gap-3 text-sm px-4 py-2.5 rounded-lg transition-colors',
                  generationProgress >= step.progress
                    ? 'text-foreground'
                    : 'text-muted-foreground/50'
                )}
              >
                {generationProgress >= step.progress ? (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Create New Note</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Paste a URL and let AI generate structured study notes for you
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Source URL */}
        <Card>
          <CardContent className="pt-5">
            <Label className="text-sm font-semibold mb-2 block">
              Source URL <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                {...register('source_url')}
                placeholder="https://en.wikipedia.org/wiki/Machine_learning"
                className="pl-10 h-11"
                id="source-url"
              />
              {isPreviewLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              )}
            </div>
            {errors.source_url && (
              <p className="text-sm text-destructive mt-1.5">{errors.source_url.message}</p>
            )}

            {/* URL Preview */}
            {urlPreview && (
              <div className="mt-3 p-3 rounded-lg bg-muted/60 border border-border flex items-start gap-3 animate-fade-in">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {(urlPreview as { title?: string }).title ?? 'Page found'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(urlPreview as { domain?: string }).domain} · {(urlPreview as { wordCount?: number }).wordCount ?? 0} words extracted
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardContent className="pt-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-semibold mb-2 block">
                  Note Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="e.g. Machine Learning Fundamentals"
                  className="h-10"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Topic</Label>
                <Input
                  {...register('topic')}
                  placeholder="e.g. Supervised Learning"
                  className="h-10"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">Subject</Label>
              <div className="flex gap-2">
                <Select onValueChange={(v) => setValue('subject_id', v as string | undefined)}>
                  <SelectTrigger className="h-10 flex-1">
                    <SelectValue placeholder="Choose a subject..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  onClick={() => setShowNewSubject(!showNewSubject)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {showNewSubject && (
                <div className="flex gap-2 mt-2 animate-fade-in">
                  <Input
                    placeholder="New subject name..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="h-9 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateSubject())}
                  />
                  <Button type="button" size="sm" onClick={handleCreateSubject} className="h-9">
                    Add
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Purpose */}
        <Card>
          <CardContent className="pt-5">
            <Label className="text-sm font-semibold mb-3 block">Purpose</Label>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {purposeOptions.map(({ value, label, desc }) => {
                const isSelected = watch('purpose') === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('purpose', value as FormData['purpose'])}
                    className={cn(
                      'p-3.5 rounded-xl border-2 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="font-medium text-sm text-foreground">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Level, Language, Length */}
        <Card>
          <CardContent className="pt-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-2 block">Level</Label>
                <Select defaultValue="intermediate" onValueChange={(v) => setValue('level', v as FormData['level'])}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Beginner</SelectItem>
                    <SelectItem value="intermediate">📚 Intermediate</SelectItem>
                    <SelectItem value="advanced">🎓 Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Language</Label>
                <Select defaultValue="English" onValueChange={(v) => setValue('language', v as string)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Note Length</Label>
                <Select defaultValue="medium" onValueChange={(v) => setValue('note_length', v as FormData['note_length'])}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">⚡ Short</SelectItem>
                    <SelectItem value="medium">📄 Medium</SelectItem>
                    <SelectItem value="detailed">📖 Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sections to include */}
        <Card>
          <CardContent className="pt-5">
            <Label className="text-sm font-semibold mb-3 block">Include in Notes</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {checkboxes.map(({ key, label, desc }) => {
                const isChecked = watch(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setValue(key, !isChecked)}
                    className={cn(
                      'p-3 rounded-xl border-2 text-left transition-all',
                      isChecked
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn(
                        'w-4 h-4 rounded border-2 flex items-center justify-center transition-colors',
                        isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                      )}>
                        {isChecked && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-sm font-medium text-foreground">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">{desc}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Custom Instructions */}
        <Card>
          <CardContent className="pt-5">
            <Label className="text-sm font-semibold mb-2 block">
              Custom Instructions{' '}
              <span className="text-xs font-normal text-muted-foreground ml-1">(optional)</span>
            </Label>
            <Textarea
              {...register('custom_instruction')}
              placeholder="e.g. Focus on Python code examples. Explain each concept with an analogy."
              className="resize-none h-20 text-sm"
              id="custom-instruction"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 gradient-brand text-white hover:opacity-90 transition-opacity shadow-lg font-semibold text-base"
          disabled={isGenerating}
          id="generate-notes-btn"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 w-5 h-5" />
              Generate Notes with AI
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
