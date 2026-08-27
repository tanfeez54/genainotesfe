'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Copy,
  Check,
  RotateCcw,
  ArrowRight,
  BookOpen,
  FolderOpen,
  GraduationCap,
  Save,
  Eye,
  Edit3,
  Trash2,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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

interface ScannedDocument {
  id: string;
  image_url: string;
  raw_ocr_text?: string;
  status: string;
  created_at: string;
  chapter_id?: string;
  chapters?: {
    id: string;
    title: string;
    subjects?: {
      id: string;
      name: string;
      classes?: {
        id: string;
        name: string;
      };
    };
  };
}

export default function ScanPage() {
  const [token, setToken] = useState('');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [isCreatingNewChapter, setIsCreatingNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Image & Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Processing & Extraction states
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  // Previous scans list
  const [recentScans, setRecentScans] = useState<ScannedDocument[]>([]);

  useEffect(() => {
    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const tokenStr = tokenMatch ? tokenMatch[2] : '';
    if (tokenStr) {
      setToken(tokenStr);
      fetchClasses(tokenStr);
      fetchRecentScans(tokenStr);
    }
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function fetchClasses(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/classes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setClasses(data.data);
      }
    } catch (e) {
      console.error('Error fetching classes:', e);
    }
  }

  async function fetchSubjects(classId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/subjects?class_id=${classId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setSubjects(data.data);
      }
    } catch (e) {
      console.error('Error fetching subjects:', e);
    }
  }

  async function fetchChapters(subjectId: string, authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/chapters?subject_id=${subjectId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setChapters(data.data);
      }
    } catch (e) {
      console.error('Error fetching chapters:', e);
    }
  }

  async function fetchRecentScans(authToken = token) {
    try {
      const res = await fetch(`${API_URL}/api/scans`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.data) {
        setRecentScans(data.data.slice(0, 5));
      }
    } catch (e) {
      console.error('Error fetching recent scans:', e);
    }
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setIsCreatingNewChapter(false);
    setNewChapterTitle('');
    setSubjects([]);
    setChapters([]);
    if (classId) {
      fetchSubjects(classId);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedChapterId('');
    setIsCreatingNewChapter(false);
    setNewChapterTitle('');
    setChapters([]);
    if (subjectId) {
      fetchChapters(subjectId);
    }
  };

  // --- Camera Handlers ---
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Camera access error:', err);
      toast.error('Unable to access camera. Please check permissions or upload an image.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- OCR Extraction Handler ---
  const handleExtractText = async () => {
    if (!selectedClassId) {
      toast.error('Please select a Class');
      return;
    }
    if (!selectedSubjectId) {
      toast.error('Please select a Subject');
      return;
    }
    if (!selectedChapterId && (!isCreatingNewChapter || !newChapterTitle.trim())) {
      toast.error('Please select or enter a Chapter');
      return;
    }
    if (!imagePreview && !selectedFile) {
      toast.error('Please take a photo or upload an image first');
      return;
    }

    setIsUploading(true);
    setIsSavedSuccessfully(false);

    try {
      let imageDataUrl = imagePreview || '';
      if (!imageDataUrl && selectedFile) {
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(selectedFile);
        });
      }

      // Step 1: Upload Scan record
      const createRes = await fetch(`${API_URL}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_url: imageDataUrl,
          chapter_id: selectedChapterId || undefined,
          chapter_name: isCreatingNewChapter ? newChapterTitle.trim() : undefined,
          subject_id: selectedSubjectId,
          class_id: selectedClassId,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create scan record');

      const scanDoc = createData.data;
      setCurrentScanId(scanDoc.id);
      if (createData.chapter_id && !selectedChapterId) {
        setSelectedChapterId(createData.chapter_id);
      }

      setIsUploading(false);
      setIsProcessing(true);

      // Step 2: Trigger Verbatim OCR Text Extraction
      toast.info('Extracting full verbatim text with AI OCR...');
      const processRes = await fetch(`${API_URL}/api/scans/${scanDoc.id}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error || 'Failed to extract text');

      const rawText = processData.raw_ocr_text || processData.data?.raw_ocr_text || '';
      setExtractedText(rawText);
      toast.success('Text extracted successfully!');
      fetchRecentScans();
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error(error.message || 'Error occurred while extracting text');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  // --- Save Extracted Text Handler ---
  const handleSaveText = async () => {
    if (!currentScanId) {
      toast.error('No scan record to save');
      return;
    }
    if (!extractedText.trim()) {
      toast.error('Extracted text cannot be empty');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/scans/${currentScanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          raw_ocr_text: extractedText,
          chapter_id: selectedChapterId,
          status: 'completed',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save text');

      setIsSavedSuccessfully(true);
      toast.success('Extracted text saved and mapped to Class, Subject & Chapter!');
      fetchRecentScans();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save text');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetScan = () => {
    setImagePreview(null);
    setSelectedFile(null);
    setExtractedText('');
    setCurrentScanId(null);
    setIsSavedSuccessfully(false);
    stopCamera();
  };

  const selectedClassName = classes.find((c) => c.id === selectedClassId)?.name || '';
  const selectedSubjectName = subjects.find((s) => s.id === selectedSubjectId)?.name || '';
  const selectedChapterName =
    chapters.find((ch) => ch.id === selectedChapterId)?.title || newChapterTitle || '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Direct Text OCR Extractor
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Scan & Extract Complete Text
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Capture or upload textbook pages / papers and extract the entire raw text mapped directly to Class, Subject & Chapter
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/classes">
            <Button variant="outline" size="sm" className="cursor-pointer">
              <FolderOpen className="w-4 h-4 mr-2 text-indigo-600" /> Class Structure
            </Button>
          </Link>
          <Link href="/generate-paper">
            <Button size="sm" className="gradient-brand text-white cursor-pointer shadow-xs">
              <BookOpen className="w-4 h-4 mr-2" /> Generate Paper
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Mapping & Input */}
        <div className="lg:col-span-5 space-y-5">
          {/* Step 1: Mapping Target */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> 1. Class, Subject & Chapter Mapping
              </CardTitle>
              <CardDescription className="text-xs">
                The extracted text will be permanently mapped and saved to this chapter.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Class / Grade *</Label>
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Subject *</Label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!selectedClassId}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Chapter *</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingNewChapter(!isCreatingNewChapter);
                      setSelectedChapterId('');
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    {isCreatingNewChapter ? 'Select Existing Chapter' : '+ Create New Chapter'}
                  </button>
                </div>

                {isCreatingNewChapter ? (
                  <Input
                    placeholder="Enter new chapter name (e.g. Chapter 4: Motion)"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="h-10 rounded-xl text-sm"
                  />
                ) : (
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    disabled={!selectedSubjectId}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select a chapter...</option>
                    {chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Image Capture or Upload */}
          <Card className="rounded-2xl border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" /> 2. Capture / Upload Document Page
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Video Stream */}
              {isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-3">
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-white hover:bg-slate-100 text-slate-900 rounded-full font-bold shadow-lg px-6 cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mr-2 text-indigo-600" /> Snap Photo
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      size="sm"
                      className="rounded-full cursor-pointer"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Document Preview (Image or PDF) */}
              {imagePreview && !isCameraActive && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center">
                  {selectedFile?.type === 'application/pdf' || imagePreview.startsWith('data:application/pdf') ? (
                    <div className="w-full h-full bg-gradient-to-br from-rose-50 to-red-100 p-6 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black text-xl shadow-lg mb-3">
                        PDF
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm max-w-xs truncate">
                        {selectedFile?.name || 'Attached PDF Document'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Ready for Gemini AI OCR text extraction
                      </p>
                    </div>
                  ) : (
                    <img
                      src={imagePreview}
                      alt="Document preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <button
                    onClick={handleResetScan}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl text-xs font-semibold backdrop-blur-sm cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Buttons if no image */}
              {!imagePreview && !isCameraActive && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed border-2 hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-700">Open Camera</span>
                  </Button>

                  <label className="h-24 flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-indigo-600" />
                    <span className="text-xs font-semibold text-slate-700">Upload Image / PDF</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Extract Button */}
              <Button
                onClick={handleExtractText}
                disabled={
                  (!imagePreview && !selectedFile) ||
                  !selectedClassId ||
                  !selectedSubjectId ||
                  (!selectedChapterId && !newChapterTitle) ||
                  isUploading ||
                  isProcessing
                }
                className="w-full gradient-brand text-white font-semibold rounded-xl h-11 shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isUploading
                  ? 'Uploading Document...'
                  : isProcessing
                  ? 'Extracting Full Text via AI OCR...'
                  : 'Extract Entire Text As-Is'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Full Extracted Text & Save */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="rounded-2xl border-slate-200 shadow-xs min-h-[550px] flex flex-col">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Extracted Document Text (Verbatim)
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedClassName && selectedSubjectName && selectedChapterName ? (
                    <span className="font-semibold text-indigo-600">
                      Mapped to: {selectedClassName} &gt; {selectedSubjectName} &gt; {selectedChapterName}
                    </span>
                  ) : (
                    'Complete text extracted from your document scan'
                  )}
                </CardDescription>
              </div>

              {extractedText && (
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      onClick={() => setPreviewTab('edit')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        previewTab === 'edit'
                          ? 'bg-white shadow-xs text-indigo-600'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Edit3 className="w-3 h-3 inline mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => setPreviewTab('preview')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        previewTab === 'preview'
                          ? 'bg-white shadow-xs text-indigo-600'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <Eye className="w-3 h-3 inline mr-1" /> Preview
                    </button>
                  </div>

                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 sm:p-6 space-y-4">
              {isSavedSuccessfully && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-800">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-xs font-semibold">
                      Successfully saved and mapped to <strong>{selectedChapterName}</strong>!
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/classes">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs h-7 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5 mr-1" /> View in Chapter
                      </Button>
                    </Link>
                    <Link href="/generate-paper">
                      <Button
                        size="sm"
                        className="gradient-brand text-white text-xs h-7 cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Create Paper
                      </Button>
                    </Link>
                    <Button
                      onClick={handleResetScan}
                      size="sm"
                      variant="outline"
                      className="bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs h-7 cursor-pointer"
                    >
                      Scan Next Page
                    </Button>
                  </div>
                </div>
              )}

              {!extractedText && !isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">No Text Extracted Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select your Class, Subject &amp; Chapter on the left, upload or take a photo of the document, and click &ldquo;Extract Entire Text As-Is&rdquo;.
                  </p>
                </div>
              ) : isProcessing ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 animate-pulse">
                    <Sparkles className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">AI Verbatim OCR in Progress...</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Extracting complete text verbatim with equations, formulas, and multilingual support.
                  </p>
                </div>
              ) : previewTab === 'edit' ? (
                <div className="flex-1 flex flex-col space-y-2">
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Extracted verbatim text will appear here..."
                    className="w-full flex-1 min-h-[350px] p-4 rounded-xl border border-slate-200 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
                  />
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      {extractedText.split(/\s+/).filter(Boolean).length} words • {extractedText.length} characters
                    </span>
                    <span>Direct verbatim transcription</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-[350px] p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-sm leading-relaxed overflow-y-auto whitespace-pre-wrap font-sans">
                  {extractedText}
                </div>
              )}

              {/* Action Bar */}
              {extractedText && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    onClick={handleResetScan}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear &amp; Scan Another
                  </Button>

                  <Button
                    onClick={handleSaveText}
                    disabled={isSaving || !extractedText.trim()}
                    className="w-full sm:w-auto gradient-brand text-white font-semibold rounded-xl px-6 h-10 shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Extracted Text to Chapter'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
