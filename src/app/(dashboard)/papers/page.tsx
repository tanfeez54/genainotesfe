'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Printer,
  Trash2,
  Search,
  Sparkles,
  Plus,
  Loader2,
  Calendar,
  Clock,
  Award,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Eye,
  X,
  FileCheck2,
  Edit3,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutGrid,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { printExamPaper, autoFormatMath } from '@/lib/paperPrinter';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface QuestionPaper {
  id: string;
  title: string;
  class_id?: string;
  subject_id?: string;
  total_marks: number;
  duration_minutes: number;
  time_allowed_minutes?: number;
  status: string;
  blueprint?: any;
  created_at: string;
  classes?: { id: string; name: string };
  subjects?: { id: string; name: string };
}

interface ClassItem {
  id: string;
  name: string;
}

export default function SavedPapersPage() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [classList, setClassList] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedPaperForPreview, setSelectedPaperForPreview] = useState<QuestionPaper | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [collapsedClasses, setCollapsedClasses] = useState<Record<string, boolean>>({});
  const [viewLayout, setViewLayout] = useState<'categorized' | 'grid'>('categorized');
  const router = useRouter();

  const tokenMatch = typeof document !== 'undefined' ? document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)')) : null;
  const token = tokenMatch ? tokenMatch[2] : null;

  const fetchClasses = async (authToken: string) => {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) setClassList(data.data);
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  };

  const fetchPapers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/question-papers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load papers');
      setPapers(data.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch saved question papers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClasses(token);
      fetchPapers();
    }
  }, [token]);

  const handleDeletePaper = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved question paper?')) return;

    setIsDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/api/question-papers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete paper');

      toast.success('Question paper deleted successfully');
      setPapers((prev) => prev.filter((p) => p.id !== id));
      if (selectedPaperForPreview?.id === id) {
        setSelectedPaperForPreview(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete paper');
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleEditPaper = (paper: QuestionPaper) => {
    sessionStorage.setItem('edit_paper_data', JSON.stringify(paper));
    router.push('/generate-paper');
  };

  // Print / Download paper directly from preview modal
  const handlePrintModalPaper = () => {
    if (!selectedPaperForPreview) return;
    const paper = selectedPaperForPreview;
    const blueprint = paper.blueprint || {};
    const questions = blueprint.selected_questions || [];

    printExamPaper({
      schoolName: blueprint.schoolName || 'Modern Public School',
      title: paper.title,
      className: paper.classes?.name || 'N/A',
      subjectName: paper.subjects?.name || 'N/A',
      timeAllowed: blueprint.timeAllowed || `${paper.duration_minutes || 120} Mins`,
      totalMarks: paper.total_marks,
      instructions: blueprint.instructions,
      questions,
    });
  };

  // Filter papers by search keyword and class pill
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.classes?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.subjects?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClass =
        selectedClassFilter === 'all' || p.class_id === selectedClassFilter;

      return matchesSearch && matchesClass;
    });
  }, [papers, searchQuery, selectedClassFilter]);

  // Natural sorting helper for class names (e.g. Class 1, Class 2 ... Class 10, Class 11, Class 12)
  const sortClassNames = (aName: string, bName: string) => {
    const numA = parseInt(aName.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(bName.replace(/[^0-9]/g, '')) || 0;
    if (numA !== 0 && numB !== 0) return numA - numB;
    return aName.localeCompare(bName, undefined, { numeric: true });
  };

  // Group papers class-wise
  interface ClassGroup {
    classId: string;
    className: string;
    papers: QuestionPaper[];
    subjectNames: string[];
  }

  const categorizedClassGroups = useMemo(() => {
    const map = new Map<string, { className: string; papers: QuestionPaper[] }>();

    // Seed with all known classes so they appear in standard order
    classList.forEach((c) => {
      map.set(c.id, { className: c.name, papers: [] });
    });

    // Populate with filtered papers
    filteredPapers.forEach((p) => {
      const cid = p.class_id || (p.classes?.id || 'unassigned');
      const cname = p.classes?.name || (cid === 'unassigned' ? 'General / Other Classes' : 'Class');

      if (!map.has(cid)) {
        map.set(cid, { className: cname, papers: [] });
      }
      map.get(cid)!.papers.push(p);
    });

    const groups: ClassGroup[] = [];
    map.forEach((val, cid) => {
      if (val.papers.length > 0) {
        const subjectsSet = new Set<string>();
        val.papers.forEach((p) => {
          if (p.subjects?.name) subjectsSet.add(p.subjects.name);
        });

        groups.push({
          classId: cid,
          className: val.className,
          papers: val.papers,
          subjectNames: Array.from(subjectsSet),
        });
      }
    });

    // Sort class groups: numbered classes first, unassigned at the end
    groups.sort((a, b) => {
      if (a.classId === 'unassigned') return 1;
      if (b.classId === 'unassigned') return -1;
      return sortClassNames(a.className, b.className);
    });

    return groups;
  }, [classList, filteredPapers]);

  // Overall unique classes that actually have papers
  const classesWithPapers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    papers.forEach((p) => {
      const cid = p.class_id || 'unassigned';
      const cname = p.classes?.name || 'General / Other';
      if (!map.has(cid)) {
        map.set(cid, { id: cid, name: cname, count: 0 });
      }
      map.get(cid)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => sortClassNames(a.name, b.name));
  }, [papers]);

  const toggleClassCollapse = (classId: string) => {
    setCollapsedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  const collapseAllClasses = () => {
    const allCollapsed: Record<string, boolean> = {};
    categorizedClassGroups.forEach((g) => {
      allCollapsed[g.classId] = true;
    });
    setCollapsedClasses(allCollapsed);
  };

  const expandAllClasses = () => {
    setCollapsedClasses({});
  };

  // Reusable Paper Card Component
  const renderPaperCard = (paper: QuestionPaper) => {
    const blueprint = paper.blueprint || {};
    const questionCount =
      blueprint.selected_questions?.length ||
      (blueprint.sections ? blueprint.sections.reduce((a: number, s: any) => a + (s.count || 0), 0) : 0);

    return (
      <Card
        key={paper.id}
        onClick={() => setSelectedPaperForPreview(paper)}
        className="group relative p-5 rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-200 bg-card cursor-pointer flex flex-col justify-between shadow-[0_4px_20px_rgba(24,30,75,0.03)] hover:-translate-y-0.5"
      >
        <div className="space-y-3">
          {/* Top Badges */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge className="bg-[#FFF1DA]/90 text-primary hover:bg-[#FFF1DA] border-[#F1A501]/30 text-[10px] font-bold">
                <GraduationCap className="w-3 h-3 mr-1" />
                {paper.classes?.name || 'Class N/A'}
              </Badge>
              <Badge className="bg-muted text-muted-foreground hover:bg-muted/80 border-border text-[10px] font-bold">
                <BookOpen className="w-3 h-3 mr-1" />
                {paper.subjects?.name || 'Subject N/A'}
              </Badge>
            </div>

            <Badge
              className={`text-[10px] font-bold shrink-0 ${
                paper.status === 'final'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-[#F1A501]/15 text-[#B87A00] border-[#F1A501]/30'
              }`}
            >
              {paper.status === 'final' ? 'Finalized' : 'Draft'}
            </Badge>
          </div>

          {/* Paper Title */}
          <div>
            <h3 className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {paper.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {blueprint.schoolName || 'Standard School Paper'}
            </p>
          </div>

          {/* Paper Stats */}
          <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-muted/40 rounded-xl border border-border/60 text-center text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Marks</span>
              <strong className="text-foreground font-bold">{paper.total_marks}</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Time</span>
              <strong className="text-foreground font-bold">{paper.duration_minutes || 120}m</strong>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Questions</span>
              <strong className="text-foreground font-bold">{questionCount || '—'}</strong>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1 text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{new Date(paper.created_at).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleDeletePaper(paper.id, e)}
              disabled={isDeletingId === paper.id}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              title="Delete Paper"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleEditPaper(paper);
              }}
              className="h-7 px-2 border-border text-foreground hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Edit this paper in generator (0 extra credits)"
            >
              <Edit3 className="w-3 h-3" />
              Edit
            </Button>

            <Button
              size="sm"
              className="h-7 px-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              Preview
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            Saved Examination Papers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse, preview, and print saved examination papers categorized class-wise.
          </p>
        </div>

        <Link href="/generate-paper">
          <Button className="gradient-brand text-white shadow-[0_4px_14px_rgba(223,105,81,0.3)] hover:opacity-95 font-bold rounded-xl cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Paper
          </Button>
        </Link>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-2xl border border-border flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-foreground">{papers.length}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Total Papers</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-foreground">{classesWithPapers.length}</div>
            <div className="text-[11px] font-semibold text-muted-foreground">Classes Covered</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-foreground">
              {papers.filter((p) => p.status === 'final').length}
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground">Finalized Papers</div>
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-2xl border border-border flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-foreground">
              {new Set(papers.map((p) => p.subjects?.name).filter(Boolean)).size}
            </div>
            <div className="text-[11px] font-semibold text-muted-foreground">Unique Subjects</div>
          </div>
        </div>
      </div>

      {/* Search, Filter Tabs & Layout Controls */}
      <div className="space-y-3 bg-card p-4 rounded-2xl border border-border shadow-[0_4px_14px_rgba(24,30,75,0.02)]">
        {/* Search Input & View Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by paper title, subject, or class name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {viewLayout === 'categorized' && categorizedClassGroups.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                <button
                  type="button"
                  onClick={expandAllClasses}
                  className="px-2 py-1 rounded hover:bg-muted font-medium cursor-pointer"
                >
                  Expand All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={collapseAllClasses}
                  className="px-2 py-1 rounded hover:bg-muted font-medium cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            )}

            {/* Layout Switcher */}
            <div className="flex items-center bg-muted/80 p-0.5 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewLayout('categorized')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'categorized'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Class-wise Categorized Sections"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Class Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewLayout === 'grid'
                    ? 'bg-card text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Simple Flat Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>All Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Class Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              selectedClassFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            All Classes ({papers.length})
          </button>

          {classesWithPapers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedClassFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedClassFilter === c.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedClassFilter === c.id
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-foreground'
              }`}>
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content List / Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-medium">Loading saved examination papers...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-3xl bg-[#FFF1DA]/20 border-border flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF1DA] flex items-center justify-center text-primary shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground text-base">
              {searchQuery ? 'No matching papers found' : 'No question papers saved yet'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {searchQuery
                ? 'Try adjusting your search keywords or class filter.'
                : 'Generate your first examination paper with AI and save it to your school archive.'}
            </p>
          </div>
          {!searchQuery && (
            <Link href="/generate-paper">
              <Button className="gradient-brand text-white font-bold text-xs rounded-xl shadow-[0_4px_14px_rgba(223,105,81,0.3)] cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Question Paper Now
              </Button>
            </Link>
          )}
        </Card>
      ) : viewLayout === 'categorized' ? (
        /* Class-wise Categorized View (Default) */
        <div className="space-y-8">
          {categorizedClassGroups.map((group) => {
            const isCollapsed = Boolean(collapsedClasses[group.classId]);

            return (
              <div
                key={group.classId}
                className="space-y-4 bg-muted/20 p-4 sm:p-5 rounded-3xl border border-border/80 shadow-2xs"
              >
                {/* Class Category Section Header */}
                <div
                  onClick={() => toggleClassCollapse(group.classId)}
                  className="flex items-center justify-between cursor-pointer select-none bg-card p-3 sm:p-4 rounded-2xl border border-border hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base sm:text-lg font-heading font-black text-foreground tracking-tight truncate">
                          {group.className}
                        </h2>
                        <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 text-xs font-bold">
                          {group.papers.length} {group.papers.length === 1 ? 'Paper' : 'Papers'}
                        </Badge>
                      </div>

                      {group.subjectNames.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          Subjects: <span className="font-medium text-foreground">{group.subjectNames.join(', ')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={group.classId !== 'unassigned' ? `/generate-paper` : `/generate-paper`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-xl text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 cursor-pointer hidden sm:flex items-center gap-1"
                        title={`Generate new paper for ${group.className}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New Paper</span>
                      </Button>
                    </Link>

                    <button
                      type="button"
                      className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={isCollapsed ? 'Expand this class' : 'Collapse this class'}
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Class Papers Grid */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in-50 duration-200">
                    {group.papers.map((paper) => renderPaperCard(paper))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => renderPaperCard(paper))}
        </div>
      )}

      {/* Full Screen Dedicated Paper Preview & Export Workspace */}
      {selectedPaperForPreview && (
        <div className="fixed inset-0 z-80 w-screen h-screen bg-slate-950/95 flex flex-col overflow-hidden animate-fade-in">
          {/* Top Fixed Header Bar */}
          <div className="h-16 px-4 sm:px-8 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0 shadow-xl select-none z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white font-bold text-sm shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-2">
                  {selectedPaperForPreview.title}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {selectedPaperForPreview.classes?.name || 'Class N/A'} • {selectedPaperForPreview.subjects?.name || 'Subject N/A'} • Max Marks: {selectedPaperForPreview.total_marks} • Time: {selectedPaperForPreview.blueprint?.timeAllowed || `${selectedPaperForPreview.duration_minutes || 120} Mins`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <Button
                onClick={() => handleEditPaper(selectedPaperForPreview)}
                variant="outline"
                className="h-9 px-3.5 bg-slate-800 text-indigo-300 border-indigo-500/50 hover:bg-slate-700 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Edit this paper in generator"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Edit in Generator</span>
                <span className="sm:hidden">Edit</span>
              </Button>

              <Button
                onClick={handlePrintModalPaper}
                variant="outline"
                className="h-9 px-3.5 bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Print Paper"
              >
                <Printer className="w-3.5 h-3.5 text-slate-300" />
                <span>Print</span>
              </Button>

              <Button
                onClick={handlePrintModalPaper}
                className="h-9 px-4 gradient-brand text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 cursor-pointer"
                title="Download as PDF"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>

              <button
                onClick={() => setSelectedPaperForPreview(null)}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700 shadow-sm ml-1"
                title="Close Fullscreen Preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Document Canvas Viewport */}
          <div className="flex-1 overflow-y-auto bg-slate-950 py-8 px-4 sm:px-8">
            <div className="w-full max-w-[800px] bg-white rounded-lg shadow-2xl p-8 sm:p-12 mx-auto space-y-6 text-slate-900 border border-slate-300 min-h-[1050px]">
              {/* Paper Header */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                  {selectedPaperForPreview.blueprint?.schoolName || 'Examination'}
                </h2>
                <h3 className="text-sm sm:text-base font-bold text-slate-700">
                  {selectedPaperForPreview.title}
                </h3>
                <div className="flex flex-wrap items-center justify-between text-xs font-semibold pt-2 text-slate-800 border-t border-slate-200 mt-2">
                  <span>CLASS: {selectedPaperForPreview.classes?.name || 'N/A'}</span>
                  <span>SUBJECT: {selectedPaperForPreview.subjects?.name || 'N/A'}</span>
                  <span>TIME: {selectedPaperForPreview.blueprint?.timeAllowed || `${selectedPaperForPreview.duration_minutes || 120} Mins`}</span>
                  <span>MAX MARKS: {selectedPaperForPreview.total_marks}</span>
                </div>
              </div>

              {/* Candidate Info Line */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-medium border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="shrink-0 font-bold text-slate-800">Name:</span>
                  <span className="border-b border-slate-400 border-dotted flex-1 min-w-[120px] inline-block h-3"></span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Roll No:</span>
                    <span className="border-b border-slate-400 border-dotted w-16 inline-block h-3"></span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800">Section:</span>
                    <span className="border-b border-slate-400 border-dotted w-12 inline-block h-3"></span>
                  </span>
                </div>
              </div>

              {/* Instructions */}
              {selectedPaperForPreview.blueprint?.instructions && (
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-700 italic border border-slate-200">
                  <p className="font-bold not-italic mb-0.5">Instructions:</p>
                  <p className="whitespace-pre-line">{selectedPaperForPreview.blueprint.instructions}</p>
                </div>
              )}

              {/* Dynamic Questions List */}
              <div className="space-y-5 pt-2">
                {(selectedPaperForPreview.blueprint?.selected_questions || []).map((q: any, qIdx: number) => (
                  <div key={q.id || qIdx} className="text-xs space-y-2 border-b border-slate-100 pb-3.5 last:border-none">
                    <div className="flex items-start justify-between font-medium">
                      <div className="flex-1 leading-relaxed">
                        <span className="font-bold text-slate-900">Q{qIdx + 1}. </span>
                        <span><Latex>{autoFormatMath(q.question_text || q.text || '')}</Latex></span>
                      </div>
                    </div>

                    {/* Attached Image Diagram */}
                    {q.image_url && (
                      <div className="my-2 border border-slate-200 rounded-lg p-1 inline-block bg-white shadow-xs">
                        <img
                          src={q.image_url}
                          alt={`Figure Q${qIdx + 1}`}
                          className="max-h-48 max-w-sm object-contain rounded"
                        />
                      </div>
                    )}

                    {/* MCQ Options */}
                    {q.type === 'mcq' && Array.isArray(q.options) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-4 pt-1 text-slate-700">
                        {q.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx}>
                            <span className="font-bold text-slate-900">({String.fromCharCode(65 + oIdx)})</span> <Latex>{autoFormatMath(typeof opt === 'string' ? opt : opt.text || '')}</Latex>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* True False */}
                    {q.type === 'true_false' && (
                      <div className="pl-4 pt-1 flex items-center gap-6 text-slate-700 font-semibold text-[11px]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block"></span>
                          True
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded border border-slate-400 inline-block"></span>
                          False
                        </span>
                      </div>
                    )}

                    {/* Match the Following */}
                    {q.type === 'match_the_following' && q.options && typeof q.options === 'object' && (
                      <div className="pl-4 pt-1 space-y-1 max-w-xl">
                        <div className="grid grid-cols-2 gap-6 font-bold text-xs text-slate-900 border-b border-slate-300 pb-1">
                          <div>Column A</div>
                          <div>Column B</div>
                        </div>
                        {(() => {
                          const cA = q.options.column_a || q.options.columnA || [];
                          const cB = q.options.column_b || q.options.columnB || [];
                          return Array.from({ length: Math.max(cA.length, cB.length, 1) }).map((_, rIdx) => {
                            const itA = cA[rIdx];
                            const itB = cB[rIdx];
                            return (
                              <div key={rIdx} className="grid grid-cols-2 gap-6 items-start py-0.5 text-xs text-slate-800">
                                <div>
                                    {itA ? (
                                      <span>
                                        <strong className="font-bold text-slate-900">{rIdx + 1}. </strong>
                                        <Latex>{autoFormatMath(typeof itA === 'string' ? itA : itA.text || '')}</Latex>
                                      </span>
                                    ) : ''}
                                </div>
                                <div>
                                    {itB ? (
                                      <span>
                                        <strong className="font-bold text-slate-900">{String.fromCharCode(65 + rIdx)}. </strong>
                                        <Latex>{autoFormatMath(typeof itB === 'string' ? itB : itB.text || '')}</Latex>
                                      </span>
                                    ) : ''}
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
