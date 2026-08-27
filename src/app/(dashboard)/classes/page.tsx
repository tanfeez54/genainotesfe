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
  CheckCircle2,
  FolderPlus,
  FilePlus,
  Edit2
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

export default function AcademicStructurePage() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, SubjectItem[]>>({});
  const [chaptersMap, setChaptersMap] = useState<Record<string, ChapterItem[]>>({});

  // Active Selection
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Input states for adding new items
  const [newClassName, setNewClassName] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const [newChapterName, setNewChapterName] = useState('');
  const [isAddingChapter, setIsAddingChapter] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      loadAllStructure(tokenStr);
    }
  }, []);

  async function loadAllStructure(authToken: string) {
    setIsLoading(true);
    try {
      // 1. Fetch Classes
      const resClasses = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataClasses = await resClasses.json();
      const classList: ClassItem[] = dataClasses.data || [];
      setClasses(classList);

      if (classList.length > 0) {
        const firstClassId = classList[0].id;
        setSelectedClassId(firstClassId);

        // 2. Fetch Subjects for all classes
        const sMap: Record<string, SubjectItem[]> = {};
        const cMap: Record<string, ChapterItem[]> = {};

        for (const cls of classList) {
          const resSub = await fetch(`${API_URL}/api/subjects?class_id=${cls.id}`, {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const dataSub = await resSub.json();
          const subs: SubjectItem[] = dataSub.data || [];
          sMap[cls.id] = subs;

          // Fetch chapters for these subjects
          for (const sub of subs) {
            const resChap = await fetch(`${API_URL}/api/chapters?subject_id=${sub.id}`, {
              headers: { Authorization: `Bearer ${authToken}` },
            });
            const dataChap = await resChap.json();
            cMap[sub.id] = dataChap.data || [];
          }
        }

        setSubjectsMap(sMap);
        setChaptersMap(cMap);

        // Set active subject if available
        if (sMap[firstClassId] && sMap[firstClassId].length > 0) {
          setSelectedSubjectId(sMap[firstClassId][0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load academic structure');
    } finally {
      setIsLoading(false);
    }
  }

  // --- CRUD Operations ---

  // 1. Create Class
  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create class');

      const created = data.data;
      setClasses((prev) => [...prev, created]);
      setSubjectsMap((prev) => ({ ...prev, [created.id]: [] }));
      setSelectedClassId(created.id);
      setSelectedSubjectId('');
      setNewClassName('');
      setIsAddingClass(false);
      toast.success(`Class "${created.name}" created!`);
    } catch (err: any) {
      toast.error(err.message || 'Error creating class');
    }
  }

  // 2. Delete Class
  async function handleDeleteClass(classId: string, className: string) {
    if (!confirm(`Are you sure you want to delete "${className}"? All its subjects and chapters will be deleted.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/classes/${classId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete class');

      const updated = classes.filter((c) => c.id !== classId);
      setClasses(updated);

      if (selectedClassId === classId) {
        if (updated.length > 0) {
          setSelectedClassId(updated[0].id);
          const firstSub = subjectsMap[updated[0].id]?.[0];
          setSelectedSubjectId(firstSub ? firstSub.id : '');
        } else {
          setSelectedClassId('');
          setSelectedSubjectId('');
        }
      }
      toast.success(`Class "${className}" deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting class');
    }
  }

  // 3. Create Subject
  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubjectName.trim() || !selectedClassId) return;

    try {
      const res = await fetch(`${API_URL}/api/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSubjectName.trim(),
          class_id: selectedClassId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subject');

      const created = data.data;
      setSubjectsMap((prev) => ({
        ...prev,
        [selectedClassId]: [...(prev[selectedClassId] || []), created],
      }));
      setChaptersMap((prev) => ({ ...prev, [created.id]: [] }));
      setSelectedSubjectId(created.id);
      setNewSubjectName('');
      setIsAddingSubject(false);
      toast.success(`Subject "${created.name}" added!`);
    } catch (err: any) {
      toast.error(err.message || 'Error creating subject');
    }
  }

  // 4. Delete Subject
  async function handleDeleteSubject(subjectId: string, subjectName: string) {
    if (!confirm(`Delete subject "${subjectName}" and all its chapters?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete subject');

      setSubjectsMap((prev) => ({
        ...prev,
        [selectedClassId]: (prev[selectedClassId] || []).filter((s) => s.id !== subjectId),
      }));

      if (selectedSubjectId === subjectId) {
        const remaining = (subjectsMap[selectedClassId] || []).filter((s) => s.id !== subjectId);
        setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : '');
      }
      toast.success(`Subject "${subjectName}" deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting subject');
    }
  }

  // 5. Create Chapter
  async function handleCreateChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!newChapterName.trim() || !selectedSubjectId) return;

    try {
      const res = await fetch(`${API_URL}/api/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newChapterName.trim(),
          subject_id: selectedSubjectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create chapter');

      const created = data.data;
      setChaptersMap((prev) => ({
        ...prev,
        [selectedSubjectId]: [...(prev[selectedSubjectId] || []), created],
      }));
      setNewChapterName('');
      setIsAddingChapter(false);
      toast.success(`Chapter "${created.title}" added!`);
    } catch (err: any) {
      toast.error(err.message || 'Error creating chapter');
    }
  }

  // 6. Delete Chapter
  async function handleDeleteChapter(chapterId: string, chapterTitle: string) {
    if (!confirm(`Delete chapter "${chapterTitle}"?`)) return;

    try {
      const res = await fetch(`${API_URL}/api/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete chapter');

      setChaptersMap((prev) => ({
        ...prev,
        [selectedSubjectId]: (prev[selectedSubjectId] || []).filter((c) => c.id !== chapterId),
      }));
      toast.success(`Chapter "${chapterTitle}" deleted`);
    } catch (err: any) {
      toast.error(err.message || 'Error deleting chapter');
    }
  }

  // Active items helpers
  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const currentSubjects = selectedClassId ? subjectsMap[selectedClassId] || [] : [];
  const selectedSubject = currentSubjects.find((s) => s.id === selectedSubjectId);
  const currentChapters = selectedSubjectId ? chaptersMap[selectedSubjectId] || [] : [];

  // Summary counts
  const totalClasses = classes.length;
  const totalSubjects = Object.values(subjectsMap).reduce((acc, list) => acc + list.length, 0);
  const totalChapters = Object.values(chaptersMap).reduce((acc, list) => acc + list.length, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <FolderTree className="w-3.5 h-3.5" /> Academic Hierarchy Manager
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Curriculum Structure
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Easily organize Classes, Subjects, and Chapters for your school exams & notes
          </p>
        </div>

        {/* Stats summary pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl shadow-2xs">
          <span className="text-xs font-semibold text-slate-700">
            <strong className="text-indigo-600 font-bold">{totalClasses}</strong> Classes
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-semibold text-slate-700">
            <strong className="text-indigo-600 font-bold">{totalSubjects}</strong> Subjects
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs font-semibold text-slate-700">
            <strong className="text-indigo-600 font-bold">{totalChapters}</strong> Chapters
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading academic structure...</p>
        </div>
      ) : (
        /* 3-Column Miller Column Deck */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* ========================================================= */}
          {/* COLUMN 1: CLASSES / GRADES                                */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Classes / Grades</h2>
                  <p className="text-[11px] text-slate-500">{classes.length} grades defined</p>
                </div>
              </div>

              <Button
                size="sm"
                variant={isAddingClass ? 'secondary' : 'outline'}
                onClick={() => setIsAddingClass(!isAddingClass)}
                className="h-7 text-xs font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Class
              </Button>
            </div>

            {/* Quick Add Form */}
            {isAddingClass && (
              <form onSubmit={handleCreateClass} className="p-3 bg-indigo-50/50 border-b border-indigo-100 space-y-2">
                <div className="text-[11px] font-bold text-indigo-900">New Class / Grade Name:</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Class 9, Grade 10..."
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="h-8 text-xs bg-white rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs gradient-brand text-white rounded-lg">
                    Save
                  </Button>
                </div>
              </form>
            )}

            {/* List of Classes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {classes.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <GraduationCap className="w-8 h-8 mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">No classes added yet.</p>
                  <p className="text-[11px]">Click &ldquo;Add Class&rdquo; above to get started.</p>
                </div>
              ) : (
                classes.map((cls) => {
                  const isSelected = cls.id === selectedClassId;
                  const countSubs = (subjectsMap[cls.id] || []).length;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => {
                        setSelectedClassId(cls.id);
                        const firstSub = (subjectsMap[cls.id] || [])[0];
                        setSelectedSubjectId(firstSub ? firstSub.id : '');
                      }}
                      className={`group flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <GraduationCap className={`w-4 h-4 shrink-0 ${isSelected ? 'text-indigo-200' : 'text-indigo-600'}`} />
                        <span className="truncate">{cls.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected ? 'bg-indigo-700/80 text-indigo-100' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {countSubs} {countSubs === 1 ? 'Subject' : 'Subjects'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClass(cls.id, cls.name);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                            isSelected ? 'hover:bg-indigo-700 text-indigo-200 hover:text-white' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                          }`}
                          title="Delete class"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 2: SUBJECTS (For Selected Class)                   */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedClass ? `Subjects in ${selectedClass.name}` : 'Subjects'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {currentSubjects.length} subjects found
                  </p>
                </div>
              </div>

              {selectedClassId && (
                <Button
                  size="sm"
                  variant={isAddingSubject ? 'secondary' : 'outline'}
                  onClick={() => setIsAddingSubject(!isAddingSubject)}
                  className="h-7 text-xs font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Subject
                </Button>
              )}
            </div>

            {/* Quick Add Form */}
            {isAddingSubject && selectedClassId && (
              <form onSubmit={handleCreateSubject} className="p-3 bg-emerald-50/50 border-b border-emerald-100 space-y-2">
                <div className="text-[11px] font-bold text-emerald-900">
                  New Subject for {selectedClass?.name}:
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Mathematics, Science, English..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="h-8 text-xs bg-white rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs gradient-brand text-white rounded-lg">
                    Save
                  </Button>
                </div>
              </form>
            )}

            {/* List of Subjects */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {!selectedClassId ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <BookOpen className="w-8 h-8 mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">Select a Class on the left to view subjects.</p>
                </div>
              ) : currentSubjects.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <BookOpen className="w-8 h-8 mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">No subjects in {selectedClass?.name}.</p>
                  <p className="text-[11px]">Click &ldquo;Add Subject&rdquo; above to create one.</p>
                </div>
              ) : (
                currentSubjects.map((sub) => {
                  const isSelected = sub.id === selectedSubjectId;
                  const countChaps = (chaptersMap[sub.id] || []).length;

                  return (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubjectId(sub.id)}
                      className={`group flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-50/80 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <BookOpen className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`} />
                        <span className="truncate">{sub.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected ? 'bg-emerald-700/80 text-emerald-100' : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {countChaps} {countChaps === 1 ? 'Chapter' : 'Chapters'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(sub.id, sub.name);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                            isSelected ? 'hover:bg-emerald-700 text-emerald-200 hover:text-white' : 'hover:bg-red-50 text-slate-400 hover:text-red-600'
                          }`}
                          title="Delete subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* COLUMN 3: CHAPTERS (For Selected Subject)                 */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    {selectedSubject ? `Chapters in ${selectedSubject.name}` : 'Chapters'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {currentChapters.length} chapters in syllabus
                  </p>
                </div>
              </div>

              {selectedSubjectId && (
                <Button
                  size="sm"
                  variant={isAddingChapter ? 'secondary' : 'outline'}
                  onClick={() => setIsAddingChapter(!isAddingChapter)}
                  className="h-7 text-xs font-bold rounded-lg border-amber-200 text-amber-800 hover:bg-amber-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Chapter
                </Button>
              )}
            </div>

            {/* Quick Add Form */}
            {isAddingChapter && selectedSubjectId && (
              <form onSubmit={handleCreateChapter} className="p-3 bg-amber-50/50 border-b border-amber-100 space-y-2">
                <div className="text-[11px] font-bold text-amber-900">
                  New Chapter for {selectedSubject?.name}:
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Chapter 1 - Real Numbers..."
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="h-8 text-xs bg-white rounded-lg"
                    autoFocus
                  />
                  <Button type="submit" size="sm" className="h-8 text-xs gradient-brand text-white rounded-lg">
                    Save
                  </Button>
                </div>
              </form>
            )}

            {/* List of Chapters */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {!selectedSubjectId ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <Layers className="w-8 h-8 mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">Select a Subject to view its chapters.</p>
                </div>
              ) : currentChapters.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <Layers className="w-8 h-8 mb-2 opacity-40 text-slate-500" />
                  <p className="text-xs font-medium">No chapters in {selectedSubject?.name} yet.</p>
                  <p className="text-[11px]">Click &ldquo;Add Chapter&rdquo; above to add lessons.</p>
                </div>
              ) : (
                currentChapters.map((chap, idx) => (
                  <div
                    key={chap.id}
                    className="group flex items-center justify-between p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100 text-xs text-slate-800 transition-colors border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{chap.title}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteChapter(chap.id, chap.title)}
                      className="p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                      title="Delete chapter"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
