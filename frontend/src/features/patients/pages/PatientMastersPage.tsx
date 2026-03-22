import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PatientPrefixMaster } from '../masters/PatientPrefixMaster';
import { PatientTypesMaster } from '../masters/PatientTypesMaster';
import { RegistrationTypesMaster } from '../masters/RegistrationTypesMaster';

export function PatientMastersPage() {
  const [activeTab, setActiveTab] = useState('prefix');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Patient Masters</h1>
        <p className="text-gray-600 mt-1">Manage patient master data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="prefix">Patient Prefix</TabsTrigger>
          <TabsTrigger value="types">Patient Types</TabsTrigger>
          <TabsTrigger value="registration">Registration Types</TabsTrigger>
        </TabsList>

        <TabsContent value="prefix">
          <PatientPrefixMaster />
        </TabsContent>

        <TabsContent value="types">
          <PatientTypesMaster />
        </TabsContent>

        <TabsContent value="registration">
          <RegistrationTypesMaster />
        </TabsContent>
      </Tabs>
    </div>
  );
}
