'use client';

import { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  Bookmark,
  Plus,
  GripVertical,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AcademicStructurePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjectsMap, setSubjectsMap] = useState<Record<string, any[]>>({});
  const [chaptersMap, setChaptersMap] = useState<Record<string, any[]>>({});

  // Tree expansion state
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});

  // Quick Add panel states
  const [activeTab, setActiveTab] = useState<'class' | 'subject' | 'chapter'>('class');
  const [newClassName, setNewClassName] = useState('');
  const [quickAddClassId, setQuickAddClassId] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [quickAddChapterClassId, setQuickAddChapterClassId] = useState('');
  const [quickAddChapterSubjectId, setQuickAddChapterSubjectId] = useState('');
  const [newChapterName, setNewChapterName] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState('');

  // Action menu state for dropdown actions
  const [activeMenu, setActiveMenu] = useState<{ type: 'class' | 'subject' | 'chapter'; id: string } | null>(null);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : null;
    if (tokenStr) {
      setToken(tokenStr);
      loadAllStructure(tokenStr);
    }
  }, []);

  async function loadAllStructure(authToken: string) {
    setIsLoading(true);
    try {
      // 1. Fetch Classes
      const resClasses = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const dataClasses = await resClasses.json();
      const classList = dataClasses.data || [];
      setClasses(classList);

      if (classList.length > 0) {
        setQuickAddClassId(classList[0].id);
        setQuickAddChapterClassId(classList[0].id);

        // Auto expand all classes by default for easy exploration
        const initialClassExpansion: Record<string, boolean> = {};
        classList.forEach((c: any) => {
          initialClassExpansion[c.id] = true;
        });
        setExpandedClasses(initialClassExpansion);

        // 2. Fetch Subjects for all classes
        const sMap: Record<string, any[]> = {};
        const cMap: Record<string, any[]> = {};
        const initialSubExpansion: Record<string, boolean> = {};

        for (const cls of classList) {
          const resSub = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/subjects?class_id=${cls.id}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          const dataSub = await resSub.json();
          const subs = dataSub.data || [];
          sMap[cls.id] = subs;

          // Fetch chapters for these subjects
          for (const sub of subs) {
            initialSubExpansion[sub.id] = true;
            const resChap = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/chapters?subject_id=${sub.id}`,
              { headers: { Authorization: `Bearer ${authToken}` } }
            );
            const dataChap = await resChap.json();
            cMap[sub.id] = dataChap.data || [];
          }
        }

        setSubjectsMap(sMap);
        setChaptersMap(cMap);
        setExpandedSubjects(initialSubExpansion);

        // Set default subject for chapter quick add if exists
        const firstClassSubs = sMap[classList[0].id] || [];
        if (firstClassSubs.length > 0) {
          setQuickAddChapterSubjectId(firstClassSubs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load academic structure');
    } finally {
      setIsLoading(false);
    }
  }

  // Toggle Class expansion
  async function toggleClass(classId: string) {
    const nextState = !expandedClasses[classId];
    setExpandedClasses((prev) => ({ ...prev, [classId]: nextState }));

    if (nextState && !subjectsMap[classId]) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/subjects?class_id=${classId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setSubjectsMap((prev) => ({ ...prev, [classId]: data.data || [] }));
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Toggle Subject expansion
  async function toggleSubject(subjectId: string) {
    const nextState = !expandedSubjects[subjectId];
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: nextState }));

    if (nextState && !chaptersMap[subjectId]) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/chapters?subject_id=${subjectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        setChaptersMap((prev) => ({ ...prev, [subjectId]: data.data || [] }));
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Quick Add: Class
  async function handleAddClass(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newClassName.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newClassName.trim(), order_index: classes.length }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Class added successfully');
        setNewClassName('');
        const updated = [...classes, data.data];
        setClasses(updated);
        setSubjectsMap((prev) => ({ ...prev, [data.data.id]: [] }));
        setExpandedClasses((prev) => ({ ...prev, [data.data.id]: true }));
        if (!quickAddClassId) {
          setQuickAddClassId(data.data.id);
          setQuickAddChapterClassId(data.data.id);
        }
      } else {
        toast.error(data.error || 'Failed to add class');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Quick Add: Subject
  async function handleAddSubject(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!quickAddClassId) {
      toast.error('Please select a Class first');
      return;
    }
    if (!newSubjectName.trim()) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSubjectName.trim(), class_id: quickAddClassId }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Subject added successfully');
        setNewSubjectName('');
        const currentSubs = subjectsMap[quickAddClassId] || [];
        const updated = [...currentSubs, data.data];
        setSubjectsMap((prev) => ({ ...prev, [quickAddClassId]: updated }));
        setChaptersMap((prev) => ({ ...prev, [data.data.id]: [] }));
        setExpandedClasses((prev) => ({ ...prev, [quickAddClassId]: true }));
        setExpandedSubjects((prev) => ({ ...prev, [data.data.id]: true }));
        setQuickAddChapterClassId(quickAddClassId);
        setQuickAddChapterSubjectId(data.data.id);
      } else {
        toast.error(data.error || 'Failed to add subject');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Quick Add: Chapter
  async function handleAddChapter(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!quickAddChapterSubjectId) {
      toast.error('Please select a Subject first');
      return;
    }
    if (!newChapterName.trim()) return;

    try {
      const currentChaps = chaptersMap[quickAddChapterSubjectId] || [];
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newChapterName.trim(),
          subject_id: quickAddChapterSubjectId,
          order_index: currentChaps.length,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Chapter added successfully');
        setNewChapterName('');
        const updated = [...currentChaps, data.data];
        setChaptersMap((prev) => ({ ...prev, [quickAddChapterSubjectId]: updated }));
        setExpandedSubjects((prev) => ({ ...prev, [quickAddChapterSubjectId]: true }));
      } else {
        toast.error(data.error || 'Failed to add chapter');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Delete handlers
  async function handleDeleteClass(id: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/classes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Class deleted');
        setClasses((prev) => prev.filter((c) => c.id !== id));
        setActiveMenu(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteSubject(classId: string, subjectId: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Subject deleted');
        setSubjectsMap((prev) => ({
          ...prev,
          [classId]: (prev[classId] || []).filter((s) => s.id !== subjectId),
        }));
        setActiveMenu(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteChapter(subjectId: string, chapterId: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chapters/${chapterId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Chapter deleted');
        setChaptersMap((prev) => ({
          ...prev,
          [subjectId]: (prev[subjectId] || []).filter((c) => c.id !== chapterId),
        }));
        setActiveMenu(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Summary Metrics
  let totalSubjects = 0;
  Object.values(subjectsMap).forEach((list) => {
    totalSubjects += list.length;
  });
  let totalChapters = 0;
  Object.values(chaptersMap).forEach((list) => {
    totalChapters += list.length;
  });

  const subjectsForChapterSelect = quickAddChapterClassId
    ? subjectsMap[quickAddChapterClassId] || []
    : [];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">Loading Academic Structure Explorer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Top Banner & Header with Summary Badges */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 mb-6 sm:mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5">
              <span>Academics</span>
              <span>›</span>
              <span>School Set-up</span>
              <span>›</span>
              <span className="text-slate-900 font-bold">Structure</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Academic Structure
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Design and manage class, subject, and chapter hierarchies.
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start md:self-auto font-mono">
            <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Classes</div>
                <div className="text-sm font-bold text-indigo-900">{classes.length}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Subjects</div>
                <div className="text-sm font-bold text-blue-900">{totalSubjects}</div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="text-[10px] text-slate-500 uppercase">Chapters</div>
                <div className="text-sm font-bold text-emerald-900">{totalChapters}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Step Progress Line */}
        <div className="relative flex items-center justify-between px-16 max-w-4xl mx-auto">
          <div className="absolute left-16 right-16 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-indigo-600 ring-4 ring-indigo-100 flex items-center justify-center text-[10px] text-white font-bold" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-indigo-600" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-indigo-600 border-2 border-indigo-600" />
          </div>
        </div>

        {/* Main 2-Column Split: Explorer Table on Left (68%) + Quick Add Card on Right (32%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Academic Structure Explorer (Tree-Grid Table) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-base font-bold text-slate-900">Academic Structure Explorer</h2>
              <span className="text-xs text-slate-400 font-mono">Click rows to expand / collapse</span>
            </div>

            <div className="overflow-x-auto w-full">
              <div className="min-w-[620px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 px-6 py-3 bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  <div className="col-span-4">Class (Levels)</div>
                  <div className="col-span-4">Subject (per Class)</div>
                  <div className="col-span-3">Chapter (per Subject)</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

            {/* Table Rows & Expandable Hierarchy */}
            <div className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No classes created yet. Use the Quick Add panel on the right to start building your academic structure!
                </div>
              ) : (
                classes.map((cls) => {
                  const isClassExpanded = !!expandedClasses[cls.id];
                  const classSubjects = subjectsMap[cls.id] || [];

                  return (
                    <div key={cls.id} className="group/class">
                      {/* Class Level Row */}
                      <div
                        className={`grid grid-cols-12 items-center px-6 py-3.5 transition-colors cursor-pointer ${
                          isClassExpanded ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'
                        }`}
                        onClick={() => toggleClass(cls.id)}
                      >
                        {/* Class Column */}
                        <div className="col-span-4 flex items-center gap-2">
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleClass(cls.id);
                            }}
                          >
                            {isClassExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                          <span className="text-xs font-bold text-slate-800">{cls.name}</span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1 font-mono">
                            {classSubjects.length} Subjects
                          </span>
                        </div>

                        {/* Middle Subjects Preview / Indicator */}
                        <div className="col-span-4 text-xs text-slate-400">
                          {!isClassExpanded && classSubjects.length === 0 && (
                            <span className="italic text-[11px]">No Subjects yet</span>
                          )}
                        </div>

                        {/* Chapters Column Placeholder */}
                        <div className="col-span-3 text-xs text-slate-400"></div>

                        {/* Actions */}
                        <div
                          className="col-span-1 flex items-center justify-end gap-1.5 relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Add Subject to Class"
                            onClick={() => {
                              setQuickAddClassId(cls.id);
                              setActiveTab('subject');
                              const input = document.getElementById('quick-add-subject-input');
                              if (input) input.focus();
                            }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenu(
                                  activeMenu?.id === cls.id ? null : { type: 'class', id: cls.id }
                                )
                              }
                              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenu?.id === cls.id && (
                              <div className="absolute right-0 top-7 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                                <button
                                  onClick={() => handleDeleteClass(cls.id)}
                                  className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nested Subjects (when Class is expanded) */}
                      {isClassExpanded && (
                        <div className="bg-slate-50/20 border-l-2 border-indigo-200 ml-9 my-1">
                          {classSubjects.length === 0 ? (
                            <div className="px-6 py-3 text-xs text-slate-400 italic">
                              No subjects in {cls.name}. Click (+) on right to add a subject.
                            </div>
                          ) : (
                            classSubjects.map((sub) => {
                              const isSubExpanded = !!expandedSubjects[sub.id];
                              const subChapters = chaptersMap[sub.id] || [];

                              return (
                                <div key={sub.id} className="group/subject">
                                  {/* Subject Level Row */}
                                  <div
                                    className={`grid grid-cols-12 items-center px-4 py-2.5 transition-colors cursor-pointer ${
                                      isSubExpanded ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                                    }`}
                                    onClick={() => toggleSubject(sub.id)}
                                  >
                                    <div className="col-span-3"></div>

                                    {/* Subject Column */}
                                    <div className="col-span-5 flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="p-0.5 rounded text-slate-400 hover:text-slate-700"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubject(sub.id);
                                        }}
                                      >
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <span className="text-xs font-semibold text-slate-800">
                                        {sub.name}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-mono">
                                        {subChapters.length} Chapters
                                      </span>
                                    </div>

                                    <div className="col-span-3"></div>

                                    {/* Subject Actions */}
                                    <div
                                      className="col-span-1 flex items-center justify-end gap-1.5 relative"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        title="Add Chapter to Subject"
                                        onClick={() => {
                                          setQuickAddChapterClassId(cls.id);
                                          setQuickAddChapterSubjectId(sub.id);
                                          setActiveTab('chapter');
                                          const input = document.getElementById('quick-add-chapter-input');
                                          if (input) input.focus();
                                        }}
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                      </button>

                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setActiveMenu(
                                              activeMenu?.id === sub.id
                                                ? null
                                                : { type: 'subject', id: sub.id }
                                            )
                                          }
                                          className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                                        >
                                          <MoreVertical className="w-3.5 h-3.5" />
                                        </button>

                                        {activeMenu?.id === sub.id && (
                                          <div className="absolute right-0 top-7 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 text-xs">
                                            <button
                                              onClick={() => handleDeleteSubject(cls.id, sub.id)}
                                              className="w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" /> Delete
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Nested Chapters (when Subject is expanded) */}
                                  {isSubExpanded && (
                                    <div className="border-l-2 border-indigo-200 ml-8 my-1">
                                      {subChapters.length === 0 ? (
                                        <div className="px-4 py-2 text-[11px] text-slate-400 italic">
                                          No chapters in {sub.name}. Click (+) to add a chapter.
                                        </div>
                                      ) : (
                                        subChapters.map((chap, idx) => (
                                          <div
                                            key={chap.id}
                                            className="grid grid-cols-12 items-center px-4 py-2 hover:bg-slate-50 text-xs group/chap"
                                          >
                                            <div className="col-span-8"></div>

                                            {/* Chapter Column */}
                                            <div className="col-span-3 flex items-center gap-2">
                                              <GripVertical className="w-3 h-3 text-slate-300 group-hover/chap:text-slate-500" />
                                              <span className="text-slate-700 font-medium truncate">
                                                {chap.title}
                                              </span>
                                            </div>

                                            {/* Chapter Actions */}
                                            <div className="col-span-1 flex items-center justify-end relative">
                                              <button
                                                onClick={() => handleDeleteChapter(sub.id, chap.id)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover/chap:opacity-100 transition-opacity cursor-pointer"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            </div>
            </div>
          </div>

          {/* RIGHT: Quick Add Panel (32%) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900">Quick Add</h2>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('class')}
                className={`pb-2.5 px-3 -mb-px transition-colors cursor-pointer ${
                  activeTab === 'class'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Class
              </button>
              <button
                onClick={() => setActiveTab('subject')}
                className={`pb-2.5 px-3 -mb-px transition-colors cursor-pointer ${
                  activeTab === 'subject'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Subject
              </button>
              <button
                onClick={() => setActiveTab('chapter')}
                className={`pb-2.5 px-3 -mb-px transition-colors cursor-pointer ${
                  activeTab === 'chapter'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Chapter
              </button>
            </div>

            {/* Form Section 1: Add Class */}
            <div className="space-y-3">
              <form onSubmit={handleAddClass} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Add Class Name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newClassName.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  Add Class
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              {/* Form Section 2: Add Subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  CLASS:
                </label>
                <div className="relative">
                  <select
                    value={quickAddClassId}
                    onChange={(e) => setQuickAddClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <form onSubmit={handleAddSubject} className="flex items-center gap-2">
                <input
                  id="quick-add-subject-input"
                  type="text"
                  disabled={!quickAddClassId}
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="Add Subject Name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!quickAddClassId || !newSubjectName.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  Add Subject
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3">
              {/* Form Section 3: Add Chapter */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    CLASS:
                  </label>
                  <div className="relative">
                    <select
                      value={quickAddChapterClassId}
                      onChange={(e) => {
                        setQuickAddChapterClassId(e.target.value);
                        const subs = subjectsMap[e.target.value] || [];
                        if (subs.length > 0) setQuickAddChapterSubjectId(subs[0].id);
                        else setQuickAddChapterSubjectId('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                    >
                      <option value="">-- Class --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    SUBJECT:
                  </label>
                  <div className="relative">
                    <select
                      value={quickAddChapterSubjectId}
                      disabled={!quickAddChapterClassId || subjectsForChapterSelect.length === 0}
                      onChange={(e) => setQuickAddChapterSubjectId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-50"
                    >
                      <option value="">-- Subject --</option>
                      {subjectsForChapterSelect.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <form onSubmit={handleAddChapter} className="flex items-center gap-2">
                <input
                  id="quick-add-chapter-input"
                  type="text"
                  disabled={!quickAddChapterSubjectId}
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  placeholder="New Chapter Name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!quickAddChapterSubjectId || !newChapterName.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1 transition-colors whitespace-nowrap disabled:opacity-50 cursor-pointer"
                >
                  Add Chapter
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
