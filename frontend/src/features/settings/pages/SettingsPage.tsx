import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Building2, Users, Stethoscope, Clock, Bell, 
  Database, Save, Upload, Plus, Trash2, Edit
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for demonstration
const initialHospitalProfile = {
  name: 'City Hospital',
  address: '123 Medical Street, Healthcare City',
  phone: '+91 9876543210',
  email: 'info@cityhospital.com',
  website: 'www.cityhospital.com',
  logo: null as string | null,
};

const initialDepartments = [
  { id: 1, name: 'Cardiology', head: 'Dr. Smith', status: 'Active' },
  { id: 2, name: 'Neurology', head: 'Dr. Johnson', status: 'Active' },
  { id: 3, name: 'Orthopedics', head: 'Dr. Williams', status: 'Active' },
  { id: 4, name: 'Pediatrics', head: 'Dr. Brown', status: 'Active' },
];

const initialSlotConfig = {
  duration: 15,
  morningStart: '09:00',
  morningEnd: '13:00',
  eveningStart: '16:00',
  eveningEnd: '20:00',
  maxBookingsPerSlot: 1,
};

const initialEmailTemplate = {
  appointmentConfirmation: 'Your appointment has been confirmed for {date} at {time} with Dr. {doctor}.',
  appointmentReminder: 'Reminder: You have an appointment tomorrow at {time} with Dr. {doctor}.',
  reportReady: 'Your lab report is ready. Please visit the hospital to collect it.',
  billGenerated: 'Your bill of ₹{amount} has been generated. Please pay before {date}.',
};

export default function SettingsPage() {
  const [hospitalProfile, setHospitalProfile] = useState(initialHospitalProfile);
  const [departments, setDepartments] = useState(initialDepartments);
  const [slotConfig, setSlotConfig] = useState(initialSlotConfig);
  const [emailTemplate, setEmailTemplate] = useState(initialEmailTemplate);
  const [activeTab, setActiveTab] = useState('hospital');

  const handleSaveHospitalProfile = () => {
    toast.success('Hospital profile updated successfully!');
  };

  const handleSaveDepartments = () => {
    toast.success('Departments updated successfully!');
  };

  const handleSaveSlotConfig = () => {
    toast.success('Appointment slot configuration saved!');
  };

  const handleSaveEmailTemplate = () => {
    toast.success('Email templates updated successfully!');
  };

  const handleBackup = () => {
    toast.success('Backup initiated. You will receive an email when complete.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage hospital configuration, departments, and preferences.</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-auto">
          <TabsTrigger value="hospital" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Hospital
          </TabsTrigger>
          <TabsTrigger value="departments" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Users className="h-3.5 w-3.5" /> Departments
          </TabsTrigger>
          <TabsTrigger value="slots" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Time Slots
          </TabsTrigger>
          <TabsTrigger value="templates" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Templates
          </TabsTrigger>
          <TabsTrigger value="users" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="backup" className="h-8 rounded-md text-xs font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm gap-1.5">
            <Database className="h-3.5 w-3.5" /> Backup
          </TabsTrigger>
        </TabsList>

        {/* Hospital Profile Tab */}
        <TabsContent value="hospital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Hospital Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <Input
                    id="hospitalName"
                    value={hospitalProfile.name}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, name: e.target.value})}
                    placeholder="Enter hospital name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalPhone">Phone Number</Label>
                  <Input
                    id="hospitalPhone"
                    value={hospitalProfile.phone}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="hospitalAddress">Address</Label>
                  <Input
                    id="hospitalAddress"
                    value={hospitalProfile.address}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, address: e.target.value})}
                    placeholder="Enter hospital address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalEmail">Email</Label>
                  <Input
                    id="hospitalEmail"
                    type="email"
                    value={hospitalProfile.email}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalWebsite">Website</Label>
                  <Input
                    id="hospitalWebsite"
                    value={hospitalProfile.website}
                    onChange={(e) => setHospitalProfile({...hospitalProfile, website: e.target.value})}
                    placeholder="Enter website URL"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Hospital Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <Building2 className="h-8 w-8 text-slate-400" />
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Upload className="h-4 w-4" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveHospitalProfile} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Hospital Departments
              </CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {dept.name}
                        </div>
                        <div className="text-sm text-slate-500">
                          Head: {dept.head}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="success">{dept.status}</Badge>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveDepartments} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Slots Tab */}
        <TabsContent value="slots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Appointment Slot Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Slot Duration (minutes)</Label>
                  <select
                    value={slotConfig.duration}
                    onChange={(e) => setSlotConfig({...slotConfig, duration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Max Bookings Per Slot</Label>
                  <Input
                    type="number"
                    value={slotConfig.maxBookingsPerSlot}
                    onChange={(e) => setSlotConfig({...slotConfig, maxBookingsPerSlot: parseInt(e.target.value)})}
                    min={1}
                    max={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Morning Session Start</Label>
                  <Input
                    type="time"
                    value={slotConfig.morningStart}
                    onChange={(e) => setSlotConfig({...slotConfig, morningStart: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Morning Session End</Label>
                  <Input
                    type="time"
                    value={slotConfig.morningEnd}
                    onChange={(e) => setSlotConfig({...slotConfig, morningEnd: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evening Session Start</Label>
                  <Input
                    type="time"
                    value={slotConfig.eveningStart}
                    onChange={(e) => setSlotConfig({...slotConfig, eveningStart: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Evening Session End</Label>
                  <Input
                    type="time"
                    value={slotConfig.eveningEnd}
                    onChange={(e) => setSlotConfig({...slotConfig, eveningEnd: e.target.value})}
                  />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Changes to slot configuration will affect all future appointments. 
                  Existing appointments will not be modified.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSlotConfig} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Email & SMS Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Appointment Confirmation</Label>
                  <textarea
                    value={emailTemplate.appointmentConfirmation}
                    onChange={(e) => setEmailTemplate({...emailTemplate, appointmentConfirmation: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 min-h-[80px] text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Available variables: {'{date}'}, {'{time}'}, {'{doctor}'}, {'{patient}'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Appointment Reminder</Label>
                  <textarea
                    value={emailTemplate.appointmentReminder}
                    onChange={(e) => setEmailTemplate({...emailTemplate, appointmentReminder: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 min-h-[80px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Report Ready Notification</Label>
                  <textarea
                    value={emailTemplate.reportReady}
                    onChange={(e) => setEmailTemplate({...emailTemplate, reportReady: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 min-h-[80px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bill Generated</Label>
                  <textarea
                    value={emailTemplate.billGenerated}
                    onChange={(e) => setEmailTemplate({...emailTemplate, billGenerated: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 min-h-[80px] text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Available variables: {'{amount}'}, {'{date}'}, {'{patient}'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveEmailTemplate} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 dark:text-slate-400">
                User management is handled in the <a href="/users" className="text-primary hover:underline font-medium">Users</a> section.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/users'}>
                Go to Users Management
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Create Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Create a complete backup of your hospital data including patients, appointments, 
                  medical records, and financial data.
                </p>
                <Button onClick={handleBackup} className="gap-2">
                  <Database className="h-4 w-4" />
                  Create Backup Now
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Restore Backup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Restore your hospital data from a previous backup file. 
                  This will overwrite all current data.
                </p>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Select Backup File
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}