'use client';

import { useState, useEffect } from 'react';
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
  FileCheck2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

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

export default function SavedPapersPage() {
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedPaperForPreview, setSelectedPaperForPreview] = useState<QuestionPaper | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const tokenMatch = typeof document !== 'undefined' ? document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)')) : null;
  const token = tokenMatch ? tokenMatch[2] : null;

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
    fetchPapers();
  }, []);

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

  // Print paper directly from preview modal
  const handlePrintModalPaper = () => {
    if (!selectedPaperForPreview) return;
    const paper = selectedPaperForPreview;
    const blueprint = paper.blueprint || {};
    const questions = blueprint.selected_questions || [];
    const schoolName = blueprint.schoolName || 'Examination';
    const timeAllowed = blueprint.timeAllowed || `${paper.duration_minutes || 120} Mins`;
    const className = paper.classes?.name || 'All';
    const subjectName = paper.subjects?.name || 'General';

    const cleanDocTitle = `${schoolName}_${paper.title}_${subjectName}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${cleanDocTitle}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 10pt; line-height: 1.35; margin: 0; color: #000; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
            .header h2 { font-size: 15pt; font-weight: 900; text-transform: uppercase; margin: 0 0 2px 0; }
            .header h3 { font-size: 10.5pt; font-weight: 700; margin: 0 0 4px 0; }
            .meta-row { display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 700; border-top: 1px solid #ccc; padding-top: 4px; }
            .candidate { display: flex; justify-content: space-between; font-size: 8.5pt; font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
            .q-item { margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid; }
            .q-num { font-weight: 700; }
            .mcq-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px 10px; padding-left: 12px; margin-top: 3px; font-size: 9pt; }
            .match-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: flex-start; padding: 2px 0; font-size: 9pt; }
            .instructions { padding: 5px 8px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 8pt; font-style: italic; margin-bottom: 10px; }
            .sec-hdr { font-size: 10pt; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 2px; margin: 12px 0 6px 0; break-after: avoid; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${schoolName}</h2>
            <h3>${paper.title}</h3>
            <div class="meta-row">
              <span>CLASS: ${className}</span>
              <span>SUBJECT: ${subjectName}</span>
              <span>TIME: ${timeAllowed}</span>
              <span>MAX MARKS: ${paper.total_marks}</span>
            </div>
          </div>
          <div class="candidate">
            <div>Name: _______________________________</div>
            <div>Roll No: ____________ Section: ____</div>
          </div>
          ${blueprint.instructions ? `<div class="instructions"><strong>Instructions:</strong><br/>${blueprint.instructions}</div>` : ''}
          <div class="questions">
            ${questions.map((q: any, i: number) => `
              <div class="q-item">
                <div><span class="q-num">Q${i + 1}. </span><span>${q.question_text || ''}</span></div>
                ${q.type === 'mcq' && Array.isArray(q.options) ? `
                  <div class="mcq-grid">
                    ${q.options.map((opt: any, oIdx: number) => `
                      <div><strong>(${String.fromCharCode(65 + oIdx)})</strong> ${typeof opt === 'string' ? opt : opt.text || ''}</div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    }, 300);
  };

  // Filter papers
  const filteredPapers = papers.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.classes?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subjects?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      selectedClassFilter === 'all' || p.class_id === selectedClassFilter;

    return matchesSearch && matchesClass;
  });

  // Extract unique classes for filter dropdown
  const classOptions = Array.from(
    new Set(papers.map((p) => p.classes?.name).filter(Boolean))
  );

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md">
              <FileCheck2 className="w-5 h-5" />
            </div>
            Saved Examination Papers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access, preview, and print all previously generated question papers for your school.
          </p>
        </div>

        <Link href="/generate-paper">
          <Button className="gradient-brand text-white shadow-md hover:opacity-90 font-bold rounded-xl cursor-pointer">
            <Plus className="w-4 h-4 mr-1.5" />
            Create New Paper
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by title, subject, class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 shrink-0">Class:</span>
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="h-9 px-3 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Classes ({papers.length})</option>
            {classOptions.map((cName) => {
              const matched = papers.find((p) => p.classes?.name === cName);
              return (
                <option key={matched?.class_id || cName} value={matched?.class_id || ''}>
                  {cName}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Content List / Grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-medium">Loading saved papers...</p>
        </div>
      ) : filteredPapers.length === 0 ? (
        <Card className="p-12 text-center border-dashed rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {searchQuery ? 'No matching papers found' : 'No question papers saved yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {searchQuery
                ? 'Try adjusting your search keywords or filter.'
                : 'Generate your first examination paper with AI and save it to your school archive.'}
            </p>
          </div>
          {!searchQuery && (
            <Link href="/generate-paper">
              <Button className="gradient-brand text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate Question Paper Now
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPapers.map((paper) => {
            const blueprint = paper.blueprint || {};
            const questionCount =
              blueprint.selected_questions?.length ||
              (blueprint.sections ? blueprint.sections.reduce((a: number, s: any) => a + (s.count || 0), 0) : 0);

            return (
              <Card
                key={paper.id}
                onClick={() => setSelectedPaperForPreview(paper)}
                className="group relative p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all bg-white cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-[10px] font-bold">
                        <GraduationCap className="w-3 h-3 mr-1" />
                        {paper.classes?.name || 'Class N/A'}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 text-[10px] font-bold">
                        <BookOpen className="w-3 h-3 mr-1" />
                        {paper.subjects?.name || 'Subject N/A'}
                      </Badge>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold ${
                        paper.status === 'final'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {paper.status === 'final' ? 'Finalized' : 'Draft'}
                    </Badge>
                  </div>

                  {/* Paper Title */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {blueprint.schoolName || 'Standard School Paper'}
                    </p>
                  </div>

                  {/* Paper Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Marks</span>
                      <strong className="text-slate-800 font-bold">{paper.total_marks}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Time</span>
                      <strong className="text-slate-800 font-bold">{paper.duration_minutes || 120}m</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Questions</span>
                      <strong className="text-slate-800 font-bold">{questionCount || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(paper.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDeletePaper(paper.id, e)}
                      disabled={isDeletingId === paper.id}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
          })}
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

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={handlePrintModalPaper}
                className="h-9 px-4 gradient-brand text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:opacity-90 cursor-pointer"
                title="Download or Print PDF directly"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / Download PDF</span>
                <span className="sm:hidden">Print / PDF</span>
              </Button>

              <button
                onClick={() => setSelectedPaperForPreview(null)}
                className="h-9 w-9 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700 shadow-sm"
                title="Close Fullscreen Preview (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Document Canvas Viewport */}
          <div className="flex-1 overflow-y-auto bg-slate-950 py-8 px-4 sm:px-8">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8 sm:p-14 mx-auto space-y-6 text-slate-900 border border-slate-200">
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
              <div className="grid grid-cols-2 gap-4 text-xs font-medium border-b border-slate-200 pb-3">
                <div>Name: _______________________________</div>
                <div className="text-right">Roll No: ____________ Section: ____</div>
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
                        <span>{q.question_text || q.text}</span>
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
                            <span className="font-bold text-slate-900">({String.fromCharCode(65 + oIdx)})</span> {typeof opt === 'string' ? opt : opt.text}
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
                                      {typeof itA === 'string' ? itA : itA.text}
                                    </span>
                                  ) : ''}
                                </div>
                                <div>
                                  {itB ? (
                                    <span>
                                      <strong className="font-bold text-slate-900">{String.fromCharCode(65 + rIdx)}. </strong>
                                      {typeof itB === 'string' ? itB : itB.text}
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
