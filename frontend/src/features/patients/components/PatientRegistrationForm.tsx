import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { patientService } from '../services/patientService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { 
  User, FileText, Camera, Shield, Heart, MapPin, Phone, Briefcase, 
  Trash2, ArrowRight, Save, X, Plus, Building2, Activity, ShieldCheck 
} from 'lucide-react';

const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.string().min(1, 'Gender is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Valid 10 digit mobile required'),
  registrationType: z.string().min(1, 'Registration type is required'),
  consentTermsAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms' }),
  }),
  consentPrivacyAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the privacy policy' }),
  }),
  consentHealthDataSharing: z.literal(true, {
    errorMap: () => ({ message: 'You must accept health data sharing' }),
  }),
}).passthrough();

interface PatientRegistrationFormProps {
  patientId?: string;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PatientRegistrationForm({ patientId, onSubmit, onCancel, isSubmitting }: PatientRegistrationFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal');
  const [isNewborn, setIsNewborn] = useState(false);
  const [isDeceased, setIsDeceased] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [insuranceProviders, setInsuranceProviders] = useState<{ id: string; providerName: string }[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      // Personal Information
      patientPrefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      aliasName: '',
      gender: 'Male',
      dateOfBirth: '',
      ageYear: '',
      ageMonth: '',
      ageDay: '',
      bloodGroup: '',
      maritalStatus: '',
      language: '',
      
      // Guardian Details
      guardianRelation: '',
      guardianPrefix: '',
      guardianFirstName: '',
      guardianMiddleName: '',
      guardianLastName: '',
      guardianMobile: '',
      
      // Contact Details
      mobileNumber: '',
      alternateMobile: '',
      whatsappNumber: '',
      email: '',
      telephoneCode: '+91',
      houseNumber: '',
      street: '',
      location: '',
      village: '',
      postOffice: '',
      country: 'India',
      state: '',
      district: '',
      city: '',
      pincode: '',
      residentType: 'Urban',
      
      // Emergency Contact
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactMobile: '',
      emergencyContactEmail: '',
      emergencyAddress: '',
      
      // Medical Information
      allergies: '',
      chronicConditions: '',
      currentMedications: '',
      disabilityStatus: '',
      organDonor: false,
      
      // Personal Identification
      identificationType: '',
      identificationNumber: '',
      
      // Insurance Details
      sponsorType: '',
      insuranceProviderId: '',
      policyNumber: '',
      policyHolderName: '',
      policyHolderRelation: '',
      policyStartDate: '',
      policyEndDate: '',
      certificateNumber: '',
      employeeNumber: '',
      
      // Referral Details
      referredBy: '',
      referredTo: '',
      referringDate: '',
      
      // Death Details
      deceased: false,
      dateOfDeath: '',
      deathReason: '',
      
      // Registration Details
      registrationType: '',
      registrationDate: new Date().toISOString().split('T')[0],
      registrationTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      patientType: '',
      validTill: '',
      status: 'Active',

      consentTermsAccepted: false,
      consentPrivacyAccepted: false,
      consentHealthDataSharing: false,
    }
  });

  useEffect(() => {
    let cancelled = false;
    patientService
      .getInsuranceProviders()
      .then((list: { id: string; providerName: string }[]) => {
        if (cancelled || !Array.isArray(list)) return;
        setInsuranceProviders(
          list.map((p) => ({ id: p.id, providerName: p.providerName }))
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return;
    const birthDate = new Date(dob);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    
    if (days < 0) {
      months--;
      days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    
    setValue('ageYear', years.toString());
    setValue('ageMonth', months.toString());
    setValue('ageDay', days.toString());
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onFormSubmit = (data: Record<string, unknown>) => {
    void onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-2xl">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {patientId ? t('patients.update') : t('patients.registration')}
                </CardTitle>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Create a permanent health record for the patient.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={onCancel} className="h-10 font-bold text-slate-500">
                <X className="h-4 w-4 mr-2" />
                Discard
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-10 px-6 font-black shadow-lg shadow-primary/20">
                <Save className="h-4 w-4 mr-2" />
                {patientId ? t('patients.update') : t('patients.register')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-6 overflow-x-auto">
              <TabsList className="h-14 bg-transparent gap-8">
                {[
                  { value: 'personal', label: t('patients.personal_info') },
                  { value: 'identification', label: t('patients.identification') },
                  { value: 'contact', label: t('patients.contact') },
                  { value: 'emergency', label: t('patients.emergency') },
                  { value: 'referral', label: t('patients.referral') },
                  { value: 'biometric', label: t('patients.biometric') },
                  { value: 'insurance', label: t('patients.insurance') },
                  { value: 'death', label: t('patients.death') },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value}
                    className="h-14 bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none rounded-none px-0 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="p-8">
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-8 mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Registration Type *</Label>
                    <select {...register('registrationType')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                      <option value="">Select Type</option>
                      <option value="General">General</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Staff">Staff</option>
                      <option value="VIP">VIP</option>
                    </select>
                    {errors.registrationType && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.registrationType.message as string}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Registration Date *</Label>
                    <Input type="date" {...register('registrationDate')} className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Registration Time *</Label>
                    <Input type="time" {...register('registrationTime')} className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Patient Category</Label>
                    <select {...register('patientType')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                      <option value="">Select Category</option>
                      <option value="General">General</option>
                      <option value="Senior Citizen">Senior Citizen</option>
                      <option value="Child">Child</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-6 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Demographics</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Prefix</Label>
                      <select {...register('patientPrefix')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                        <option value="">None</option>
                        <option value="Mr">Mr.</option>
                        <option value="Mrs">Mrs.</option>
                        <option value="Ms">Ms.</option>
                        <option value="Dr">Dr.</option>
                        <option value="Master">Master</option>
                        <option value="Baby">Baby</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.first_name')} *</Label>
                      <Input {...register('firstName')} placeholder="e.g. John" className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                      {errors.firstName && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.firstName.message as string}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Middle Name</Label>
                      <Input {...register('middleName')} className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.last_name')} *</Label>
                      <Input {...register('lastName')} placeholder="e.g. Doe" className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800" />
                      {errors.lastName && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.lastName.message as string}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.gender')} *</Label>
                      <select {...register('gender')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.dob')} *</Label>
                      <Input 
                        type="date" 
                        {...register('dateOfBirth')} 
                        onChange={(e) => calculateAge(e.target.value)}
                        className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                      />
                      {errors.dateOfBirth && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.dateOfBirth.message as string}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.blood_group')}</Label>
                      <select {...register('bloodGroup')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                        <option value="">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Marital Status</Label>
                      <select {...register('maritalStatus')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:ring-2 focus:ring-primary/20">
                        <option value="">Select</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculated Age</span>
                      <div className="text-lg font-black text-slate-900 dark:text-white">
                        {watch('ageYear') || 0} <span className="text-xs text-slate-500 font-bold">Yrs</span>, {watch('ageMonth') || 0} <span className="text-xs text-slate-500 font-bold">Mo</span>
                      </div>
                    </div>
                    <div className="col-span-3 flex items-center justify-end">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={cn(
                          "h-6 w-11 rounded-full transition-colors relative border-2",
                          watch('organDonor') ? "bg-primary border-primary" : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                            watch('organDonor') && "translate-x-5"
                          )} />
                        </div>
                        <input type="checkbox" className="hidden" {...register('organDonor')} />
                        <span className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">Organ Donor</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-rose-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Medical Notes</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Known Allergies</Label>
                        <textarea
                          {...register('allergies')}
                          rows={3}
                          className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder="List any drug or food allergies..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Chronic Conditions</Label>
                        <textarea
                          {...register('chronicConditions')}
                          rows={3}
                          className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder="e.g. Hypertension, Diabetes..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Baby of Mother (Newborn)</h3>
                    </div>
                    <div className={cn(
                      "p-6 rounded-2xl border transition-all duration-300",
                      isNewborn ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800" : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60"
                    )}>
                      <label className="flex items-center gap-3 cursor-pointer mb-6">
                        <input 
                          type="checkbox" 
                          checked={isNewborn}
                          onChange={(e) => setIsNewborn(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Newborn / Baby of Mother</span>
                      </label>
                      
                      {isNewborn && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Mother's CR/UHID Number</Label>
                            <Input placeholder="Enter mother's identifier" className="h-11 bg-white dark:bg-slate-900" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Guardian Relation *</Label>
                              <select {...register('guardianRelation')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-white dark:bg-slate-900 text-sm font-semibold">
                                <option value="">Select</option>
                                <option value="Mother">Mother</option>
                                <option value="Father">Father</option>
                                <option value="Guardian">Guardian</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Guardian Name</Label>
                              <Input {...register('guardianFirstName')} placeholder="Full Name" className="h-11 bg-white dark:bg-slate-900" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Identification Tab */}
              <TabsContent value="identification" className="space-y-6 mt-0 outline-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Government ID Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Identification Type</Label>
                    <select {...register('identificationType')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-slate-50 dark:bg-slate-900 text-sm font-semibold">
                      <option value="">Select ID Type</option>
                      <option value="Aadhar">Aadhar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="Passport">Passport</option>
                      <option value="DrivingLicense">Driving License</option>
                      <option value="VoterID">Voter ID</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Identification Number</Label>
                    <Input {...register('identificationNumber')} placeholder="Enter ID number" className="h-11 bg-slate-50 dark:bg-slate-900" />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="h-11 w-full border-dashed border-2 font-bold">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another ID
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Contact Details Tab */}
              <TabsContent value="contact" className="space-y-8 mt-0 outline-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Contact & Address</h3>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <label className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer transition-all",
                      watch('residentType') === 'Urban' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"
                    )}>
                      <input type="radio" {...register('residentType')} value="Urban" className="hidden" />
                      <Building2 className="h-3.5 w-3.5" /> Urban
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest cursor-pointer transition-all",
                      watch('residentType') === 'Rural' ? "bg-white dark:bg-slate-700 text-primary shadow-sm" : "text-slate-500"
                    )}>
                      <input type="radio" {...register('residentType')} value="Rural" className="hidden" />
                      <MapPin className="h-3.5 w-3.5" /> Rural
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.mobile')} *</Label>
                    <div className="flex gap-2">
                      <select {...register('telephoneCode')} className="w-24 h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-2 bg-slate-50 dark:bg-slate-900 text-sm font-bold">
                        <option value="+91">+91</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                      </select>
                      <Input {...register('mobileNumber')} placeholder="10 digit mobile" className="h-11 bg-slate-50 dark:bg-slate-900 flex-1" />
                    </div>
                    {errors.mobileNumber && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{errors.mobileNumber.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">WhatsApp (Optional)</Label>
                    <Input {...register('whatsappNumber')} placeholder="WhatsApp Number" className="h-11 bg-slate-50 dark:bg-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">{t('patients.email')}</Label>
                    <Input type="email" {...register('email')} placeholder="patient@example.com" className="h-11 bg-slate-50 dark:bg-slate-900" />
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">House / Flat No.</Label>
                      <Input {...register('houseNumber')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Street / Area</Label>
                      <Input {...register('street')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">City / Town</Label>
                      <Input {...register('city')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">State / Province</Label>
                      <Input {...register('state')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Country</Label>
                      <Input {...register('country')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Pincode / ZIP</Label>
                      <Input {...register('pincode')} className="h-11 bg-white dark:bg-slate-900" />
                      {errors.pincode && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">Invalid Pincode</p>}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-6 mt-0 outline-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Emergency Contact Person</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-rose-50/30 dark:bg-rose-900/5 p-8 rounded-3xl border border-rose-100 dark:border-rose-900/20">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                    <Input {...register('emergencyContactName')} className="h-11 bg-white dark:bg-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Relationship</Label>
                    <select {...register('emergencyContactRelation')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-white dark:bg-slate-900 text-sm font-semibold">
                      <option value="">Select Relation</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Emergency Mobile</Label>
                    <Input {...register('emergencyContactMobile')} className="h-11 bg-white dark:bg-slate-900" />
                  </div>
                </div>
              </TabsContent>

              {/* Referral Tab */}
              <TabsContent value="referral" className="space-y-6 mt-0 outline-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Referral Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Referred By (Doctor/Hosp)</Label>
                    <Input {...register('referredBy')} placeholder="Source name" className="h-11 bg-slate-50 dark:bg-slate-900" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Referring Date</Label>
                    <Input type="date" {...register('referringDate')} className="h-11 bg-slate-50 dark:bg-slate-900" />
                  </div>
                </div>
              </TabsContent>

              {/* Biometric Tab */}
              <TabsContent value="biometric" className="space-y-8 mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Patient Photograph</Label>
                    </div>
                    <div className="relative group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-square flex flex-col items-center justify-center transition-all hover:border-primary hover:bg-primary/5">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Patient" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary">
                          <Camera className="h-10 w-10 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Click to upload photo</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Digital Signature</Label>
                    </div>
                    <div className="group overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-square flex flex-col items-center justify-center transition-all hover:border-primary hover:bg-primary/5">
                      <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-primary">
                        <FileText className="h-10 w-10 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Upload or Draw Signature</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Fingerprint Capture</Label>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 aspect-square flex flex-col items-center justify-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        <Activity className="h-8 w-8 text-slate-300" />
                      </div>
                      <Button type="button" variant="outline" className="h-9 px-4 text-xs font-black uppercase tracking-widest border-2">
                        Initialize Scanner
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Insurance Tab */}
              <TabsContent value="insurance" className="space-y-8 mt-0 outline-none">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-1 bg-primary rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Insurance & Billing Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-emerald-50/30 dark:bg-emerald-900/5 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Sponsor Type</Label>
                    <select {...register('sponsorType')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-white dark:bg-slate-900 text-sm font-semibold">
                      <option value="Self">Self Paying</option>
                      <option value="Insurance">Insurance Provider</option>
                      <option value="Company">Corporate / Company</option>
                      <option value="Government">Government Scheme</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Insurance Provider</Label>
                    <select {...register('insuranceProviderId')} className="w-full h-11 border border-slate-200 dark:border-slate-800 rounded-lg px-3 bg-white dark:bg-slate-900 text-sm font-semibold">
                      <option value="">Select Provider</option>
                      {insuranceProviders.map((p) => (
                        <option key={p.id} value={p.id}>{p.providerName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Policy / Card Number</Label>
                    <Input {...register('policyNumber')} placeholder="e.g. POL-998877" className="h-11 bg-white dark:bg-slate-900" />
                  </div>
                </div>
              </TabsContent>

              {/* Death Details Tab */}
              <TabsContent value="death" className="space-y-6 mt-0 outline-none">
                <div className="flex items-center gap-3 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                  <input 
                    type="checkbox" 
                    checked={isDeceased}
                    onChange={(e) => setIsDeceased(e.target.checked)}
                    className="h-6 w-6 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex flex-col">
                    <Label className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white">Mark as Deceased</Label>
                    <span className="text-xs text-slate-500 font-bold">Checking this will close all active encounters for this patient.</span>
                  </div>
                </div>
                
                {isDeceased && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-rose-50/50 dark:bg-rose-900/10 p-8 rounded-3xl border border-rose-100 dark:border-rose-900/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Date of Death *</Label>
                      <Input type="date" {...register('dateOfDeath')} className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Reason / Cause</Label>
                      <Input {...register('deathReason')} placeholder="Clinical reason" className="h-11 bg-white dark:bg-slate-900" />
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="px-8 pb-8 space-y-6">
            <Card className="border-none shadow-inner bg-slate-50 dark:bg-slate-900/50 rounded-3xl">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-black uppercase tracking-widest">{t('patients.consent')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                {[
                  { id: 'consentTermsAccepted', label: t('patients.consent_terms') },
                  { id: 'consentPrivacyAccepted', label: t('patients.consent_privacy') },
                  { id: 'consentHealthDataSharing', label: t('patients.consent_data') },
                ].map((consent) => (
                  <label key={consent.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 cursor-pointer group hover:border-primary/30 transition-all">
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 rounded border-slate-300 text-primary focus:ring-primary"
                      {...register(consent.id as any)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">{consent.label}</span>
                      {errors[consent.id as keyof typeof errors] && (
                        <p className="text-[10px] font-black uppercase tracking-tight text-rose-500 mt-1">Acceptance Required</p>
                      )}
                    </div>
                  </label>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Encrypted Health Record Submission</span>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="h-12 px-8 font-bold border-2">
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="h-12 px-10 font-black shadow-2xl shadow-primary/30 min-w-[200px]">
                  {isSubmitting ? 'Finalizing Record...' : (
                    <span className="flex items-center gap-2">
                      {patientId ? t('patients.update') : t('patients.register')}
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

