import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { patientService } from '../services/patientService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { User, FileText, Camera, Shield } from 'lucide-react';

interface PatientRegistrationFormProps {
  patientId?: string;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function PatientRegistrationForm({ patientId, onSubmit, onCancel, isSubmitting }: PatientRegistrationFormProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isNewborn, setIsNewborn] = useState(false);
  const [isDeceased, setIsDeceased] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [insuranceProviders, setInsuranceProviders] = useState<{ id: string; providerName: string }[]>([]);
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-8 w-full">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="identification">ID</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
              <TabsTrigger value="referral">Referral</TabsTrigger>
              <TabsTrigger value="biometric">Biometric</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="death">Death</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Registration Type *</Label>
                  <select {...register('registrationType', { required: true })} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="General">General</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Staff">Staff</option>
                    <option value="VIP">VIP</option>
                  </select>
                  {errors.registrationType && <span className="text-red-500 text-sm">Required</span>}
                </div>
                
                <div>
                  <Label>Registration Date *</Label>
                  <Input type="date" {...register('registrationDate', { required: true })} />
                </div>
                
                <div>
                  <Label>Registration Time *</Label>
                  <Input type="time" {...register('registrationTime', { required: true })} />
                </div>
                
                <div>
                  <Label>Patient Type</Label>
                  <select {...register('patientType')} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="General">General</option>
                    <option value="Senior Citizen">Senior Citizen</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-3">Patient Details</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Prefix</Label>
                    <select {...register('patientPrefix')} className="w-full border rounded px-3 py-2">
                      <option value="">Select</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Master">Master</option>
                      <option value="Baby">Baby</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>First Name *</Label>
                    <Input {...register('firstName', { required: true })} />
                    {errors.firstName && <span className="text-red-500 text-sm">Required</span>}
                  </div>
                  
                  <div>
                    <Label>Middle Name</Label>
                    <Input {...register('middleName')} />
                  </div>
                  
                  <div>
                    <Label>Last Name *</Label>
                    <Input {...register('lastName', { required: true })} />
                    {errors.lastName && <span className="text-red-500 text-sm">Required</span>}
                  </div>
                  
                  <div>
                    <Label>Alias Name</Label>
                    <Input {...register('aliasName')} />
                  </div>
                  
                  <div>
                    <Label>Gender *</Label>
                    <select {...register('gender', { required: true })} className="w-full border rounded px-3 py-2">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Date of Birth *</Label>
                    <Input 
                      type="date" 
                      {...register('dateOfBirth', { required: !isNewborn })} 
                      onChange={(e) => calculateAge(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>Blood Group</Label>
                    <select {...register('bloodGroup')} className="w-full border rounded px-3 py-2">
                      <option value="">Select</option>
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
                </div>
                
                <div className="grid grid-cols-4 gap-4 mt-4">
                  <div>
                    <Label>Age (Years)</Label>
                    <Input {...register('ageYear')} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Age (Months)</Label>
                    <Input {...register('ageMonth')} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Age (Days)</Label>
                    <Input {...register('ageDay')} readOnly className="bg-gray-50" />
                  </div>
                  <div>
                    <Label>Marital Status</Label>
                    <select {...register('maritalStatus')} className="w-full border rounded px-3 py-2">
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Medical notes (optional)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Allergies</Label>
                      <textarea
                        {...register('allergies')}
                        className="w-full border rounded px-3 py-2 min-h-[80px] text-sm"
                        placeholder="Known drug or other allergies"
                      />
                    </div>
                    <div>
                      <Label>Chronic conditions</Label>
                      <textarea
                        {...register('chronicConditions')}
                        className="w-full border rounded px-3 py-2 min-h-[80px] text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Current medications</Label>
                      <Input {...register('currentMedications')} />
                    </div>
                    <div>
                      <Label>Disability status</Label>
                      <Input {...register('disabilityStatus')} />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mt-4">
                    <input type="checkbox" {...register('organDonor')} />
                    <span>Organ donor</span>
                  </label>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="flex items-center mb-3">
                  <input 
                    type="checkbox" 
                    checked={isNewborn}
                    onChange={(e) => setIsNewborn(e.target.checked)}
                    className="mr-2"
                  />
                  <Label>Newborn / Baby of Mother</Label>
                </div>
                
                {isNewborn && (
                  <div className="grid grid-cols-4 gap-4 bg-blue-50 p-4 rounded">
                    <div>
                      <Label>Mother's CR Number</Label>
                      <Input placeholder="Enter mother's CR number" />
                    </div>
                    <div>
                      <Label>Guardian Relation *</Label>
                      <select {...register('guardianRelation')} className="w-full border rounded px-3 py-2">
                        <option value="">Select</option>
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                      </select>
                    </div>
                    <div>
                      <Label>Guardian First Name *</Label>
                      <Input {...register('guardianFirstName')} />
                    </div>
                    <div>
                      <Label>Guardian Last Name *</Label>
                      <Input {...register('guardianLastName')} />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Personal Identification Tab */}
            <TabsContent value="identification" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Identification Type</Label>
                  <select {...register('identificationType')} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="Aadhar">Aadhar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="DrivingLicense">Driving License</option>
                    <option value="VoterID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <Label>Identification Number</Label>
                  <Input {...register('identificationNumber')} placeholder="Enter ID number" />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline">Add More</Button>
                </div>
              </div>
            </TabsContent>

            {/* Contact Details Tab */}
            <TabsContent value="contact" className="space-y-4 mt-4">
              <div className="flex items-center gap-4 mb-4">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    {...register('residentType')} 
                    value="Urban" 
                    defaultChecked 
                    className="mr-2"
                  />
                  Urban
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    {...register('residentType')} 
                    value="Rural" 
                    className="mr-2"
                  />
                  Rural
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Mobile Number *</Label>
                  <div className="flex gap-2">
                    <select {...register('telephoneCode')} className="w-24 border rounded px-2 py-2">
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                    </select>
                    <Input {...register('mobileNumber', { required: true, pattern: /^[0-9]{10}$/ })} placeholder="10 digit mobile" />
                  </div>
                  {errors.mobileNumber && <span className="text-red-500 text-sm">Valid 10 digit mobile required</span>}
                </div>
                <div>
                  <Label>Alternate Mobile</Label>
                  <Input {...register('alternateMobile')} />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input {...register('whatsappNumber')} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register('email')} />
                </div>
              </div>

              {watch('residentType') === 'Urban' && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>House Number</Label>
                    <Input {...register('houseNumber')} />
                  </div>
                  <div>
                    <Label>Street</Label>
                    <Input {...register('street')} />
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input {...register('location')} />
                  </div>
                </div>
              )}

              {watch('residentType') === 'Rural' && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label>Village</Label>
                    <Input {...register('village')} />
                  </div>
                  <div>
                    <Label>Post Office</Label>
                    <Input {...register('postOffice')} />
                  </div>
                  <div>
                    <Label>District</Label>
                    <Input {...register('district')} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <Label>Country</Label>
                  <Input {...register('country')} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input {...register('state')} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input {...register('city')} />
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input {...register('pincode', { pattern: /^[0-9]{6}$/ })} />
                  {errors.pincode && <span className="text-red-500 text-sm">6 digit pincode required</span>}
                </div>
              </div>
            </TabsContent>

            {/* Emergency Contact Tab */}
            <TabsContent value="emergency" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Contact Person Name</Label>
                  <Input {...register('emergencyContactName')} />
                </div>
                <div>
                  <Label>Relationship</Label>
                  <select {...register('emergencyContactRelation')} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Mobile Number</Label>
                  <Input {...register('emergencyContactMobile')} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" {...register('emergencyContactEmail')} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input {...register('emergencyAddress')} />
                </div>
              </div>
            </TabsContent>

            {/* Referral Details Tab */}
            <TabsContent value="referral" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Referred By</Label>
                  <Input {...register('referredBy')} placeholder="Doctor/Hospital name" />
                </div>
                <div>
                  <Label>Referred To</Label>
                  <Input {...register('referredTo')} />
                </div>
                <div>
                  <Label>Referring Date</Label>
                  <Input type="date" {...register('referringDate')} />
                </div>
              </div>
            </TabsContent>

            {/* Biometric Tab */}
            <TabsContent value="biometric" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="border rounded p-4">
                  <Label className="block mb-2">Patient Photograph</Label>
                  <div className="w-full h-48 border-2 border-dashed rounded flex items-center justify-center bg-gray-50">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Patient" className="max-h-full" />
                    ) : (
                      <Camera className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload}
                    className="mt-2 w-full text-sm"
                  />
                </div>
                
                <div className="border rounded p-4">
                  <Label className="block mb-2">Signature</Label>
                  <div className="w-full h-48 border-2 border-dashed rounded flex items-center justify-center bg-gray-50">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <input type="file" accept="image/*" className="mt-2 w-full text-sm" />
                </div>
                
                <div className="border rounded p-4">
                  <Label className="block mb-2">Fingerprint</Label>
                  <div className="w-full h-48 border-2 border-dashed rounded flex items-center justify-center bg-gray-50">
                    <span className="text-gray-400">Fingerprint Scanner</span>
                  </div>
                  <Button type="button" variant="outline" className="mt-2 w-full">Capture</Button>
                </div>
              </div>
            </TabsContent>

            {/* Insurance Tab */}
            <TabsContent value="insurance" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Sponsor Type</Label>
                  <select {...register('sponsorType')} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="Self">Self</option>
                    <option value="Company">Company</option>
                    <option value="Government">Government</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>
                <div>
                  <Label>Insurance provider</Label>
                  <select {...register('insuranceProviderId')} className="w-full border rounded px-3 py-2">
                    <option value="">— Select —</option>
                    {insuranceProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.providerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Policy Number</Label>
                  <Input {...register('policyNumber')} />
                </div>
                <div>
                  <Label>Policy Holder Name</Label>
                  <Input {...register('policyHolderName')} />
                </div>
                <div>
                  <Label>Policy Holder Relation</Label>
                  <select {...register('policyHolderRelation')} className="w-full border rounded px-3 py-2">
                    <option value="">Select</option>
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                  </select>
                </div>
                <div>
                  <Label>Certificate Number</Label>
                  <Input {...register('certificateNumber')} />
                </div>
                <div>
                  <Label>Policy Start Date</Label>
                  <Input type="date" {...register('policyStartDate')} />
                </div>
                <div>
                  <Label>Policy End Date</Label>
                  <Input type="date" {...register('policyEndDate')} />
                </div>
                <div>
                  <Label>Employee Number</Label>
                  <Input {...register('employeeNumber')} />
                </div>
              </div>
            </TabsContent>

            {/* Death Details Tab */}
            <TabsContent value="death" className="space-y-4 mt-4">
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  checked={isDeceased}
                  onChange={(e) => setIsDeceased(e.target.checked)}
                  className="mr-2"
                />
                <Label>Mark as Deceased</Label>
              </div>
              
              {isDeceased && (
                <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded">
                  <div>
                    <Label>Date of Death *</Label>
                    <Input type="date" {...register('dateOfDeath')} />
                  </div>
                  <div>
                    <Label>Reason of Death *</Label>
                    <Input {...register('deathReason')} />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Card className="border-amber-200 bg-amber-50/40 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-5 w-5 text-amber-800" />
                Declarations &amp; consent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register('consentTermsAccepted', {
                    validate: (v) => v === true || 'Required for registration',
                  })}
                />
                <span>I accept the facility terms of service and rules of admission.</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register('consentPrivacyAccepted', {
                    validate: (v) => v === true || 'Required for registration',
                  })}
                />
                <span>I accept the privacy and data protection policy.</span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register('consentHealthDataSharing', {
                    validate: (v) => v === true || 'Required for registration',
                  })}
                />
                <span>
                  I consent to necessary sharing of health information with insurers / payers for cashless
                  and claims, as applicable.
                </span>
              </label>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {patientId ? 'Update Patient' : isSubmitting ? 'Registering…' : 'Register Patient'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
