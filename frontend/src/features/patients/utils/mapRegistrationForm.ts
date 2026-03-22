import type { CreatePatientPayload } from '../services/patientService';

/** Keep last 10 digits for Indian mobile validation (API: ^[6-9]\d{9}$). */
export function normalizeMobile10(raw: string | undefined | null): string {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

function buildAddressLine1(data: Record<string, unknown>): string | undefined {
  const urban = data.residentType === 'Rural';
  const parts: string[] = [];
  if (!urban) {
    if (data.houseNumber) parts.push(String(data.houseNumber).trim());
    if (data.street) parts.push(String(data.street).trim());
    if (data.location) parts.push(String(data.location).trim());
  } else {
    if (data.village) parts.push(String(data.village).trim());
    if (data.postOffice) parts.push(`PO ${String(data.postOffice).trim()}`);
    if (data.district) parts.push(String(data.district).trim());
  }
  const s = parts.filter(Boolean).join(', ');
  return s || undefined;
}

function optionalMobile(raw: string | undefined | null): string | undefined {
  const m = normalizeMobile10(raw);
  if (m.length !== 10 || !/^[6-9]/.test(m)) return undefined;
  return m;
}

function dateOnlyIso(d: string | undefined): string | undefined {
  if (!d || typeof d !== 'string') return undefined;
  return d.length >= 10 ? d.slice(0, 10) : undefined;
}

/** Maps `PatientRegistrationForm` values to `RegisterPatientRequest` / `CreatePatientPayload`. */
export function mapRegistrationFormToCreatePatientPayload(
  data: Record<string, unknown>
): CreatePatientPayload {
  const mobileNumber = normalizeMobile10(data.mobileNumber as string);
  const dob = dateOnlyIso(data.dateOfBirth as string | undefined);
  if (!dob) {
    throw new Error('Date of birth is required');
  }

  const payload: CreatePatientPayload = {
    firstName: String(data.firstName ?? '').trim(),
    middleName: (data.middleName as string)?.trim() || undefined,
    lastName: String(data.lastName ?? '').trim(),
    gender: (data.gender as CreatePatientPayload['gender']) || 'Male',
    dateOfBirth: dob,
    mobileNumber,
    consentTermsAccepted: Boolean(data.consentTermsAccepted),
    consentPrivacyAccepted: Boolean(data.consentPrivacyAccepted),
    consentHealthDataSharing: Boolean(data.consentHealthDataSharing),
  };

  const bg = (data.bloodGroup as string)?.trim();
  if (bg) payload.bloodGroup = bg;

  const ms = (data.maritalStatus as string)?.trim();
  if (ms) payload.maritalStatus = ms;

  const alt = optionalMobile(data.alternateMobile as string);
  if (alt) payload.alternateMobile = alt;

  const email = (data.email as string)?.trim();
  if (email) payload.email = email;

  const wa = optionalMobile(data.whatsappNumber as string);
  if (wa) payload.whatsAppNumber = wa;
  else payload.whatsAppNumber = mobileNumber;

  const a1 = buildAddressLine1(data);
  if (a1) payload.addressLine1 = a1;

  const city = (data.city as string)?.trim();
  if (city) payload.city = city;
  const state = (data.state as string)?.trim();
  if (state) payload.state = state;
  const pin = (data.pincode as string)?.replace(/\D/g, '');
  if (pin && pin.length === 6) payload.pincode = pin;
  const country = (data.country as string)?.trim();
  if (country) payload.country = country;

  const allergies = (data.allergies as string)?.trim();
  if (allergies) payload.allergiesSummary = allergies;
  const chronic = (data.chronicConditions as string)?.trim();
  if (chronic) payload.chronicConditions = chronic;
  const meds = (data.currentMedications as string)?.trim();
  if (meds) payload.currentMedications = meds;
  const dis = (data.disabilityStatus as string)?.trim();
  if (dis) payload.disabilityStatus = dis;
  payload.organDonor = Boolean(data.organDonor);

  const ecn = (data.emergencyContactName as string)?.trim();
  if (ecn) payload.emergencyContactName = ecn;
  const ecr = (data.emergencyContactRelation as string)?.trim();
  if (ecr) payload.emergencyContactRelation = ecr;
  const ecm = optionalMobile(data.emergencyContactMobile as string);
  if (ecm) payload.emergencyContactMobile = ecm;

  const insId = (data.insuranceProviderId as string)?.trim();
  if (insId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(insId)) {
    payload.insuranceProviderId = insId;
  }

  const pol = (data.policyNumber as string)?.trim();
  if (pol) payload.policyNumber = pol;

  const vf = dateOnlyIso(data.policyStartDate as string | undefined);
  const vt = dateOnlyIso(data.policyEndDate as string | undefined);
  if (vf) payload.validFrom = vf;
  if (vt) payload.validTo = vt;

  return payload;
}

/** Remove empty optional fields so ASP.NET validation does not run regex on "". */
export function stripEmptyOptionalFields<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const k of Object.keys(out)) {
    const v = out[k];
    if (v === '' || v === null || v === undefined) {
      delete out[k];
    }
  }
  return out as T;
}
