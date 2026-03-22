import { PatientInfoModel } from '../types';
import { User, Phone, Mail, MapPin, Calendar, Activity, Heart, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

interface PatientInfoCardProps {
  patient: PatientInfoModel;
  showDetails?: boolean;
}

export function PatientInfoCard({ patient, showDetails = true }: PatientInfoCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'Deceased': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
              {patient.photoUrl ? (
                <img src={patient.photoUrl} alt={patient.fullName} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <User className="h-16 w-16" />
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{patient.fullName}</h2>
                <p className="text-gray-600 font-mono text-lg">UHID: {patient.uhid}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(patient.status)}`}>
                {patient.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Age/Gender</p>
                <p className="font-semibold">{patient.age} / {patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Blood Group</p>
                <p className="font-semibold">{patient.bloodGroup || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Patient Type</p>
                <p className="font-semibold">{patient.patientType || 'General'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-semibold">{new Date(patient.registrationDate).toLocaleDateString()}</p>
              </div>
            </div>

            {showDetails && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {patient.mobileNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{patient.mobileNumber}</span>
                    </div>
                  )}
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{patient.city}, {patient.state}</span>
                    </div>
                  )}
                  {patient.lastVisitDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Last Visit: {new Date(patient.lastVisitDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                {/* Medical Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Visits</p>
                      <p className="font-bold text-lg">{patient.totalVisits || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Allergies</p>
                      <p className="font-semibold text-sm">{patient.allergies || 'None'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Insurance</p>
                      <p className="font-semibold text-sm">{patient.insuranceStatus || 'No'}</p>
                    </div>
                  </div>
                </div>

                {patient.chronicConditions && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <p className="text-sm font-semibold text-yellow-800">Chronic Conditions:</p>
                    <p className="text-sm text-yellow-700">{patient.chronicConditions}</p>
                  </div>
                )}

                {patient.outstandingAmount && patient.outstandingAmount > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded">
                    <p className="text-sm font-semibold text-red-800">Outstanding Amount:</p>
                    <p className="text-lg font-bold text-red-700">₹{patient.outstandingAmount.toFixed(2)}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
