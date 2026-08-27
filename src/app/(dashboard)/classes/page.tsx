'use client';

import { useState, useEffect } from 'react';
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
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
                className="h-8 px-2.5 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100"
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

      {/* ========================================================================= */}
      {/* QUICK ADD MODAL / INLINE CARD                                             */}
      {/* ========================================================================= */}
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
                className="text-slate-400 hover:text-slate-600 p-1"
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
              <Button type="submit" className="h-10 px-5 rounded-xl gradient-brand text-white font-bold text-xs shrink-0">
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
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold"
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cls.id, cls.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                          <Button size="sm" onClick={() => handleSaveEdit(cls.id)} className="h-7 px-2 gradient-brand text-white rounded-lg">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-slate-400">
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
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold"
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit name"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(sub.id, sub.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                          <Button size="sm" onClick={() => handleSaveEdit(sub.id)} className="h-7 px-2 gradient-brand text-white rounded-lg">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 px-2 rounded-lg text-slate-400">
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
                className="h-8 text-xs gradient-brand text-white rounded-xl font-bold"
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
                          <Button size="sm" onClick={() => handleSaveEdit(chap.id)} className="h-8 px-2.5 gradient-brand text-white rounded-lg">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 px-2 rounded-lg text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-800 text-sm truncate">
                          {chap.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(chap.id);
                          setEditName(chap.title);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Edit title"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(chap.id, chap.title)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
    </div>
  );
}
