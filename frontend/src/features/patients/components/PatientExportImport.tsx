import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../services/patientService';

export function PatientExportImport() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [exportFilters, setExportFilters] = useState({
    status: 'All',
    patientType: 'All',
    registrationType: 'All',
    fromDate: '',
    toDate: '',
  });

  const exportMutation = useMutation({
    mutationFn: async (filters: any) => {
      const blob = await patientService.exportPatients(filters);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    },
    onSuccess: () => toast.success('Export downloaded successfully!'),
    onError: () => toast.error('Export failed'),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => patientService.importPatients(file).then(r => r.data),
    onSuccess: (data) => {
      setImportResults(data);
      toast.success(`Import completed! ${data.successCount} records imported successfully`);
    },
    onError: () => toast.error('Import failed'),
  });

  const handleExport = (format: 'csv' | 'excel') => {
    exportMutation.mutate({ ...exportFilters, format });
  };

  const handleImport = () => {
    if (!selectedFile) { toast.error('Please select a file to import'); return; }
    if (confirm(`Import ${selectedFile.name}?\nThis will add/update patient records.`)) {
      importMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    window.open(patientService.downloadImportTemplate(), '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Export / Import</h1>
        <p className="text-gray-600 mt-1">Export patient data or import bulk patients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              <select
                value={exportFilters.status}
                onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Merged">Merged</option>
                <option value="Deceased">Deceased</option>
              </select>
            </div>

            <div>
              <Label>Patient Type</Label>
              <select
                value={exportFilters.patientType}
                onChange={(e) => setExportFilters({ ...exportFilters, patientType: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="All">All Types</option>
                <option value="General">General</option>
                <option value="Senior">Senior Citizen</option>
                <option value="VIP">VIP</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div>
              <Label>Registration Type</Label>
              <select
                value={exportFilters.registrationType}
                onChange={(e) => setExportFilters({ ...exportFilters, registrationType: e.target.value })}
                className="w-full border rounded px-3 py-2"
              >
                <option value="All">All Types</option>
                <option value="General">General</option>
                <option value="Emergency">Emergency</option>
                <option value="Staff">Staff</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>From Date</Label>
                <input
                  type="date"
                  value={exportFilters.fromDate}
                  onChange={(e) => setExportFilters({ ...exportFilters, fromDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <Label>To Date</Label>
                <input
                  type="date"
                  value={exportFilters.toDate}
                  onChange={(e) => setExportFilters({ ...exportFilters, toDate: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <Button
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending}
                className="w-full"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as CSV
              </Button>
              <Button
                onClick={() => handleExport('excel')}
                disabled={exportMutation.isPending}
                variant="outline"
                className="w-full"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Export will include all patient data based on selected filters.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select File (CSV or Excel)</Label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full border rounded px-3 py-2"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="w-full"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <Button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importMutation.isPending ? 'Importing...' : 'Import Patients'}
            </Button>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong>
              </p>
              <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside space-y-1">
                <li>Download template first</li>
                <li>Fill data in correct format</li>
                <li>UHID must be unique</li>
                <li>Mobile number: 10 digits</li>
                <li>Date format: YYYY-MM-DD</li>
                <li>Required fields: Name, Gender, Mobile</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Results */}
      {importResults && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <CardTitle>Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Total Records</p>
                <p className="text-3xl font-bold">{importResults.totalRecords}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-600">Success</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{importResults.successCount}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-600">Failed</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{importResults.failedCount}</p>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Errors ({importResults.errors.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {importResults.errors.map((error: any, index: number) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-sm text-red-800">
                        <strong>Row {error.row}:</strong> {error.error}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => setImportResults(null)}
              variant="outline"
              className="w-full mt-4"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                Export
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Select filters to export specific patients</li>
                <li>• Choose CSV for simple data</li>
                <li>• Choose Excel for formatted data</li>
                <li>• Export includes all patient details</li>
                <li>• Use for backup or reporting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="h-4 w-4 text-green-600" />
                Import
              </h4>
              <ul className="text-sm space-y-1 text-gray-700">
                <li>• Download template first</li>
                <li>• Fill data in correct format</li>
                <li>• Validate data before import</li>
                <li>• Duplicate UHIDs will be skipped</li>
                <li>• Check import results for errors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
