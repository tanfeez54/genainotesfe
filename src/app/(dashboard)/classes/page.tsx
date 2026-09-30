'use client';

import { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  FolderTree,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  Layers,
  ArrowLeft,
  Edit2,
  Check,
  X,
  FileText,
  Bookmark,
  Eye,
  Upload,
  FileScan,
  CheckCircle2,
  Clock,
  Maximize2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

interface ClassItem {
  id: string;
  name: string;
}

interface SubjectItem {
  id: string;
  name: string;
  class_id: string;
}

interface ChapterItem {
  id: string;
  title: string;
  subject_id: string;
}

interface ScannedDocItem {
  id: string;
  image_url: string;
  doc_type: string;
  status: string;
  raw_ocr_text?: string;
  created_at: string;
  chapter_id?: string;
}

export default function AcademicStructurePage() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Hierarchy Navigation Level: 'classes' | 'subjects' | 'chapters'
  const [currentLevel, setCurrentLevel] = useState<'classes' | 'subjects' | 'chapters'>('classes');

  // Selected entities for drill-down
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);

  // Data states
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Add item form toggles and values
  const [isAdding, setIsAdding] = useState(false);
  const [itemName, setItemName] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // --- Chapter Documents Modal States ---
  const [viewingDocsChapter, setViewingDocsChapter] = useState<ChapterItem | null>(null);
  const [chapterScans, setChapterScans] = useState<ScannedDocItem[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [isUploadingScan, setIsUploadingScan] = useState(false);

  const [viewingOcrDoc, setViewingOcrDoc] = useState<{ pageNum: number; text: string; imageUrl?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
    }
  }, []);

  // --- Fetch Data Functions ---

  async function fetchClasses(authToken = token) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setClasses(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load classes');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSubjects(classId: string, authToken = token) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setSubjects(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load subjects');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchChapters(subjectId: string, authToken = token) {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setChapters(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load chapters');
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch scans for a specific chapter in sequential order
  async function fetchChapterScans(chapterId: string) {
    setIsLoadingScans(true);
    try {
      const res = await fetch(`${API_URL}/api/scans?chapter_id=${chapterId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setChapterScans(data.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load chapter documents');
    } finally {
      setIsLoadingScans(false);
    }
  }

  // --- Navigation Helpers ---

  function handleSelectClass(cls: ClassItem) {
    setSelectedClass(cls);
    setSelectedSubject(null);
    setCurrentLevel('subjects');
    setIsAdding(false);
    setEditingId(null);
    setItemName('');
    setSearchQuery('');
    fetchSubjects(cls.id);
  }

  function handleSelectSubject(sub: SubjectItem) {
    setSelectedSubject(sub);
    setCurrentLevel('chapters');
    setIsAdding(false);
    setEditingId(null);
    setItemName('');
    setSearchQuery('');
    fetchChapters(sub.id);
  }

  function handleBackToClasses() {
    setCurrentLevel('classes');
    setSelectedClass(null);
    setSelectedSubject(null);
    setIsAdding(false);
    setEditingId(null);
    setItemName('');
    setSearchQuery('');
    fetchClasses();
  }

  function handleBackToSubjects() {
    if (!selectedClass) return;
    setCurrentLevel('subjects');
    setSelectedSubject(null);
    setIsAdding(false);
    setEditingId(null);
    setItemName('');
    setSearchQuery('');
    fetchSubjects(selectedClass.id);
  }

  // Open Chapter Documents Gallery
  function handleOpenChapterDocs(chap: ChapterItem) {
    setViewingDocsChapter(chap);
    fetchChapterScans(chap.id);
  }

  // Handle uploading next page into the chapter
  async function handleFileSelectedForChapter(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || !e.target.files[0] || !viewingDocsChapter) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      const base64 = reader.result as string;
      setIsUploadingScan(true);
      toast.info('Uploading and performing AI OCR for new page...');

      try {
        // 1. Create Scan Record
        const resScan = await fetch(`${API_URL}/api/scans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            image_url: base64,
            doc_type: 'chapter_page',
            chapter_id: viewingDocsChapter.id,
            subject_id: selectedSubject?.id,
            class_id: selectedClass?.id,
          }),
        });
        const scanData = await resScan.json();
        if (!resScan.ok) throw new Error(scanData.error || 'Failed to create scan record');

        const newScanId = scanData.data?.id;

        // 2. Trigger OCR Process
        if (newScanId) {
          await fetch(`${API_URL}/api/scans/${newScanId}/process`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        }

        toast.success(`Page ${chapterScans.length + 1} added & OCR completed!`);
        fetchChapterScans(viewingDocsChapter.id);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to upload document');
      } finally {
        setIsUploadingScan(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  }

  // Delete a scanned page
  async function handleDeleteScan(scanId: string, pageNum: number) {
    if (!confirm(`Delete Page ${pageNum}?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/scans/${scanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete page');

      setChapterScans((prev) => prev.filter((s) => s.id !== scanId));
      toast.success(`Page ${pageNum} deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting page');
    }
  }

  // --- CRUD Operations ---

  // CREATE
  async function handleCreateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName.trim()) return;

    try {
      if (currentLevel === 'classes') {
        const res = await fetch(`${API_URL}/api/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: itemName.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create class');
        setClasses((prev) => [...prev, data.data]);
        toast.success(`Class "${data.data.name}" created!`);
      } else if (currentLevel === 'subjects' && selectedClass) {
        const res = await fetch(`${API_URL}/api/subjects`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: itemName.trim(), class_id: selectedClass.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create subject');
        setSubjects((prev) => [...prev, data.data]);
        toast.success(`Subject "${data.data.name}" added to ${selectedClass.name}!`);
      } else if (currentLevel === 'chapters' && selectedSubject) {
        const res = await fetch(`${API_URL}/api/chapters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: itemName.trim(), subject_id: selectedSubject.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create chapter');
        setChapters((prev) => [...prev, data.data]);
        toast.success(`Chapter "${data.data.title}" added to ${selectedSubject.name}!`);
      }

      setItemName('');
      setIsAdding(false);
    } catch (err: any) {
      toast.error(err.message || 'Action failed');
    }
  }

  // UPDATE / EDIT
  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;

    try {
      if (currentLevel === 'classes') {
        const res = await fetch(`${API_URL}/api/classes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: editName.trim() }),
        });
        if (!res.ok) throw new Error('Failed to update class');
        setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, name: editName.trim() } : c)));
        if (selectedClass?.id === id) setSelectedClass((prev) => (prev ? { ...prev, name: editName.trim() } : null));
        toast.success('Class updated');
      } else if (currentLevel === 'subjects') {
        const res = await fetch(`${API_URL}/api/subjects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: editName.trim() }),
        });
        if (!res.ok) throw new Error('Failed to update subject');
        setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name: editName.trim() } : s)));
        if (selectedSubject?.id === id) setSelectedSubject((prev) => (prev ? { ...prev, name: editName.trim() } : null));
        toast.success('Subject updated');
      } else if (currentLevel === 'chapters') {
        const res = await fetch(`${API_URL}/api/chapters/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ title: editName.trim() }),
        });
        if (!res.ok) throw new Error('Failed to update chapter');
        setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, title: editName.trim() } : c)));
        toast.success('Chapter updated');
      }

      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      toast.error(err.message || 'Error updating item');
    }
  }

  // DELETE
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      if (currentLevel === 'classes') {
        const res = await fetch(`${API_URL}/api/classes/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete class');
        setClasses((prev) => prev.filter((c) => c.id !== id));
        toast.success(`Class "${name}" deleted`);
      } else if (currentLevel === 'subjects') {
        const res = await fetch(`${API_URL}/api/subjects/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete subject');
        setSubjects((prev) => prev.filter((s) => s.id !== id));
        toast.success(`Subject "${name}" deleted`);
      } else if (currentLevel === 'chapters') {
        const res = await fetch(`${API_URL}/api/chapters/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to delete chapter');
        setChapters((prev) => prev.filter((c) => c.id !== id));
        toast.success(`Chapter "${name}" deleted`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error deleting item');
    }
  }

  // Filtered Lists
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredChapters = chapters.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Hidden File Input for uploading pages into a chapter */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelectedForChapter}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* TOP BREADCRUMB & NAVIGATION BAR                                           */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <button
              onClick={handleBackToClasses}
              className={`hover:text-primary transition-colors flex items-center gap-1 ${
                currentLevel === 'classes' ? 'text-primary font-bold' : ''
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Classes
            </button>

            {selectedClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-border" />
                <button
                  onClick={handleBackToSubjects}
                  className={`hover:text-primary transition-colors flex items-center gap-1 ${
                    currentLevel === 'subjects' ? 'text-primary font-bold' : ''
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> {selectedClass.name}
                </button>
              </>
            )}

            {selectedSubject && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-border" />
                <span className="text-primary font-bold flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5" /> {selectedSubject.name}
                </span>
              </>
            )}
          </div>

          {/* Heading */}
          <div className="flex items-center gap-3">
            {currentLevel !== 'classes' && (
              <Button
                variant="outline"
                size="sm"
                onClick={currentLevel === 'chapters' ? handleBackToSubjects : handleBackToClasses}
                className="h-8 px-2.5 rounded-xl border-border text-foreground hover:bg-[#FFF1DA]/30 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1 text-muted-foreground" /> Back
              </Button>
            )}

            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">
              {currentLevel === 'classes' && 'All Classes / Grades'}
              {currentLevel === 'subjects' && `${selectedClass?.name} — Subjects`}
              {currentLevel === 'chapters' && `${selectedSubject?.name} — Chapters`}
            </h1>
          </div>
        </div>

        {/* Action Header Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setIsAdding(!isAdding);
              setItemName('');
            }}
            className="h-9 px-4 rounded-xl gradient-brand text-white font-bold text-xs shadow-[0_4px_14px_rgba(223,105,81,0.3)] hover:opacity-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {currentLevel === 'classes' && 'Add New Class'}
            {currentLevel === 'subjects' && 'Add New Subject'}
            {currentLevel === 'chapters' && 'Add New Chapter'}
          </Button>
        </div>
      </div>

      {/* Quick Add Form */}
      {isAdding && (
        <Card className="rounded-3xl border border-[#F1A501]/30 bg-card shadow-[0_10px_30px_rgba(24,30,75,0.04)] p-4 sm:p-5 animate-slide-down">
          <form onSubmit={handleCreateItem} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                {currentLevel === 'classes' && 'Create a New Class / Grade'}
                {currentLevel === 'subjects' && `Add a Subject to ${selectedClass?.name}`}
                {currentLevel === 'chapters' && `Add a Chapter / Topic to ${selectedSubject?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder={
                  currentLevel === 'classes'
                    ? 'e.g. Class 10, Grade 8, Nursery...'
                    : currentLevel === 'subjects'
                    ? 'e.g. Mathematics, Science, Social Studies...'
                    : 'e.g. Chapter 1 - Real Numbers, Quadratic Equations...'
                }
                className="h-10 text-sm bg-card rounded-xl border-border focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <Button type="submit" className="h-10 px-5 rounded-xl gradient-brand text-white font-bold text-xs shrink-0 cursor-pointer shadow-[0_4px_14px_rgba(223,105,81,0.3)]">
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${currentLevel}...`}
          className="h-10 pl-10 rounded-xl bg-card border-border text-xs text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: CLASSES VIEW                                                     */}
      {/* ========================================================================= */}
      {currentLevel === 'classes' && (
        <div>
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading classes...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-3xl bg-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1DA] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-base">No Classes Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Get started by adding your first school grade or class.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer shadow-[0_4px_12px_rgba(223,105,81,0.25)]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Class
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredClasses.map((cls) => {
                const isEditing = editingId === cls.id;

                return (
                  <div
                    key={cls.id}
                    onClick={() => {
                      if (!isEditing) handleSelectClass(cls);
                    }}
                    className="group relative bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-[0_10px_30px_rgba(24,30,75,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl gradient-brand text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {cls.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingId(cls.id);
                              setEditName(cls.name);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#FFF1DA]/60 transition-colors cursor-pointer"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, cls.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete class"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Name / Edit Form */}
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-7 text-xs bg-card rounded-lg border-border"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(cls.id)} className="h-7 px-2 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-muted-foreground cursor-pointer">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-heading font-bold text-foreground text-base mt-3 tracking-tight group-hover:text-primary transition-colors truncate">
                          {cls.name}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-2 border-t border-border mt-2">
                      <span className="text-[11px] text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        View Subjects →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: SUBJECTS VIEW (FOR SELECTED CLASS)                               */}
      {/* ========================================================================= */}
      {currentLevel === 'subjects' && selectedClass && (
        <div>
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Loading subjects in {selectedClass.name}...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-3xl bg-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1DA] flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-base">No Subjects in {selectedClass.name}</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Add subjects like Mathematics, English, or Science to this class.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer shadow-[0_4px_12px_rgba(223,105,81,0.25)]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Subject
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSubjects.map((sub) => {
                const isEditing = editingId === sub.id;

                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      if (!isEditing) handleSelectSubject(sub);
                    }}
                    className="group relative bg-card border border-border hover:border-primary/40 rounded-2xl p-5 shadow-[0_10px_30px_rgba(24,30,75,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F1A501] to-[#DF6951] text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingId(sub.id);
                              setEditName(sub.name);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#FFF1DA]/60 transition-colors cursor-pointer"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Name / Edit Form */}
                      {isEditing ? (
                        <div className="mt-2 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-7 text-xs bg-card rounded-lg border-border"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(sub.id)} className="h-7 px-2 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-muted-foreground cursor-pointer">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-heading font-bold text-foreground text-base mt-3 tracking-tight group-hover:text-primary transition-colors truncate">
                          {sub.name}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground pt-2 border-t border-border mt-2">
                      <span className="text-[11px] text-primary font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Manage Chapters →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: CHAPTERS VIEW (FOR SELECTED SUBJECT)                             */}
      {/* ========================================================================= */}
      {currentLevel === 'chapters' && selectedSubject && (
        <div>
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#F1A501]" />
              <p className="text-xs text-muted-foreground font-medium">Loading chapters in {selectedSubject.name}...</p>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-3xl bg-card space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF1DA] flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-[#F1A501]" />
              </div>
              <h3 className="font-heading font-bold text-foreground text-base">No Chapters in {selectedSubject.name}</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Add textbook chapters or lessons for this subject syllabus.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer shadow-[0_4px_12px_rgba(223,105,81,0.25)]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Chapter
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredChapters.map((chap, idx) => {
                const isEditing = editingId === chap.id;

                return (
                  <div
                    key={chap.id}
                    className="group bg-card border border-border hover:border-primary/40 rounded-2xl p-4 shadow-[0_4px_12px_rgba(24,30,75,0.02)] hover:shadow-xs transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 mr-4 truncate">
                      <span className="w-7 h-7 rounded-xl bg-[#FFF1DA] border border-[#F1A501]/30 text-[#DF6951] font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-xs bg-card rounded-lg border-border"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(chap.id)} className="h-8 px-2.5 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 px-2 rounded-lg text-muted-foreground cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-heading font-semibold text-foreground text-sm truncate">
                          {chap.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons: View Documents (Left of Edit) -> Edit -> Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* VIEW DOCUMENTS BUTTON (Left of Edit) */}
                      <button
                        onClick={() => handleOpenChapterDocs(chap)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF1DA]/60 text-primary hover:bg-[#FFF1DA] text-xs font-bold transition-colors cursor-pointer border border-[#F1A501]/30"
                        title="View & manage scanned pages of this chapter"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>View Documents</span>
                      </button>

                      {/* EDIT BUTTON */}
                      <button
                        onClick={() => {
                          setEditingId(chap.id);
                          setEditName(chap.title);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-[#FFF1DA]/60 transition-colors cursor-pointer"
                        title="Edit title"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDelete(chap.id, chap.title)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete chapter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAPTER DOCUMENTS GALLERY MODAL                                           */}
      {/* ========================================================================= */}
      {viewingDocsChapter && (
        <div className="fixed inset-0 z-50 bg-[#181E4B]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-2xl border border-border w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-wide">
                  <FileScan className="w-3.5 h-3.5" /> Scanned Pages Sequence
                </div>
                <h2 className="text-lg font-heading font-black text-foreground">
                  {viewingDocsChapter.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedClass?.name} • {selectedSubject?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingScan}
                  className="h-8 px-3 text-xs gradient-brand text-white font-bold rounded-xl cursor-pointer shadow-[0_4px_12px_rgba(223,105,81,0.25)]"
                >
                  {isUploadingScan ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1" /> + Add Next Page (Page {chapterScans.length + 1})
                    </>
                  )}
                </Button>

                <button
                  onClick={() => setViewingDocsChapter(null)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-border/40 flex items-center justify-center text-muted-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scans Grid in Sequential Order */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingScans ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">Loading pages in sequence...</p>
                </div>
              ) : chapterScans.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-3xl bg-muted/20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF1DA] flex items-center justify-center">
                    <FileScan className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-foreground text-sm">No Scanned Documents Yet</h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Upload photos of textbook pages or worksheets in the order you want them saved.
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gradient-brand text-white font-bold rounded-xl cursor-pointer shadow-[0_4px_12px_rgba(223,105,81,0.25)]"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload Page 1
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {chapterScans.map((scan, sIdx) => {
                      const isPdf = scan.image_url?.toLowerCase().includes('.pdf') || scan.image_url?.includes('application/pdf');

                      return (
                        <div
                          key={scan.id}
                          className="bg-card border border-border hover:border-primary/40 rounded-2xl p-3 space-y-2 relative group transition-all shadow-[0_4px_12px_rgba(24,30,75,0.02)]"
                        >
                          {/* Document Preview Thumbnail (PDF or Image) */}
                          <div
                            onClick={() => window.open(`/document-viewer?url=${encodeURIComponent(scan.image_url)}`, '_blank')}
                            className="w-full h-40 bg-card rounded-xl border border-border overflow-hidden relative cursor-pointer group-hover:shadow-xs flex items-center justify-center"
                          >
                            {isPdf ? (
                              <div className="w-full h-full bg-gradient-to-br from-[#FFF1DA]/60 to-[#FFFDFB] flex flex-col items-center justify-center p-3 text-center">
                                <div className="w-12 h-12 rounded-2xl gradient-brand text-white flex items-center justify-center font-black text-sm shadow-md mb-2">
                                  PDF
                                </div>
                                <span className="text-xs font-bold text-foreground line-clamp-1">
                                  Page {sIdx + 1} Document
                                </span>
                                <span className="text-[10px] text-primary font-semibold mt-0.5">
                                  Click to Preview PDF
                                </span>
                              </div>
                            ) : (
                              <img
                                src={scan.image_url}
                                alt={`Page ${sIdx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                            <div className="absolute inset-0 bg-[#181E4B]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <Maximize2 className="w-4 h-4" /> {isPdf ? 'Open PDF' : 'Full View'}
                            </div>
                          </div>

                          {/* Sequence Label & Status */}
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-lg gradient-brand text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {sIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-foreground">
                                Page {sIdx + 1}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setViewingOcrDoc({
                                    pageNum: sIdx + 1,
                                    text: scan.raw_ocr_text || 'No text extracted yet for this page.',
                                    imageUrl: scan.image_url,
                                  })
                                }
                                className="text-[10px] font-bold text-primary bg-[#FFF1DA]/60 hover:bg-[#FFF1DA] border border-[#F1A501]/30 px-2 py-1 rounded-md transition-colors cursor-pointer"
                                title="View extracted OCR text"
                              >
                                <FileText className="w-3 h-3 inline mr-0.5" /> Text
                              </button>

                              <button
                                onClick={() => handleDeleteScan(scan.id, sIdx + 1)}
                                className="p-1 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete page"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-muted/40 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{chapterScans.length} pages attached in sequential order</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingDocsChapter(null)}
                className="h-8 rounded-xl cursor-pointer"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Extracted OCR Text Viewer Modal */}
      {viewingOcrDoc && (
        <div
          onClick={() => setViewingOcrDoc(null)}
          className="fixed inset-0 z-60 bg-[#181E4B]/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            className="relative w-full max-w-2xl max-h-[85vh] bg-card rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-scale-up border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF1DA] text-primary flex items-center justify-center font-bold text-xs">
                  P{viewingOcrDoc.pageNum}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Extracted Verbatim Text (Page {viewingOcrDoc.pageNum})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">OCR text extracted from document scan</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(viewingOcrDoc.text);
                    toast.success('Copied page text to clipboard!');
                  }}
                  className="h-8 text-xs cursor-pointer"
                >
                  <Copy className="w-3 h-3 mr-1" /> Copy Text
                </Button>
                <button
                  onClick={() => setViewingOcrDoc(null)}
                  className="w-8 h-8 rounded-full bg-muted hover:bg-border/40 flex items-center justify-center text-muted-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground bg-muted/20">
              {viewingOcrDoc.text}
            </div>

            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>{viewingOcrDoc.text.split(/\s+/).filter(Boolean).length} words extracted</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewingOcrDoc(null)}
                className="h-8 text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
