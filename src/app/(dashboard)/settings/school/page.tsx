'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Building, Loader2, UploadCloud } from 'lucide-react';

// Form schemas
const schoolSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  contact_email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  board: z.string().optional(),
  address: z.string().optional(),
  classes_range: z.string().optional(),
  num_teachers: z.any().optional(),
  num_students: z.any().optional(),
});

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['school_admin', 'teacher', 'data_entry']),
  full_name: z.string().min(2, 'Name is required'),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;
type InviteFormValues = z.infer<typeof inviteSchema>;

export default function SchoolSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Image URLs
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [stampUrl, setStampUrl] = useState<string | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Staff members list
  interface StaffMember {
    id: string;
    user_id: string;
    role: string;
    full_name: string;
    email: string;
    created_at: string;
    is_active: boolean;
  }
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  const schoolForm = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '',
      contact_email: '',
      phone: '',
      board: '',
      address: '',
      classes_range: '',
      num_teachers: undefined,
      num_students: undefined,
    },
  });

  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'teacher',
      full_name: '',
    },
  });

  async function loadStaff(targetSchoolId: string) {
    setIsLoadingStaff(true);
    try {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;
      if (!token) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${targetSchoolId}/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
      }
    } catch (e) {
      console.error('Error loading staff', e);
    } finally {
      setIsLoadingStaff(false);
    }
  }

  useEffect(() => {
    async function loadSchoolData() {
      try {
        const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
        const token = tokenMatch ? tokenMatch[2] : null;
        if (!token) return;
        
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/my-school`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.school) {
              setSchoolId(data.school.id);
              setLogoUrl(data.school.logo_url || null);
              setStampUrl(data.school.stamp_url || null);
              setSignatureUrl(data.school.signature_url || null);
              
              schoolForm.reset({
                name: data.school.name,
                contact_email: data.school.contact_email,
                phone: data.school.phone || '',
                board: data.school.board || '',
                address: data.school.address || '',
                classes_range: data.school.classes_range || '',
                num_teachers: data.school.num_teachers || '',
                num_students: data.school.num_students || '',
              });

              loadStaff(data.school.id);
            }
          }
        } catch (e) {
          console.error(e);
        }
      } catch (error) {
        console.error('Error loading school data', error);
      }
    }
    loadSchoolData();
  }, [schoolForm]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'stamp' | 'signature') {
    const file = e.target.files?.[0];
    if (!file) return;

    const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
    const token = tokenMatch ? tokenMatch[2] : null;
    
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    const toastId = toast.loading(`Uploading ${type}...`);
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
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              base64,
              folder: `${type}s`,
              contentType: file.type || 'image/jpeg',
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || `Failed to upload ${type}`);

          if (type === 'logo') setLogoUrl(data.url);
          if (type === 'stamp') setStampUrl(data.url);
          if (type === 'signature') setSignatureUrl(data.url);

          toast.success(`${type} uploaded successfully`, { id: toastId });
        } catch (err: any) {
          console.error(err);
          toast.error(err.message || `Failed to upload ${type}`, { id: toastId });
        }
      };
    } catch (error) {
      console.error(error);
      toast.error(`Failed to upload ${type}`, { id: toastId });
    }
  }

  async function onUpdateSchool(data: SchoolFormValues) {
    setIsLoading(true);
    try {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;
      
      const payload = {
        ...data,
        num_teachers: data.num_teachers ? Number(data.num_teachers) : null,
        num_students: data.num_students ? Number(data.num_students) : null,
        logo_url: logoUrl,
        stamp_url: stampUrl,
        signature_url: signatureUrl
      };

      if (schoolId) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to update school');
        toast.success('School profile updated');
      } else {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error('Failed to create school');
        
        const result = await response.json();
        setSchoolId(result.school.id);
        toast.success('School created successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save school details');
    } finally {
      setIsLoading(false);
    }
  }

  async function onInviteUser(data: InviteFormValues) {
    if (!schoolId) {
      toast.error('Please create or select a school first');
      return;
    }

    setIsInviting(true);
    try {
      const tokenMatch = document.cookie.match(new RegExp('(^| )notegen_session=([^;]+)'));
      const token = tokenMatch ? tokenMatch[2] : null;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/schools/${schoolId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Failed to send invite');
      }

      toast.success(resData.message || `Invite sent to ${data.email}!`);
      inviteForm.reset();
      if (schoolId) {
        loadStaff(schoolId);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-foreground">School Settings &amp; Staff</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Manage your school profile, official branding assets, and invite teachers or staff members.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* School Profile Card */}
        <Card className="rounded-3xl border-border bg-card shadow-[0_10px_30px_rgba(24,30,75,0.03)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading font-bold text-foreground">
              <Building className="h-5 w-5 text-primary" />
              School Profile
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {schoolId ? 'Update your school branding and institutional details.' : 'Onboard your school to get started.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={schoolForm.handleSubmit(onUpdateSchool)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground font-medium text-xs">School Name</Label>
                <Input id="name" placeholder="e.g. Springfield High" {...schoolForm.register('name')} className="rounded-xl bg-card border-border text-foreground" />
                {schoolForm.formState.errors.name && (
                  <p className="text-xs text-red-500">{schoolForm.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-foreground font-medium text-xs">Contact Email</Label>
                <Input id="contact_email" type="email" placeholder="admin@school.com" {...schoolForm.register('contact_email')} className="rounded-xl bg-card border-border text-foreground" />
                {schoolForm.formState.errors.contact_email && (
                  <p className="text-xs text-red-500">{schoolForm.formState.errors.contact_email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground font-medium text-xs">Address (Optional)</Label>
                <Input id="address" {...schoolForm.register('address')} className="rounded-xl bg-card border-border text-foreground" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-xs">Classes Range</Label>
                  <Input {...schoolForm.register('classes_range')} placeholder="e.g. Nursery - 10th" className="rounded-xl bg-card border-border text-foreground" />
                  {schoolForm.formState.errors.classes_range && <p className="text-xs text-destructive">{schoolForm.formState.errors.classes_range.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-xs">Board of Education</Label>
                  <Input {...schoolForm.register('board')} placeholder="e.g. CBSE, ICSE, State" className="rounded-xl bg-card border-border text-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-xs">Total Teachers</Label>
                  <Input type="number" {...schoolForm.register('num_teachers')} placeholder="e.g. 50" className="rounded-xl bg-card border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground font-medium text-xs">Total Students</Label>
                  <Input type="number" {...schoolForm.register('num_students')} placeholder="e.g. 1500" className="rounded-xl bg-card border-border text-foreground" />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-border mt-3">
                <div className="space-y-1.5 text-center">
                  <Label className="text-[11px] font-semibold text-foreground">Logo</Label>
                  <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    {logoUrl ? <img src={logoUrl} alt="Logo" className="max-h-16 mb-1 object-contain" /> : <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} className="text-[10px] h-7 max-w-full" />
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <Label className="text-[11px] font-semibold text-foreground">Official Stamp</Label>
                  <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    {stampUrl ? <img src={stampUrl} alt="Stamp" className="max-h-16 mb-1 object-contain" /> : <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'stamp')} className="text-[10px] h-7 max-w-full" />
                  </div>
                </div>
                <div className="space-y-1.5 text-center">
                  <Label className="text-[11px] font-semibold text-foreground">Signature</Label>
                  <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border rounded-2xl bg-muted/20">
                    {signatureUrl ? <img src={signatureUrl} alt="Signature" className="max-h-16 mb-1 object-contain" /> : <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />}
                    <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} className="text-[10px] h-7 max-w-full" />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full gradient-brand text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(223,105,81,0.3)] hover:opacity-95 cursor-pointer">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {schoolId ? 'Save Changes' : 'Create School'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Invite Users Card */}
        {schoolId && (
          <Card className="rounded-3xl border-border bg-card shadow-[0_10px_30px_rgba(24,30,75,0.03)] h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading font-bold text-foreground">
                <UserPlus className="h-5 w-5 text-primary" />
                Invite Staff
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Send an email invite to teachers or data entry staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={inviteForm.handleSubmit(onInviteUser)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite_name" className="text-foreground font-medium text-xs">Full Name</Label>
                  <Input id="invite_name" placeholder="John Doe" {...inviteForm.register('full_name')} className="rounded-xl bg-card border-border text-foreground" />
                  {inviteForm.formState.errors.full_name && (
                    <p className="text-xs text-red-500">{inviteForm.formState.errors.full_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite_email" className="text-foreground font-medium text-xs">Email Address</Label>
                  <Input id="invite_email" type="email" placeholder="teacher@school.com" {...inviteForm.register('email')} className="rounded-xl bg-card border-border text-foreground" />
                  {inviteForm.formState.errors.email && (
                    <p className="text-xs text-red-500">{inviteForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground font-medium text-xs">Role</Label>
                  <select 
                    id="role" 
                    className="flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    {...inviteForm.register('role')}
                  >
                    <option value="teacher">Teacher</option>
                    <option value="data_entry">Data Entry</option>
                    <option value="school_admin">School Admin</option>
                  </select>
                </div>

                <Button type="submit" disabled={isInviting} className="w-full gradient-brand text-white font-bold rounded-xl shadow-[0_4px_14px_rgba(223,105,81,0.3)] hover:opacity-95 cursor-pointer">
                  {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite Link
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Staff Directory / Members List */}
      {schoolId && (
        <Card className="rounded-3xl border-border bg-card shadow-[0_10px_30px_rgba(24,30,75,0.03)]">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-heading font-bold text-foreground">
                  Active &amp; Invited Staff ({staffList.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Teachers and staff members with access to your school curriculum and test papers.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoadingStaff ? (
              <div className="py-8 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span>Loading staff directory...</span>
              </div>
            ) : staffList.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No staff members invited yet. Use the invite form above to add teachers.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {staffList.map((member) => (
                  <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {member.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <span>{member.full_name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            member.role === 'school_admin'
                              ? 'bg-primary/10 text-primary border border-primary/20'
                              : member.role === 'data_entry'
                              ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          }`}>
                            {member.role === 'school_admin' ? 'School Admin' : member.role === 'data_entry' ? 'Data Entry' : 'Teacher'}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{member.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        ✓ Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
