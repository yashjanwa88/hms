import { useRef } from 'react';
import { PatientRegistrationModel } from '../types';
import { Button } from '@/components/ui/Button';
import { Printer, Download } from 'lucide-react';
import QRCode from 'qrcode';

interface PrintPageProps {
  patient: PatientRegistrationModel;
  onClose?: () => void;
}

export function PrintPage({ patient, onClose }: PrintPageProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // PDF download logic using html2pdf or similar library
    window.print();
  };

  const generateQRCode = async (data: string) => {
    try {
      return await QRCode.toDataURL(data);
    } catch (err) {
      console.error(err);
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold">Patient Registration Card</h1>
        <div className="flex gap-2">
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Print Content */}
      <div ref={printRef} className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Registration Card */}
        <div className="p-8 border-4 border-blue-600">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-blue-600 pb-4">
            <h1 className="text-3xl font-bold text-blue-600">DIGITAL HOSPITAL</h1>
            <p className="text-sm text-gray-600">Patient Registration Card</p>
          </div>

          {/* Patient Info Grid */}
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Photo & QR */}
            <div className="space-y-4">
              <div className="border-2 border-gray-300 p-2">
                {patient.patientPhotographDetail?.imagePath ? (
                  <img
                    src={patient.patientPhotographDetail.imagePath as string}
                    alt="Patient"
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400">No Photo</span>
                  </div>
                )}
              </div>
              <div className="border-2 border-gray-300 p-2">
                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">QR Code</span>
                </div>
              </div>
            </div>

            {/* Middle & Right Columns - Details */}
            <div className="col-span-2 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">UHID</p>
                  <p className="font-bold text-lg font-mono">{patient.patregi.code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Registration Date</p>
                  <p className="font-semibold">{new Date(patient.patregi.registrationDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Patient Name</p>
                <p className="font-bold text-xl">
                  {patient.patregi.patientPrefixName} {patient.patregi.firstName} {patient.patregi.middleName} {patient.patregi.lastName}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Gender</p>
                  <p className="font-semibold">{patient.patregi.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Age</p>
                  <p className="font-semibold">{patient.patregi.age || `${patient.patregi.ageYear}Y`}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Blood Group</p>
                  <p className="font-semibold">{patient.patregi.bloodGroup || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Mobile</p>
                  <p className="font-semibold">{patient.patientContactDetail?.mobileNo || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="font-semibold text-sm">{patient.patientContactDetail?.emailId || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase">Address</p>
                <p className="font-semibold text-sm">
                  {patient.patientContactDetail?.houseNumber} {patient.patientContactDetail?.street}, 
                  {patient.patientContactDetail?.city}, {patient.patientContactDetail?.state} - {patient.patientContactDetail?.pincode}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Patient Type</p>
                  <p className="font-semibold">{patient.patregi.patientTypeName || 'General'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Valid Till</p>
                  <p className="font-semibold">
                    {patient.patregi.validTill ? new Date(patient.patregi.validTill).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          {patient.patientEmergencyContactDetails && (
            <div className="mt-6 pt-4 border-t-2 border-gray-300">
              <h3 className="font-bold text-sm mb-2 text-red-600">EMERGENCY CONTACT</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-semibold">{patient.patientEmergencyContactDetails.contactPersonFullName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Relationship</p>
                  <p className="font-semibold">{patient.patientEmergencyContactDetails.relationship}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Mobile</p>
                  <p className="font-semibold">{patient.patientEmergencyContactDetails.mobileNo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-2 border-gray-300 text-center">
            <p className="text-xs text-gray-600">
              This is a computer-generated document. Please carry this card during hospital visits.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              For queries: +91-XXXXXXXXXX | Email: info@digitalhospital.com
            </p>
          </div>
        </div>

        {/* Barcode Section */}
        <div className="p-4 bg-gray-50 text-center border-t-2 border-dashed">
          <div className="inline-block">
            <svg className="barcode" />
            <p className="text-xs font-mono mt-1">{patient.patregi.code}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          ${printRef.current ? `
            #${printRef.current.id}, #${printRef.current.id} * {
              visibility: visible;
            }
            #${printRef.current.id} {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          ` : ''}
        }
      `}</style>
    </div>
  );
}
