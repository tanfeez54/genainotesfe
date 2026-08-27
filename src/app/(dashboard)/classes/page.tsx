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
  Maximize2
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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          {/* Breadcrumb Path */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={handleBackToClasses}
              className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${
                currentLevel === 'classes' ? 'text-indigo-600 font-bold' : ''
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Classes
            </button>

            {selectedClass && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <button
                  onClick={handleBackToSubjects}
                  className={`hover:text-indigo-600 transition-colors flex items-center gap-1 ${
                    currentLevel === 'subjects' ? 'text-indigo-600 font-bold' : ''
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> {selectedClass.name}
                </button>
              </>
            )}

            {selectedSubject && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-indigo-600 font-bold flex items-center gap-1">
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
                className="h-8 px-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1 text-slate-600" /> Back
              </Button>
            )}

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
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
            className="h-9 px-4 rounded-xl gradient-brand text-white font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer"
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
        <Card className="rounded-2xl border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white shadow-sm p-4 sm:p-5 animate-slide-down">
          <form onSubmit={handleCreateItem} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {currentLevel === 'classes' && 'Create a New Class / Grade'}
                {currentLevel === 'subjects' && `Add a Subject to ${selectedClass?.name}`}
                {currentLevel === 'chapters' && `Add a Chapter / Topic to ${selectedSubject?.name}`}
              </span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
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
                className="h-10 text-sm bg-white rounded-xl border-indigo-200 focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <Button type="submit" className="h-10 px-5 rounded-xl gradient-brand text-white font-bold text-xs shrink-0 cursor-pointer">
                Save
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${currentLevel}...`}
          className="h-10 pl-10 rounded-xl bg-white border-slate-200 text-xs text-slate-800"
        />
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: CLASSES VIEW                                                     */}
      {/* ========================================================================= */}
      {currentLevel === 'classes' && (
        <div>
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 font-medium">Loading classes...</p>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Classes Found</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Get started by adding your first school grade or class.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer"
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
                    className="group relative bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {cls.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingId(cls.id);
                              setEditName(cls.name);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, cls.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                            className="h-7 text-xs bg-white rounded-lg"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(cls.id)} className="h-7 px-2 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-slate-400 cursor-pointer">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-slate-900 text-base mt-3 tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                          {cls.name}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 mt-2">
                      <span className="text-[11px] text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
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
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-xs text-slate-500 font-medium">Loading subjects in {selectedClass.name}...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Subjects in {selectedClass.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Add subjects like Mathematics, English, or Science to this class.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer"
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
                    className="group relative bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                          {sub.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              setEditingId(sub.id);
                              setEditName(sub.name);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
                            className="h-7 text-xs bg-white rounded-lg"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(sub.id)} className="h-7 px-2 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-slate-400 cursor-pointer">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-slate-900 text-base mt-3 tracking-tight group-hover:text-emerald-600 transition-colors truncate">
                          {sub.name}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100 mt-2">
                      <span className="text-[11px] text-emerald-600 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
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
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <p className="text-xs text-slate-500 font-medium">Loading chapters in {selectedSubject.name}...</p>
            </div>
          ) : filteredChapters.length === 0 ? (
            <div className="h-72 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">No Chapters in {selectedSubject.name}</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Add textbook chapters or lessons for this subject syllabus.
              </p>
              <Button
                onClick={() => setIsAdding(true)}
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold cursor-pointer"
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
                    className="group bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1 mr-4 truncate">
                      <span className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-xs bg-white rounded-lg"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => handleSaveEdit(chap.id)} className="h-8 px-2.5 gradient-brand text-white rounded-lg cursor-pointer">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 px-2 rounded-lg text-slate-400 cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {chap.title}
                        </span>
                      )}
                    </div>

                    {/* Action buttons: View Documents (Left of Edit) -> Edit -> Delete */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* VIEW DOCUMENTS BUTTON (Left of Edit) */}
                      <button
                        onClick={() => handleOpenChapterDocs(chap)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer border border-indigo-100"
                        title="View & manage scanned pages of this chapter"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>View Documents</span>
                      </button>

                      {/* EDIT BUTTON */}
                      <button
                        onClick={() => {
                          setEditingId(chap.id);
                          setEditName(chap.title);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit title"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDelete(chap.id, chap.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-wide">
                  <FileScan className="w-3.5 h-3.5" /> Scanned Pages Sequence
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {viewingDocsChapter.title}
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedClass?.name} • {selectedSubject?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingScan}
                  className="h-8 px-3 text-xs gradient-brand text-white font-bold rounded-xl cursor-pointer"
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
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scans Grid in Sequential Order */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingScans ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs text-slate-500 font-medium">Loading pages in sequence...</p>
                </div>
              ) : chapterScans.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <FileScan className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">No Scanned Documents Yet</h3>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Upload photos of textbook pages or worksheets in the order you want them saved.
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 text-xs gradient-brand text-white font-bold rounded-xl cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> Upload Page 1
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {chapterScans.map((scan, sIdx) => (
                    <div
                      key={scan.id}
                      className="bg-slate-50 border border-slate-200 hover:border-indigo-300 rounded-2xl p-3 space-y-2 relative group transition-all"
                    >
                      {/* Image Thumbnail with zoom trigger */}
                      <div
                        onClick={() => setPreviewImageUrl(scan.image_url)}
                        className="w-full h-40 bg-white rounded-xl border border-slate-200 overflow-hidden relative cursor-pointer group-hover:shadow-xs"
                      >
                        <img
                          src={scan.image_url}
                          alt={`Page ${sIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" /> Full View
                        </div>
                      </div>

                      {/* Sequence Label & Status */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            {sIdx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Page {sIdx + 1}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ready
                          </span>

                          <button
                            onClick={() => handleDeleteScan(scan.id, sIdx + 1)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete page"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
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

      {/* Full-Screen Image Preview Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center hover:bg-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewImageUrl}
              alt="Full Preview"
              className="max-h-[85vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
