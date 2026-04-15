import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { 
  FileText, Download, Calendar, Users, DollarSign, 
  TrendingUp, Activity, Pill, TestTube, Bed
} from 'lucide-react';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/DatePicker';

const reportTypes = [
  { id: 'patient-registration', name: 'Patient Registration Report', icon: Users, description: 'New patient registrations over a period' },
  { id: 'appointments', name: 'Appointment Report', icon: Calendar, description: 'Booked, completed, and cancelled appointments' },
  { id: 'revenue', name: 'Revenue Report', icon: DollarSign, description: 'Income breakdown by service and payment mode' },
  { id: 'doctor-performance', name: 'Doctor Performance Report', icon: Activity, description: 'Consultations, revenue, and patient ratings' },
  { id: 'department', name: 'Department-wise Report', icon: FileText, description: 'Patient distribution across departments' },
  { id: 'inventory', name: 'Inventory Report', icon: Pill, description: 'Stock levels, expiry, and consumption' },
  { id: 'lab-tests', name: 'Laboratory Tests Report', icon: TestTube, description: 'Tests conducted and results' },
  { id: 'ipd', name: 'IPD / Ward Report', icon: Bed, description: 'Bed occupancy and patient stays' },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState('');
  const [fromDate, setFromDate] = useState<Date | undefined>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    if (!selectedReport) {
      toast.error('Please select a report type');
      return;
    }
    if (!fromDate || !toDate) {
      toast.error('Please select date range');
      return;
    }

    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      toast.success('Report generated successfully!');
      setIsGenerating(false);
      
      // Simulate download
      const reportData = `Report: ${selectedReport}\nFrom: ${fromDate.toDateString()}\nTo: ${toDate.toDateString()}\n\nThis is a sample report data...`;
      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}_${fromDate.toISOString().split('T')[0]}_${toDate.toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }, 1500);
  };

  const handleExportPDF = () => {
    toast.success('Exporting to PDF...');
  };

  const handleExportExcel = () => {
    toast.success('Exporting to Excel...');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
            Generate comprehensive reports for hospital operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Type Selection */}
            <div className="space-y-2">
              <Label>Report Type</Label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700"
              >
                <option value="">Select a report...</option>
                {reportTypes.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">From</Label>
                  <DatePicker
                    value={fromDate || undefined}
                    onChange={(date) => setFromDate(date || undefined)}
                    placeholder="Start date"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">To</Label>
                  <DatePicker
                    value={toDate || undefined}
                    onChange={(date) => setToDate(date || undefined)}
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setDate(date.getDate() - 7);
                    setFromDate(date);
                    setToDate(new Date());
                  }}
                  className="text-xs"
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - 1);
                    setFromDate(date);
                    setToDate(new Date());
                  }}
                  className="text-xs"
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const date = new Date();
                    date.setMonth(0, 1);
                    setFromDate(date);
                    setToDate(new Date());
                  }}
                  className="text-xs"
                >
                  This Year
                </Button>
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerateReport} 
              className="w-full gap-2"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>

            {/* Export Options */}
            {selectedReport && (
              <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Label>Export As</Label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2" 
                    onClick={handleExportPDF}
                  >
                    <Download className="h-4 w-4" />
                    PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2" 
                    onClick={handleExportExcel}
                  >
                    <Download className="h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Preview / Results */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Report Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="p-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {reportTypes.find(r => r.id === selectedReport)?.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {fromDate?.toDateString()} - {toDate?.toDateString()}
                      </p>
                    </div>
                    <Badge variant="success">Generated</Badge>
                  </div>
                  
                  {/* Sample Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">1,234</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase">Completed</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">1,100</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase">Pending</p>
                      <p className="text-2xl font-black text-amber-600 mt-1">120</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-bold text-slate-500 uppercase">Growth</p>
                      <p className="text-2xl font-black text-green-600 mt-1">+15%</p>
                    </div>
                  </div>
                </div>

                {/* Sample Data Table */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-4 py-3 text-sm font-mono text-slate-500">#{String(i).padStart(4, '0')}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">Sample Entry {i}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">2024-01-{10 + i}</td>
                          <td className="px-4 py-3">
                            <Badge variant={i % 3 === 0 ? 'warning' : 'success'} className="text-xs">
                              {i % 3 === 0 ? 'Pending' : 'Completed'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-right text-slate-900 dark:text-white">
                            ₹{(i * 500).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Summary:</strong> This report shows data for the selected period. 
                    Export to PDF or Excel for detailed analysis and sharing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <FileText className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a report type to get started</p>
                <p className="text-sm mt-2">Choose from 8 different report types and configure your date range</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}