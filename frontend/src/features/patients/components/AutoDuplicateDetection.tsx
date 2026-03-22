import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, User, Phone, Calendar, X } from 'lucide-react';
import { patientService } from '../services/patientService';

interface DuplicateMatch {
  id: string;
  uhid: string;
  fullName: string;
  mobileNumber: string;
  dateOfBirth: string;
  gender: string;
  city?: string;
  registrationDate: string;
  matchScore: number;
  matchReasons: string[];
}

interface AutoDuplicateDetectionProps {
  formData: {
    firstName?: string;
    lastName?: string;
    mobileNumber?: string;
    dateOfBirth?: string;
  };
  onMerge?: (duplicateId: string) => void;
  onIgnore?: () => void;
}

function buildMatchReasons(form: AutoDuplicateDetectionProps['formData'], patient: any): string[] {
  const reasons: string[] = [];
  if (form.mobileNumber && patient.mobileNumber === form.mobileNumber)
    reasons.push('Exact mobile number match');
  if (form.firstName && patient.firstName?.toLowerCase() === form.firstName.toLowerCase())
    reasons.push('First name match');
  if (form.lastName && patient.lastName?.toLowerCase() === form.lastName.toLowerCase())
    reasons.push('Last name match');
  if (form.dateOfBirth && patient.dateOfBirth?.startsWith(form.dateOfBirth))
    reasons.push('Date of birth match');
  return reasons.length > 0 ? reasons : ['Similar patient record'];
}

function scoreMatch(reasons: string[]): number {
  let score = 50;
  if (reasons.some(r => r.includes('mobile'))) score += 40;
  if (reasons.some(r => r.includes('First name'))) score += 15;
  if (reasons.some(r => r.includes('Last name'))) score += 15;
  if (reasons.some(r => r.includes('birth'))) score += 20;
  return Math.min(score, 99);
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAutoDuplicateDetection(formData: AutoDuplicateDetectionProps['formData']) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!formData.firstName || !formData.mobileNumber) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setIsChecking(true);

      try {
        const res = await patientService.checkDuplicates({
          mobileNumber: formData.mobileNumber!,
          firstName: formData.firstName!,
          lastName: formData.lastName ?? '',
          dateOfBirth: formData.dateOfBirth ?? '',
        });

        const raw: any[] = res?.data?.duplicates ?? res?.data ?? [];
        const mapped: DuplicateMatch[] = raw.map((p: any) => {
          const reasons = buildMatchReasons(formData, p);
          return {
            id: p.id,
            uhid: p.uhid ?? p.UHID,
            fullName: p.fullName ?? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
            mobileNumber: p.mobileNumber ?? p.mobile_number,
            dateOfBirth: p.dateOfBirth ?? p.date_of_birth,
            gender: p.gender,
            city: p.city,
            registrationDate: p.registrationDate ?? p.registration_date,
            matchScore: scoreMatch(reasons),
            matchReasons: reasons,
          };
        });

        setDuplicates(mapped);
      } catch {
        // Silently ignore - duplicate check is non-blocking
        setDuplicates([]);
      } finally {
        setIsChecking(false);
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [formData.firstName, formData.lastName, formData.mobileNumber, formData.dateOfBirth]);

  return { duplicates, isChecking };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AutoDuplicateDetection({ formData, onMerge, onIgnore }: AutoDuplicateDetectionProps) {
  const { duplicates, isChecking } = useAutoDuplicateDetection(formData);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when new duplicates arrive
  useEffect(() => { if (duplicates.length > 0) setDismissed(false); }, [duplicates.length]);

  if (dismissed || (!isChecking && duplicates.length === 0)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-2 border-orange-500 shadow-2xl">
        <CardContent className="p-0">
          <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold">
                {isChecking ? 'Checking for duplicates...' : `Potential Duplicate Detected!`}
              </h3>
            </div>
            <button onClick={() => setDismissed(true)} className="hover:bg-orange-600 rounded p-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!isChecking && (
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700">
                Found {duplicates.length} existing patient(s) with similar information:
              </p>

              {duplicates.map((dup) => (
                <div key={dup.id} className="border rounded-lg p-3 bg-orange-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-orange-700">
                      Match Score: {dup.matchScore}%
                    </span>
                    <span className="text-xs px-2 py-1 bg-orange-200 text-orange-800 rounded">
                      {dup.matchScore >= 90 ? 'High' : dup.matchScore >= 70 ? 'Medium' : 'Low'}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-gray-500" />
                      <span className="font-semibold">{dup.fullName}</span>
                      <span className="text-gray-500 text-xs">({dup.uhid})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3 w-3" />
                      <span>{dup.mobileNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {dup.dateOfBirth ? new Date(dup.dateOfBirth).toLocaleDateString() : '—'}
                        {dup.gender ? ` • ${dup.gender}` : ''}
                        {dup.city ? ` • ${dup.city}` : ''}
                      </span>
                    </div>
                  </div>

                  <ul className="text-xs text-gray-600 mb-3 space-y-1">
                    {dup.matchReasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-orange-500 rounded-full" />
                        {r}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => window.open(`/patients/${dup.id}`, '_blank')}
                    >
                      View Patient
                    </Button>
                    {onMerge && (
                      <Button size="sm" className="flex-1 text-xs" onClick={() => onMerge(dup.id)}>
                        Use This Record
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t p-4 bg-gray-50 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setDismissed(true)}>
              Ignore & Continue
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => { onIgnore?.(); setDismissed(true); }}
            >
              Different Patient
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
