'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  BookOpen,
  TrendingUp,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  topic: string | null;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  word_count: number;
  created_at: string;
  subjects?: { name: string } | null;
  note_sources?: Array<{ domain: string | null }>;
}

interface Subject {
  id: string;
  name: string;
  notes: Array<{ count: number }>;
}

const statusConfig = {
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40' },
  generating: { label: 'Generating', icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
  draft: { label: 'Draft', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/40' },
};

function NoteCard({ note }: { note: Note }) {
  const status = statusConfig[note.status];
  const StatusIcon = status.icon;

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="group hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className={`w-8 h-8 rounded-lg ${status.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              <StatusIcon className={cn('w-4 h-4', status.color, note.status === 'generating' && 'animate-spin')} />
            </div>
            <Badge variant="secondary" className="text-xs capitalize flex-shrink-0">
              {note.subjects?.name ?? 'No subject'}
            </Badge>
          </div>
          <CardTitle className="text-base leading-snug group-hover:text-primary transition-colors mt-2 line-clamp-2">
            {note.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {note.topic && (
            <p className="text-xs text-muted-foreground mb-3 truncate">{note.topic}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {note.word_count > 0 ? `${note.word_count} words` : 'Not yet generated'}
            </span>
            <span>
              {new Date(note.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          {note.note_sources?.[0]?.domain && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              📎 {note.note_sources[0].domain}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, completed: 0, subjects: 0 });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (selectedSubject) params.subject = selectedSubject;

      const [notesRes, subjectsRes] = await Promise.all([
        api.notes.list(params),
        api.subjects.list(),
      ]);

      const notesData = (notesRes.data as Note[]) ?? [];
      const subjectsData = (subjectsRes.data as Subject[]) ?? [];

      setNotes(notesData);
      setSubjects(subjectsData);
      setStats({
        total: notesData.length,
        completed: notesData.filter((n) => n.status === 'completed').length,
        subjects: subjectsData.length,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedSubject]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, search ? 400 : 0);
    return () => clearTimeout(timeout);
  }, [fetchData, search]);

  const statCards = [
    { label: 'Total Notes', value: stats.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/40' },
    { label: 'Subjects', value: stats.subjects, icon: FolderOpen, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'This Week', value: notes.filter(n => {
      const d = new Date(n.created_at);
      const now = new Date();
      return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your notes and study materials</p>
        </div>
        <Link href="/notes/new">
          <Button className="gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm font-medium">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Subjects sidebar */}
        <div className="hidden lg:block w-48 flex-shrink-0">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Subjects</h3>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedSubject(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !selectedSubject
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              All Notes
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2',
                  selectedSubject === s.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <span className="truncate">{s.name}</span>
                <span className="text-xs bg-muted rounded-full px-1.5 py-0.5 flex-shrink-0">
                  {Array.isArray(s.notes) ? s.notes[0]?.count ?? 0 : 0}
                </span>
              </button>
            ))}
          </div>
          <Link href="/subjects" className="block mt-4 px-3">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
              Manage subjects
            </Button>
          </Link>
        </div>

        {/* Notes grid */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-muted/60 animate-pulse" />
              ))}
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No notes yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                {search ? 'No notes match your search' : 'Create your first AI-powered study note'}
              </p>
              {!search && (
                <Link href="/notes/new">
                  <Button className="gradient-brand text-white hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4 mr-2" />
                    Create your first note
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
