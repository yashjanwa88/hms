// ============================================
// PATIENT MODULE - COMPLETE TYPE DEFINITIONS
// ============================================

// Base Types
export interface BaseEntity {
  id: string;
  tenantId: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
  isDeleted: boolean;
}

// ============================================
// 1. PATIENT REGISTRATION MODELS
// ============================================

export interface PatientRegistrationModel extends BaseEntity {
  patregi: PatRegiModel;
  patientPersonalInfo: PatientPersonalInfoModel;
  patientContactDetail: PatientContactDetailsModel;
  patientEmergencyContactDetails: PatientEmergencyContactDetailsModel;
  patientPersonalIdentificationDetails: PatientPersonalIdentificationDetailsModel[];
  patientFertilityInformationDetail?: PatientFertilityInformationDetailsModel;
  patientReferralDetails: PatientReferralDetailModel;
  patientGuardianDetails: PatientGuardianDetailsModel;
  patientPhotographDetail: PatientPhotographDetailModel;
  patientSignatureDetail: PatientSignatureDetailModel;
  patientFingerPrintDetail: PatientFingerprintDetailModel;
  patientInsuranceDetail: PatientInsuranceDetailModel[];
  patientInsuranceCardImage: PatientInsuranceCardImageModel;
  patientDeathDetail: PatientDeathDetailModel;
}

export interface PatRegiModel {
  id?: string;
  code: string;
  registrationNumber?: string;
  registrationDate: Date | string;
  registrationTime: string;
  registrationtypeId: string;
  registrationTypeName?: string;
  patienttypeId: string;
  patientTypeName?: string;
  patientprefixId?: string;
  patientPrefixName?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  aliasName?: string;
  fullName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: Date | string;
  ageYear?: number;
  ageMonth?: number;
  ageDay?: number;
  ageType?: 'Years' | 'Months' | 'Days';
  bloodGroup?: string;
  maritalStatus?: string;
  language?: string;
  nationality?: string;
  religion?: string;
  occupation?: string;
  education?: string;
  status: 'Active' | 'Inactive' | 'Merged' | 'Deceased';
  validTill?: Date | string;
  facilityId?: string;
  facilityName?: string;
  newborn: boolean;
  motherCrNo?: string;
  staffCode?: string;
  guardianRelationshipSalutation?: string;
  guardianPrefixId?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianLastName?: string;
  guardianMobileNo?: string;
  age?: string;
  fromTime?: string;
  checked?: boolean;
}

export interface PatientPersonalInfoModel {
  id?: string;
  patientId: string;
  maritalStatusId?: string;
  maritalStatusName?: string;
  nationalityId?: string;
  nationalityName?: string;
  religionId?: string;
  religionName?: string;
  occupationId?: string;
  occupationName?: string;
  educationId?: string;
  educationName?: string;
  ethnicityId?: string;
  ethnicityName?: string;
  languageId?: string;
  languageName?: string;
  birthPlace?: string;
  motherTongue?: string;
  fatherName?: string;
  motherName?: string;
  spouseName?: string;
  numberOfChildren?: number;
  annualIncome?: number;
  socialSecurityNumber?: string;
  passportNumber?: string;
  drivingLicenseNumber?: string;
  voterIdNumber?: string;
  rationCardNumber?: string;
  panCardNumber?: string;
  aadharCardNumber?: string;
}

export interface PatientContactDetailsModel {
  id?: string;
  patientId: string;
  contactType: 'ContactDetail' | 'EmergencyDetail';
  residentType: 'Urban' | 'Rural';
  mobileNo?: string;
  alternateMobileNo?: string;
  whatsappNumber?: string;
  telephoneCode: string;
  landOfficePhoneNo?: string;
  landHomePhoneNo?: string;
  emailId?: string;
  houseNumber?: string;
  street?: string;
  location?: string;
  village?: string;
  postOffice?: string;
  countryId?: string;
  countryName?: string;
  country?: string;
  stateId?: string;
  stateName?: string;
  state?: string;
  districtId?: string;
  districtName?: string;
  district?: string;
  cityId?: string;
  cityName?: string;
  city?: string;
  pincode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  preferredContactMethod?: 'Mobile' | 'Email' | 'WhatsApp' | 'Phone';
  preferredContactTime?: string;
}

export interface PatientEmergencyContactDetailsModel extends PatientContactDetailsModel {
  contactPersonFirstName?: string;
  contactPersonMiddleName?: string;
  contactPersonLastName?: string;
  contactPersonFullName?: string;
  relationship?: string;
  patientprefixId?: string;
  prefixName?: string;
  isPrimaryContact: boolean;
  canMakeDecisions: boolean;
}

export interface PatientPersonalIdentificationDetailsModel {
  id?: string;
  patientId: string;
  identificationTypeId: string;
  identificationTypeName?: string;
  identificationNo: string;
  issuingAuthority?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  issuingCountry?: string;
  issuingState?: string;
  documentPath?: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedDate?: Date | string;
  isPrimary: boolean;
  notes?: string;
}

export interface PatientFertilityInformationDetailsModel {
  id?: string;
  patientId: string;
  typeValue: 'Partner' | 'Spouse' | 'Donor';
  patientprefixId?: string;
  prefixName?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName?: string;
  gender: 'Male' | 'Female' | 'Other';
  dob?: Date | string;
  ageYear?: number;
  ageMonth?: number;
  ageDay?: number;
  ageType?: 'Years' | 'Months' | 'Days';
  fileNo: string;
  mobileNo?: string;
  telephoneCode: string;
  emailId?: string;
  relationship?: string;
  notes?: string;
}

export interface PatientReferralDetailModel {
  id?: string;
  patientId: string;
  referredBy?: string;
  referredByType?: 'Doctor' | 'Hospital' | 'Clinic' | 'Self' | 'Other';
  referredByDoctorId?: string;
  referredByDoctorName?: string;
  referredByHospitalId?: string;
  referredByHospitalName?: string;
  referredTo?: string;
  referredToType?: 'Doctor' | 'Department' | 'Specialist';
  referredToDoctorId?: string;
  referredToDoctorName?: string;
  referredToDepartmentId?: string;
  referredToDepartmentName?: string;
  referringDate?: Date | string;
  referralReason?: string;
  referralNotes?: string;
  referralLetterPath?: string;
  isExternalReferral: boolean;
}

export interface PatientGuardianDetailsModel {
  id?: string;
  patientId: string;
  regCategory?: 'GEENRALCATEGORY' | 'ACCIDENTANDEMERGENCYCATEGORY' | 'STAFFCATEGORY';
  guardianRelationshipSalutation?: string;
  guardianPrefixId?: string;
  guardianPrefixName?: string;
  guardianFirstName?: string;
  guardianMiddleName?: string;
  guardianLastName?: string;
  guardianFullName?: string;
  guardianGender?: 'Male' | 'Female' | 'Other';
  guardianDob?: Date | string;
  guardianAge?: string;
  guardianMobileNo?: string;
  guardianEmailId?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  guardianAadharNumber?: string;
  guardianPanNumber?: string;
  isLegalGuardian: boolean;
  guardianshipDocument?: string;
  guardianshipValidTill?: Date | string;
}

export interface PatientPhotographDetailModel {
  id?: string;
  patientId: string;
  imagePath?: string | any;
  imageBase64?: string;
  imageType?: string;
  imageSize?: number;
  capturedDate?: Date | string;
  capturedBy?: string;
  notes?: string;
}

export interface PatientSignatureDetailModel {
  id?: string;
  patientId: string;
  imagePath?: string | any;
  imageBase64?: string;
  imageType?: string;
  imageSize?: number;
  capturedDate?: Date | string;
  capturedBy?: string;
  notes?: string;
}

export interface ImageItem {
  id?: string;
  fingerType: 'LeftThumb' | 'LeftIndex' | 'LeftMiddle' | 'LeftRing' | 'LeftLittle' | 
               'RightThumb' | 'RightIndex' | 'RightMiddle' | 'RightRing' | 'RightLittle';
  imagePath: string | any;
  imageBase64?: string;
  quality?: number;
  capturedDate?: Date | string;
}

export interface PatientFingerprintDetailModel {
  id?: string;
  patientId: string;
  imageList: ImageItem[];
  capturedBy?: string;
  capturedDate?: Date | string;
  deviceId?: string;
  deviceName?: string;
  notes?: string;
}

export interface PatientInsuranceDetailModel {
  id?: string;
  patientId: string;
  sponsorType: 'Self' | 'Company' | 'Government' | 'Insurance' | 'TPA';
  insuranceCompanyId?: string;
  insuranceCompanyName?: string;
  tpaId?: string;
  tpaName?: string;
  organizationId?: string;
  organizationName?: string;
  policyNumber: string;
  policyHolderName: string;
  policyHolderRelation?: string;
  policyHolderDob?: Date | string;
  policyHolderGender?: string;
  certificateNumber?: string;
  employeeNumber?: string;
  membershipNumber?: string;
  policyStartDate?: Date | string;
  policyEndDate?: Date | string;
  coverageAmount?: number;
  copayPercentage?: number;
  deductibleAmount?: number;
  isPrimary: boolean;
  isActive: boolean;
  claimLimit?: number;
  claimedAmount?: number;
  balanceAmount?: number;
  preAuthorizationRequired: boolean;
  cashlessAvailable: boolean;
  networkType?: 'PPO' | 'HMO' | 'EPO' | 'POS';
  notes?: string;
}

export interface PatientInsuranceCardImageModel {
  id?: string;
  patientId: string;
  insuranceDetailId?: string;
  frontImagePath?: string;
  frontImageBase64?: string;
  backImagePath?: string;
  backImageBase64?: string;
  uploadedDate?: Date | string;
  uploadedBy?: string;
}

export interface PatientDeathDetailModel {
  id?: string;
  patientId: string;
  deceased: boolean;
  checkedDeceased?: boolean;
  deceasedDatetime?: Date | string;
  deathReason?: string;
  deathCause?: 'Natural' | 'Accident' | 'Suicide' | 'Homicide' | 'Unknown';
  deathPlace?: string;
  deathCertificateNumber?: string;
  deathCertificatePath?: string;
  informedBy?: string;
  informedDate?: Date | string;
  postMortemRequired: boolean;
  postMortemDone: boolean;
  postMortemReportPath?: string;
  bodyDisposalMethod?: 'Burial' | 'Cremation' | 'Donation' | 'Other';
  bodyDisposalDate?: Date | string;
  bodyDisposalPlace?: string;
  notes?: string;
}

export interface PatientPrefixModel extends BaseEntity {
  code: string;
  displayName: string;
  description?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'All';
  sortOrder: number;
  isActive: boolean;
}

export interface PatientTypeModel extends BaseEntity {
  code: string;
  name: string;
  displayName: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  discountPercentage?: number;
  specialInstructions?: string;
}

export interface RegistrationTypeModel extends BaseEntity {
  code: string;
  name: string;
  displayName: string;
  description?: string;
  regCategory: 'GEENRALCATEGORY' | 'ACCIDENTANDEMERGENCYCATEGORY' | 'STAFFCATEGORY';
  color?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  validityDays?: number;
  registrationFee?: number;
  renewalFee?: number;
  registrationParamInfoDetail: RegistrationParamInfoDetailModel[];
  registrationFeeDetail: PatientRegistrationFeeDetailModel[];
  patientTypeDetail: PatientTypeDetailModel[];
}

export interface RegistrationParamInfoDetailModel {
  id?: string;
  registrationTypeId?: string;
  patientRegistrationFeature: string;
  enable: boolean;
  expand: boolean;
  required: boolean;
  sortOrder: number;
}

export interface PatientRegistrationFeeDetailModel {
  id?: string;
  registrationTypeId: string;
  patientTypeId: string;
  patientTypeName?: string;
  registrationFee: number;
  renewalFee: number;
  validityDays: number;
  isActive: boolean;
}

export interface PatientTypeDetailModel {
  id?: string;
  registrationTypeId: string;
  patientTypeId: string;
  patientTypeName?: string;
  isActive: boolean;
}

export interface PatientSearchModel {
  searchText?: string;
  uhid?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  patientTypeId?: string;
  registrationTypeId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  ageFrom?: number;
  ageTo?: number;
  bloodGroup?: string;
  city?: string;
  state?: string;
  pincode?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PatientInfoModel {
  id: string;
  uhid: string;
  registrationNumber?: string;
  fullName: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  age: string;
  ageYear?: number;
  dateOfBirth?: string;
  bloodGroup?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  patientType?: string;
  registrationType?: string;
  status: string;
  registrationDate: string;
  lastVisitDate?: string;
  photoUrl?: string;
  insuranceStatus?: string;
  outstandingAmount?: number;
  totalVisits?: number;
  allergies?: string;
  chronicConditions?: string;
}

export interface FileManagerModel {
  id?: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  fileBase64?: string;
  category: 'Medical' | 'Insurance' | 'Identity' | 'Report' | 'Prescription' | 'Other';
  subCategory?: string;
  description?: string;
  uploadedDate: Date | string;
  uploadedBy: string;
  uploadedByName?: string;
  documentDate?: Date | string;
  expiryDate?: Date | string;
  isConfidential: boolean;
  accessLevel: 'Public' | 'Private' | 'Restricted';
  tags?: string[];
  version: number;
  parentFileId?: string;
  isLatestVersion: boolean;
  downloadCount: number;
  lastAccessedDate?: Date | string;
  lastAccessedBy?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  timestamp: string;
}

export interface DropdownOption {
  id: string;
  code?: string;
  name: string;
  displayName?: string;
  value?: any;
  isActive?: boolean;
  sortOrder?: number;
}
