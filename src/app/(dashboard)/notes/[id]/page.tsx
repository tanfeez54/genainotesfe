'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit2,
  Check,
  X,
  Trash2,
  RefreshCw,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Lightbulb,
  BookOpen,
  Zap,
  AlertTriangle,
  Star,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NoteSection {
  id: string;
  section_type: string | null;
  title: string;
  content: string | null;
  position: number;
}

interface NoteData {
  id: string;
  title: string;
  topic: string | null;
  purpose: string | null;
  level: string | null;
  language: string;
  note_length: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  summary: string | null;
  word_count: number;
  created_at: string;
  subjects: { id: string; name: string } | null;
  note_sources: Array<{ url: string; domain: string | null }>;
  note_sections: NoteSection[];
  note_generation_jobs: Array<{
    status: string;
    progress: number;
    current_step: string;
    error_message: string | null;
  }>;
}

const sectionIcons: Record<string, React.ElementType> = {
  concept: Lightbulb,
  formula: Zap,
  example: BookOpen,
  mistake: AlertTriangle,
  revision: Star,
  key_points: FileText,
  default: FileText,
};

const sectionColors: Record<string, string> = {
  concept: 'border-l-blue-400 bg-blue-50/40 dark:bg-blue-950/20',
  formula: 'border-l-purple-400 bg-purple-50/40 dark:bg-purple-950/20',
  example: 'border-l-teal-400 bg-teal-50/40 dark:bg-teal-950/20',
  mistake: 'border-l-red-400 bg-red-50/40 dark:bg-red-950/20',
  revision: 'border-l-amber-400 bg-amber-50/40 dark:bg-amber-950/20',
  key_points: 'border-l-green-400 bg-green-50/40 dark:bg-green-950/20',
  default: 'border-l-border bg-muted/40',
};

function EditableSection({ section, noteId, onUpdate }: {
  section: NoteSection;
  noteId: string;
  onUpdate: (id: string, content: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const Icon = sectionIcons[section.section_type ?? 'default'] ?? sectionIcons.default;
  const colorClass = sectionColors[section.section_type ?? 'default'] ?? sectionColors.default;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.notes.updateSection(noteId, section.id, { content: editContent });
      onUpdate(section.id, editContent);
      setIsEditing(false);
      toast.success('Section saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn('border-l-4 rounded-r-xl p-5 mb-4 group transition-all', colorClass)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <h3 className="font-semibold text-foreground text-lg">{section.title}</h3>
          {section.section_type && (
            <Badge variant="secondary" className="text-xs capitalize hidden sm:block">
              {section.section_type.replace('_', ' ')}
            </Badge>
          )}
        </div>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => { setEditContent(section.content ?? ''); setIsEditing(true); }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditing(false)} disabled={isSaving}>
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" className="h-7 w-7 bg-primary text-primary-foreground" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          className="min-h-[120px] text-base resize-y bg-background/80"
          autoFocus
        />
      ) : (
        <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-wrap">
          {section.content ?? 'No content'}
        </p>
      )}
    </div>
  );
}

export default function NoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [note, setNote] = useState<NoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const res = await api.notes.get(id);
        setNote(res.data as NoteData);
      } catch {
        toast.error('Note not found');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchNote();
  }, [id, router]);

  // Poll if still generating
  useEffect(() => {
    if (!note || note.status !== 'generating') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.notes.get(id);
        const updated = res.data as NoteData;
        setNote(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          if (updated.status === 'completed') toast.success('Note generation complete!');
        }
      } catch { clearInterval(interval); }
    }, 3000);
    return () => clearInterval(interval);
  }, [note?.status, id]);

  const handleSectionUpdate = (sectionId: string, content: string) => {
    setNote((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        note_sections: prev.note_sections.map((s) =>
          s.id === sectionId ? { ...s, content } : s
        ),
      };
    });
  };

  const handleDelete = async () => {
    if (!confirm('Delete this note? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await api.notes.delete(id);
      toast.success('Note deleted');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete');
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate this note? Existing content will be replaced.')) return;
    setIsRegenerating(true);
    try {
      await api.notes.generate(id);
      setNote((prev) => prev ? { ...prev, status: 'generating' } : prev);
      toast.success('Regeneration started!');
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    const lines = [
      `# ${note.title}`,
      note.topic ? `**Topic:** ${note.topic}` : '',
      '',
      note.summary ? `## Summary\n${note.summary}` : '',
      '',
      ...note.note_sections.map((s) => `## ${s.title}\n${s.content ?? ''}`),
    ].filter((l) => l !== undefined);

    const blob = new Blob([lines.join('\n\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown');
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="h-8 w-48 bg-muted rounded animate-pulse mb-6" />
        <div className="h-32 bg-muted rounded-xl animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!note) return null;

  const job = note.note_generation_jobs?.[0];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {note.subjects && (
              <Badge variant="secondary" className="text-xs">{note.subjects.name}</Badge>
            )}
            <Badge
              className={cn(
                'text-xs capitalize',
                note.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
                note.status === 'failed' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
                note.status === 'generating' && 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
                note.status === 'draft' && 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
              )}
            >
              {note.status}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-foreground truncate">{note.title}</h1>
          {note.topic && <p className="text-sm text-muted-foreground mt-0.5">{note.topic}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportMarkdown} className="hidden sm:flex">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating || note.status === 'generating'}
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span className="hidden sm:inline">Regenerate</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          note.purpose?.replace('_', ' '),
          note.level,
          note.language,
          note.note_length,
          note.word_count > 0 ? `${note.word_count} words` : null,
          note.note_sources?.[0]?.domain,
        ].filter(Boolean).map((v) => (
          <Badge key={v} variant="outline" className="text-xs capitalize">{v}</Badge>
        ))}
      </div>

      {/* Generating state */}
      {note.status === 'generating' && job && (
        <div className="mb-6 p-5 rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {job.current_step ?? 'Generating notes...'}
            </span>
          </div>
          <Progress value={job.progress} className="h-1.5" />
        </div>
      )}

      {/* Failed state */}
      {note.status === 'failed' && (
        <div className="mb-6 p-5 rounded-xl border border-red-200 bg-red-50/60 dark:bg-red-950/20 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Generation failed</p>
              <p className="text-xs text-muted-foreground mt-1">{job?.error_message ?? 'Unknown error'}</p>
              <Button size="sm" className="mt-3" onClick={handleRegenerate} disabled={isRegenerating}>
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {note.summary && (
        <div className="mb-6 p-5 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-chart-2/5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Summary</h2>
          <p className="text-foreground leading-relaxed">{note.summary}</p>
        </div>
      )}

      {/* Note sections */}
      {note.note_sections.length > 0 ? (
        <Tabs defaultValue="all">
          <TabsList className="mb-5">
            <TabsTrigger value="all">All Sections</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {note.note_sections
              .sort((a, b) => a.position - b.position)
              .map((section) => (
                <EditableSection
                  key={section.id}
                  section={section}
                  noteId={id}
                  onUpdate={handleSectionUpdate}
                />
              ))}
          </TabsContent>

          <TabsContent value="concepts" className="mt-0">
            {note.note_sections
              .filter((s) => s.section_type === 'concept')
              .map((s) => <EditableSection key={s.id} section={s} noteId={id} onUpdate={handleSectionUpdate} />)}
          </TabsContent>

          <TabsContent value="examples" className="mt-0">
            {note.note_sections
              .filter((s) => s.section_type === 'example')
              .map((s) => <EditableSection key={s.id} section={s} noteId={id} onUpdate={handleSectionUpdate} />)}
          </TabsContent>

          <TabsContent value="revision" className="mt-0">
            {note.note_sections
              .filter((s) => ['revision', 'key_points', 'mistake'].includes(s.section_type ?? ''))
              .map((s) => <EditableSection key={s.id} section={s} noteId={id} onUpdate={handleSectionUpdate} />)}
          </TabsContent>
        </Tabs>
      ) : note.status === 'draft' ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Not generated yet</h3>
          <p className="text-sm text-muted-foreground mb-5">Click Regenerate to generate notes for this draft.</p>
          <Button onClick={handleRegenerate} className="gradient-brand text-white hover:opacity-90">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Now
          </Button>
        </div>
      ) : null}

      {/* Source URL */}
      {note.note_sources?.[0] && (
        <div className="mt-6 pt-5 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Source:{' '}
            <a
              href={note.note_sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {note.note_sources[0].url}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
