'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  notes: Array<{ count: number }>;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await api.subjects.list();
      setSubjects((res.data as Subject[]) ?? []);
    } catch { toast.error('Failed to load subjects'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setName(s.name);
    setDescription(s.description ?? '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editing) {
        await api.subjects.update(editing.id, { name, description: description || undefined });
        toast.success('Subject updated');
      } else {
        await api.subjects.create({ name, description: description || undefined });
        toast.success('Subject created');
      }
      setDialogOpen(false);
      fetchSubjects();
    } catch { toast.error('Failed to save subject'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject? Notes will remain but become unassigned.')) return;
    try {
      await api.subjects.delete(id);
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success('Subject deleted');
    } catch { toast.error('Failed to delete subject'); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize your notes by subject</p>
        </div>
        <Button onClick={openCreate} className="gradient-brand text-white hover:opacity-90 transition-opacity shadow-sm font-medium">
          <Plus className="w-4 h-4 mr-2" />
          New Subject
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
          <p className="text-muted-foreground text-sm mb-6">Create a subject to organize your notes</p>
          <Button onClick={openCreate} className="gradient-brand text-white hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Create first subject
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((s) => (
            <Card key={s.id} className="group hover:border-primary/40 hover:shadow-md transition-all">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{s.name}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{s.description}</p>
                )}
                <Badge variant="secondary" className="text-xs">
                  {Array.isArray(s.notes) ? (s.notes[0]?.count ?? 0) : 0} notes
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Subject' : 'New Subject'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics, Physics, History"
                className="h-10"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-1.5 block">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                className="h-20 resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving} className="gradient-brand text-white hover:opacity-90">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editing ? 'Save Changes' : 'Create Subject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
