/**
 * PatientRegistrationForm Component
 * Multi-step patient registration form
 * Inspired by web-softclinic-app's patientregistrations-detail component
 */

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { enhancedPatientService, PatientRegistration, PatientPersonalInfo, PatientContactDetails, PatientEmergencyContact } from '../services/enhancedPatientService';

interface PatientRegistrationFormProps {
  patientId?: string;
  onSuccess?: (patient: PatientRegistration) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

type FormStep = 'personal' | 'contact' | 'emergency' | 'insurance' | 'review';

const PatientRegistrationForm: React.FC<PatientRegistrationFormProps> = ({
  patientId,
  onSuccess,
  onCancel,
  isModal = false
}) => {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patientTypes, setPatientTypes] = useState<any[]>([]);
  const [registrationTypes, setRegistrationTypes] = useState<any[]>([]);
  const [patientPrefixes, setPatientPrefixes] = useState<any[]>([]);
  const [genders, setGenders] = useState<any[]>([]);
  const [bloodGroups, setBloodGroups] = useState<any[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const methods = useForm<PatientRegistration>({
    mode: 'onChange',
    defaultValues: {
      personalInfo: {
        firstName: '',
        middleName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '',
        bloodGroup: '',
        maritalStatus: 'Single'
      },
      contactDetails: {
        mobileNo: '',
        alternateMobile: '',
        emailId: '',
        addressLine1: '',
        city: '',
        state: '',
        pincode: '',
        country: ''
      },
      emergencyContact: {
        name: '',
        relation: '',
        mobileNo: ''
      }
    }
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, getValues } = methods;

  // Watch form values for duplicate check
  const watchFirstName = watch('personalInfo.firstName');
  const watchLastName = watch('personalInfo.lastName');
  const watchMobileNo = watch('contactDetails.mobileNo');
  const watchDOB = watch('personalInfo.dateOfBirth');

  // Load master data on mount
  useEffect(() => {
    loadMasterData();
    if (patientId) {
      loadPatientData(patientId);
    }
  }, [patientId]);

  // Auto-check for duplicates when relevant fields change
  useEffect(() => {
    if (watchFirstName && watchLastName && watchMobileNo && watchDOB) {
      const timer = setTimeout(() => {
        checkDuplicates();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchFirstName, watchLastName, watchMobileNo, watchDOB]);

  const loadMasterData = async () => {
    try {
      const [types, regTypes, prefixes, genderEnum, bloodGroupEnum, maritalStatusEnum, countryList] = await Promise.all([
        enhancedPatientService.getPatientTypes(),
        enhancedPatientService.getRegistrationTypes(),
        enhancedPatientService.getPatientPrefixes(),
        enhancedPatientService.getEnumByType('Gender'),
        enhancedPatientService.getEnumByType('BloodGroup'),
        enhancedPatientService.getEnumByType('MaritalStatus'),
        enhancedPatientService.getCountries()
      ]);

      setPatientTypes(types);
      setRegistrationTypes(regTypes);
      setPatientPrefixes(prefixes);
      setGenders(genderEnum);
      setBloodGroups(bloodGroupEnum);
      setMaritalStatuses(maritalStatusEnum);
      setCountries(countryList);
    } catch (error) {
      console.error('Error loading master data:', error);
    }
  };

  const loadPatientData = async (id: string) => {
    setLoading(true);
    try {
      const patient = await enhancedPatientService.getPatientById(id);
      if (patient) {
        // Populate form with patient data
        Object.keys(patient).forEach(key => {
          if (patient[key] !== undefined && patient[key] !== null) {
            setValue(key as any, patient[key]);
          }
        });
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDuplicates = async () => {
    if (!watchMobileNo || !watchFirstName || !watchDOB) return;

    setDuplicateCheckLoading(true);
    try {
      const result = await enhancedPatientService.checkDuplicates({
        mobileNumber: watchMobileNo,
        firstName: watchFirstName,
        lastName: watchLastName,
        dateOfBirth: watchDOB
      });

      if (result.data && result.data.length > 0) {
        setDuplicates(result.data);
        setShowDuplicateModal(true);
      } else {
        setDuplicates([]);
        setShowDuplicateModal(false);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setDuplicateCheckLoading(false);
    }
  };

  const handleStateChange = async (countryId: string | undefined) => {
    if (!countryId) return;
    try {
      const stateList = await enhancedPatientService.getStates(countryId);
      setStates(stateList);
      setValue('contactDetails.state' as any, '');
      setCities([]);
    } catch (error) {
      console.error('Error loading states:', error);
    }
  };

  const handleCityChange = async (stateId: string | undefined) => {
    if (!stateId) return;
    try {
      const cityList = await enhancedPatientService.getCities(stateId);
      setCities(cityList);
      setValue('contactDetails.city' as any, '');
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const onSubmit = async (data: PatientRegistration) => {
    setSaving(true);
    try {
      let result;
      if (patientId) {
        // Update existing patient
        result = await enhancedPatientService.updatePatient(patientId, data);
      } else {
        // Register new patient
        result = await enhancedPatientService.registerPatient(data);
      }

      if (onSuccess) {
        onSuccess(result.data || result);
      }
    } catch (error: any) {
      console.error('Error saving patient:', error);
      alert(error.message || 'Error saving patient. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const steps: { key: FormStep; label: string; icon: string }[] = [
    { key: 'personal', label: 'Personal Information', icon: '👤' },
    { key: 'contact', label: 'Contact Details', icon: '📞' },
    { key: 'emergency', label: 'Emergency Contact', icon: '🚨' },
    { key: 'insurance', label: 'Insurance', icon: '🏥' },
    { key: 'review', label: 'Review & Submit', icon: '✅' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return renderPersonalInfoStep();
      case 'contact':
        return renderContactDetailsStep();
      case 'emergency':
        return renderEmergencyContactStep();
      case 'insurance':
        return renderInsuranceStep();
      case 'review':
        return renderReviewStep();
      default:
        return renderPersonalInfoStep();
    }
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prefix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
          <select
            {...register('prefixId' as any)}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Prefix</option>
            {patientPrefixes.map(prefix => (
              <option key={prefix.id} value={prefix.id}>{prefix.displayName}</option>
            ))}
          </select>
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('personalInfo.firstName', { required: 'First name is required' })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.personalInfo?.firstName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter first name"
          />
          {errors.personalInfo?.firstName && (
            <p className="mt-1 text-sm text-red-500">{errors.personalInfo.firstName.message}</p>
          )}
        </div>

        {/* Middle Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
          <input
            {...register('personalInfo.middleName')}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter middle name"
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('personalInfo.lastName', { required: 'Last name is required' })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.personalInfo?.lastName ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter last name"
          />
          {errors.personalInfo?.lastName && (
            <p className="mt-1 text-sm text-red-500">{errors.personalInfo.lastName.message}</p>
          )}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            {...register('personalInfo.gender', { required: 'Gender is required' })}
            className={`form-select w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.personalInfo?.gender ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Gender</option>
            {genders.map(gender => (
              <option key={gender.value} value={gender.value}>{gender.displayName}</option>
            ))}
          </select>
          {errors.personalInfo?.gender && (
            <p className="mt-1 text-sm text-red-500">{errors.personalInfo.gender.message}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            {...register('personalInfo.dateOfBirth', { required: 'Date of birth is required' })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.personalInfo?.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.personalInfo?.dateOfBirth && (
            <p className="mt-1 text-sm text-red-500">{errors.personalInfo.dateOfBirth.message}</p>
          )}
        </div>

        {/* Age (Calculated) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input
            type="text"
            readOnly
            value={watchDOB ? `${calculateAge(watchDOB)} years` : ''}
            className="form-input w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded-md"
          />
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
          <select
            {...register('personalInfo.bloodGroup')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Blood Group</option>
            {bloodGroups.map(bg => (
              <option key={bg.value} value={bg.value}>{bg.displayName}</option>
            ))}
          </select>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
          <select
            {...register('personalInfo.maritalStatus')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Marital Status</option>
            {maritalStatuses.map(ms => (
              <option key={ms.value} value={ms.value}>{ms.displayName}</option>
            ))}
          </select>
        </div>

        {/* Patient Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('patientTypeId', { required: 'Patient type is required' })}
            className={`form-select w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.patientTypeId ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Patient Type</option>
            {patientTypes.map(type => (
              <option key={type.id} value={type.id}>{type.displayName}</option>
            ))}
          </select>
          {errors.patientTypeId && (
            <p className="mt-1 text-sm text-red-500">{errors.patientTypeId.message}</p>
          )}
        </div>

        {/* Registration Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register('registrationTypeId', { required: 'Registration type is required' })}
            className={`form-select w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.registrationTypeId ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select Registration Type</option>
            {registrationTypes.map(type => (
              <option key={type.id} value={type.id}>{type.displayName}</option>
            ))}
          </select>
          {errors.registrationTypeId && (
            <p className="mt-1 text-sm text-red-500">{errors.registrationTypeId.message}</p>
          )}
        </div>

        {/* UHID (Auto-generated for new patients) */}
        {!patientId && (
          <div className="col-span-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> UHID will be auto-generated upon registration.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContactDetailsStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Contact Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register('contactDetails.mobileNo', {
              required: 'Mobile number is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Invalid mobile number (10 digits required)'
              }
            })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.contactDetails?.mobileNo ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter mobile number"
          />
          {errors.contactDetails?.mobileNo && (
            <p className="mt-1 text-sm text-red-500">{errors.contactDetails.mobileNo.message}</p>
          )}
        </div>

        {/* Alternate Mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile</label>
          <input
            {...register('contactDetails.alternateMobile', {
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Invalid mobile number (10 digits required)'
              }
            })}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter alternate mobile"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            {...register('contactDetails.emailId', {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter email address"
          />
        </div>

        {/* Address Line 1 */}
        <div className="col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            {...register('contactDetails.addressLine1')}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter address"
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            {...register('contactDetails.country')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => handleStateChange(e.target.value)}
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>{country.name}</option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            {...register('contactDetails.state')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            onChange={(e) => handleCityChange(e.target.value)}
          >
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state.id} value={state.id}>{state.name}</option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <select
            {...register('contactDetails.city')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
        </div>

        {/* Pincode */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input
            {...register('contactDetails.pincode', {
              pattern: {
                value: /^[0-9]{6}$/,
                message: 'Invalid pincode (6 digits required)'
              }
            })}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter pincode"
          />
        </div>
      </div>
    </div>
  );

  const renderEmergencyContactStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Emergency Contact Name */}
        <div className="col-span-3 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Person Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('emergencyContact.name', { required: 'Emergency contact name is required' })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.emergencyContact?.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter contact person name"
          />
          {errors.emergencyContact?.name && (
            <p className="mt-1 text-sm text-red-500">{errors.emergencyContact.name.message}</p>
          )}
        </div>

        {/* Relation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
          <select
            {...register('emergencyContact.relation')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Relation</option>
            <option value="Spouse">Spouse</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Child">Child</option>
            <option value="Friend">Friend</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Emergency Mobile */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emergency Mobile <span className="text-red-500">*</span>
          </label>
          <input
            {...register('emergencyContact.mobileNo', {
              required: 'Emergency mobile is required',
              pattern: {
                value: /^[0-9]{10}$/,
                message: 'Invalid mobile number (10 digits required)'
              }
            })}
            className={`form-input w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.emergencyContact?.mobileNo ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter emergency mobile"
          />
          {errors.emergencyContact?.mobileNo && (
            <p className="mt-1 text-sm text-red-500">{errors.emergencyContact.mobileNo.message}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInsuranceStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Insurance Details (Optional)</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Insurance Provider */}
        <div className="col-span-3 md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
          <select
            {...register('insuranceDetails.insuranceProviderId')}
            className="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select Insurance Provider</option>
            {/* Insurance providers would be loaded here */}
          </select>
        </div>

        {/* Policy Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
          <input
            {...register('insuranceDetails.policyNumber')}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Enter policy number"
          />
        </div>

        {/* Valid From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
          <input
            type="date"
            {...register('insuranceDetails.validFrom')}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Valid To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
          <input
            type="date"
            {...register('insuranceDetails.validTo')}
            className="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const formData = getValues();
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Review & Submit</h3>
        
        {/* Personal Information Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {formData.personalInfo?.firstName} {formData.personalInfo?.lastName}</p>
            <p><span className="text-gray-500">Gender:</span> {formData.personalInfo?.gender}</p>
            <p><span className="text-gray-500">Date of Birth:</span> {formData.personalInfo?.dateOfBirth}</p>
            <p><span className="text-gray-500">Blood Group:</span> {formData.personalInfo?.bloodGroup || 'Not specified'}</p>
          </div>
        </div>

        {/* Contact Details Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Contact Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-gray-500">Mobile:</span> {formData.contactDetails?.mobileNo}</p>
            <p><span className="text-gray-500">Email:</span> {formData.contactDetails?.emailId || 'Not provided'}</p>
            <p><span className="text-gray-500">City:</span> {formData.contactDetails?.city || 'Not specified'}</p>
          </div>
        </div>

        {/* Emergency Contact Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p><span className="text-gray-500">Name:</span> {formData.emergencyContact?.name}</p>
            <p><span className="text-gray-500">Relation:</span> {formData.emergencyContact?.relation || 'Not specified'}</p>
            <p><span className="text-gray-500">Mobile:</span> {formData.emergencyContact?.mobileNo}</p>
          </div>
        </div>

        {/* Consent */}
        <div className="mt-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              {...register('consentAccepted' as any, { required: 'You must accept the terms' })}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              I confirm that the information provided is accurate and I agree to the terms and conditions.
            </span>
          </label>
          {(errors as any).consentAccepted && (
            <p className="mt-1 text-sm text-red-500">{(errors as any).consentAccepted.message}</p>
          )}
        </div>
      </div>
    );
  };

  const Container = isModal ? 'modal-body' : 'container mx-auto p-6';

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className={Container}>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={step.key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === currentStepIndex
                            ? 'bg-blue-600 text-white'
                            : index < currentStepIndex
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {index < currentStepIndex ? '✓' : step.icon}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${
                        index === currentStepIndex ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="bg-white">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="mt-6 flex justify-between">
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(steps[currentStepIndex - 1].key)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              <div className="flex space-x-3">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}

                {currentStepIndex < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(steps[currentStepIndex + 1].key)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      patientId ? 'Update Patient' : 'Register Patient'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Duplicate Patient Modal */}
            {showDuplicateModal && duplicates.length > 0 && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                  <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Potential Duplicate Patients Found</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We found {duplicates.length} patient(s) that may match this registration. Please review before proceeding.
                  </p>
                  <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                    {duplicates.map((patient) => (
                      <div key={patient.patientId} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium">{patient.displayName}</p>
                        <p className="text-sm text-gray-600">
                          UHID: {patient.uhid} | Mobile: {patient.mobileNo} | Age: {patient.age}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowDuplicateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Continue Registration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </form>
    </FormProvider>
  );
};

export default PatientRegistrationForm;