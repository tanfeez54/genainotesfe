'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getDeviceFingerprint } from '@/lib/deviceFingerprint';
import {
  Loader2,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  School,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [token] = useState(() =>
    typeof document !== 'undefined'
      ? document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'))?.[2] || ''
      : ''
  );

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [board, setBoard] = useState('');
  const [classesRange, setClassesRange] = useState('');
  const [numTeachers, setNumTeachers] = useState('');
  const [numStudents, setNumStudents] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'stamp' | 'signature'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${type}...`);
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              base64,
              folder: `${type}s`,
              contentType: file.type || 'image/jpeg',
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed to upload ${type}`);

          if (type === 'logo') setLogoUrl(data.url);
          if (type === 'stamp') setStampUrl(data.url);
          if (type === 'signature') setSignatureUrl(data.url);

          toast.success(`${type} uploaded successfully`, { id: toastId });
        } catch (err: unknown) {
          console.error(err);
          const errMsg = err instanceof Error ? err.message : `Failed to upload ${type}`;
          toast.error(errMsg, { id: toastId });
        } finally {
          setIsUploading(false);
        }
      };
    } catch (error: unknown) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : `Failed to upload ${type}`;
      toast.error(errMsg, { id: toastId });
      setIsUploading(false);
    }
  }

  async function handleFinish() {
    if (!name || !email) {
      toast.error('School Name and Contact Email are required');
      return;
    }

    if (!token) {
      toast.error('Please log in or sign up first to save your school.');
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const { deviceId, fingerprint } = await getDeviceFingerprint();

      const payload = {
        name: name.trim(),
        contact_email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        board: board.trim() || null,
        classes_range: classesRange.trim() || null,
        num_teachers: numTeachers ? parseInt(numTeachers, 10) : null,
        num_students: numStudents ? parseInt(numStudents, 10) : null,
        logo_url: logoUrl || null,
        stamp_url: stampUrl || null,
        signature_url: signatureUrl || null,
        device_id: deviceId,
        device_fingerprint: fingerprint,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-device-id': deviceId,
          'x-device-fingerprint': fingerprint,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.details?.[0]?.message || data.error || 'Failed to create school';
        throw new Error(errorMsg);
      }

      if (data.trial_abuse_prevented) {
        toast.info('Trial already used on this system', {
          description:
            'Aapke device par free trial pehle hi claim kiya ja chuka hai. Papers generate karne ke liye Subscription & Wallet se recharge karein.',
          duration: 6000,
        });
      } else {
        toast.success('School created successfully with ₹50 welcome credit!');
      }

      router.push('/classes');
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to create school';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFDFB] text-[#212832] font-body-jadoo flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden selection:bg-[#DF6951]/20 selection:text-[#DF6951]">
      {/* Jadoo Ambient Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-gradient-to-bl from-[#FFF1DA] to-transparent rounded-full blur-3xl opacity-80" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-[#DFD7F9]/25 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-fade-in">
        {/* Header Branding */}
        <div className="text-center mb-8 space-y-3">
          <Link href="/" className="inline-flex items-center gap-1.5 group mb-2">
            <span className="font-heading font-black text-3xl text-[#181E4B] tracking-tight">
              NoteGen
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#DF6951] mt-2 animate-pulse" />
          </Link>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F1A501] text-white flex items-center justify-center shadow-lg shadow-[#F1A501]/30">
            <School className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#DF6951] block font-sans">
            Quick Setup
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#181E4B] tracking-tight">
            Welcome to NoteGen Academic
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6282] max-w-md mx-auto">
            Set up your school profile and assessment parameters in 3 simple steps.
          </p>
        </div>

        {/* Jadoo Card Container */}
        <div className="rounded-[36px] bg-white border border-[#212832]/5 p-7 sm:p-10 shadow-2xl space-y-6 text-left relative">
          {/* Progress Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[#212832]/5">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    step >= s ? 'w-10 bg-[#DF6951]' : 'w-6 bg-[#FFF1DA]'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-[#5E6282]">
              Step {step} of 3 • {step === 1 ? 'Basic Details' : step === 2 ? 'Academic Info' : 'School Branding'}
            </span>
          </div>

          <div>
            <h3 className="font-serif-display text-xl font-bold text-[#181E4B]">
              {step === 1 && 'School Primary Details'}
              {step === 2 && 'Board & Class Configuration'}
              {step === 3 && 'School Assets & Official Branding'}
            </h3>
            <p className="text-xs text-[#5E6282] mt-1">
              {step === 1 && 'Enter the primary registration contact information for your institution.'}
              {step === 2 && 'Select your board of education, teaching range, and campus size.'}
              {step === 3 && 'Upload your school logo, official stamp, and signature for print-ready question papers.'}
            </p>
          </div>

          {/* Step 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">School / Institution Name *</Label>
                <Input
                  placeholder="e.g. St. Xavier Senior Secondary School"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">Official Contact Email *</Label>
                <Input
                  type="email"
                  placeholder="principal@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">Phone Number</Label>
                <Input
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">Campus Address</Label>
                <Input
                  placeholder="Sector 14, Institutional Area..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic Info */}
          {step === 2 && (
            <div className="space-y-4 pt-2 animate-fade-in">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">Board of Education</Label>
                <Input
                  placeholder="e.g. CBSE, ICSE, Cambridge, State Board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#181E4B]">Classes Range</Label>
                <Select value={classesRange} onValueChange={(val) => setClassesRange(val || '')}>
                  <SelectTrigger className="w-full h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 text-xs sm:text-sm">
                    <SelectValue placeholder="Select classes range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl w-full min-w-[340px] bg-white border border-[#212832]/10 shadow-2xl p-2 z-50">
                    <SelectItem value="1 - 5">Primary (Classes 1 - 5)</SelectItem>
                    <SelectItem value="1 - 8">Elementary (Classes 1 - 8)</SelectItem>
                    <SelectItem value="1 - 10">Secondary (Classes 1 - 10)</SelectItem>
                    <SelectItem value="1 - 12">Full K-12 (Classes 1 - 12)</SelectItem>
                    <SelectItem value="6 - 10">Middle to Secondary (Classes 6 - 10)</SelectItem>
                    <SelectItem value="9 - 12">High School &amp; Senior (Classes 9 - 12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#181E4B]">Total Teachers</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 45"
                    value={numTeachers}
                    onChange={(e) => setNumTeachers(e.target.value)}
                    className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#181E4B]">Total Students</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200"
                    value={numStudents}
                    onChange={(e) => setNumStudents(e.target.value)}
                    className="h-12 rounded-2xl bg-[#FFFDFB] border border-[#212832]/10 focus:border-[#DF6951] text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: School Assets Upload */}
          {step === 3 && (
            <div className="space-y-5 pt-2 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* School Logo */}
                <div className="space-y-2 text-center">
                  <Label className="text-xs font-bold text-[#181E4B] block">School Logo</Label>
                  <div className="p-4 border-2 border-dashed border-[#212832]/15 rounded-3xl bg-[#FFFDFB] hover:bg-[#FFF1DA]/30 transition-colors flex flex-col items-center justify-center min-h-[140px]">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-20 mb-2 object-contain rounded-lg" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-[#DF6951] mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="text-[11px] text-[#5E6282] max-w-[170px]"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Official Stamp */}
                <div className="space-y-2 text-center">
                  <Label className="text-xs font-bold text-[#181E4B] block">Official Stamp</Label>
                  <div className="p-4 border-2 border-dashed border-[#212832]/15 rounded-3xl bg-[#FFFDFB] hover:bg-[#FFF1DA]/30 transition-colors flex flex-col items-center justify-center min-h-[140px]">
                    {stampUrl ? (
                      <img src={stampUrl} alt="Stamp" className="max-h-20 mb-2 object-contain rounded-lg" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-[#F1A501] mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'stamp')}
                      className="text-[11px] text-[#5E6282] max-w-[170px]"
                      disabled={isUploading}
                    />
                  </div>
                </div>

                {/* Principal Signature */}
                <div className="space-y-2 text-center">
                  <Label className="text-xs font-bold text-[#181E4B] block">Principal Signature</Label>
                  <div className="p-4 border-2 border-dashed border-[#212832]/15 rounded-3xl bg-[#FFFDFB] hover:bg-[#FFF1DA]/30 transition-colors flex flex-col items-center justify-center min-h-[140px]">
                    {signatureUrl ? (
                      <img src={signatureUrl} alt="Signature" className="max-h-20 mb-2 object-contain rounded-lg" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-[#00A389] mb-2" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')}
                      className="text-[11px] text-[#5E6282] max-w-[170px]"
                      disabled={isUploading}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFF1DA]/50 border border-[#F1A501]/30 text-xs text-[#181E4B] flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#F1A501] shrink-0" />
                <span>These assets will be embedded onto your printable CBSE/ICSE examination papers automatically.</span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-[#212832]/5">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || isLoading}
              className="px-5 py-2.5 rounded-xl border border-[#212832]/20 text-xs font-bold text-[#181E4B] hover:bg-[#FFF1DA]/40 transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-7 py-3 rounded-2xl bg-[#DF6951] hover:bg-[#c9523b] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#DF6951]/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isLoading || isUploading}
                className="px-8 py-3.5 rounded-2xl bg-[#DF6951] hover:bg-[#c9523b] text-white text-xs sm:text-sm font-bold shadow-xl shadow-[#DF6951]/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Setting up campus...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete School Setup</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
