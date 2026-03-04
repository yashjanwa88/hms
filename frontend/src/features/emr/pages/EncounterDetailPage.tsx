import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { emrService } from '../services/emrService';
import { toast } from 'sonner';
import { calculateBMI } from '@/lib/utils';

export function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('vitals');

  const { data: encounter } = useQuery({
    queryKey: ['encounter', id],
    queryFn: () => emrService.getEncounter(id!),
  });

  const { data: vitals, refetch: refetchVitals } = useQuery({
    queryKey: ['vitals', id],
    queryFn: () => emrService.getVitals(id!),
  });

  const [vitalForm, setVitalForm] = useState({
    temperature: '',
    pulseRate: '',
    bloodPressure: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
  });

  const handleAddVital = async () => {
    try {
      const bmi = vitalForm.height && vitalForm.weight 
        ? calculateBMI(parseFloat(vitalForm.height), parseFloat(vitalForm.weight))
        : undefined;

      await emrService.addVital(id!, {
        ...vitalForm,
        temperature: vitalForm.temperature ? parseFloat(vitalForm.temperature) : undefined,
        pulseRate: vitalForm.pulseRate ? parseInt(vitalForm.pulseRate) : undefined,
        height: vitalForm.height ? parseFloat(vitalForm.height) : undefined,
        weight: vitalForm.weight ? parseFloat(vitalForm.weight) : undefined,
        oxygenSaturation: vitalForm.oxygenSaturation ? parseInt(vitalForm.oxygenSaturation) : undefined,
        recordedAt: new Date().toISOString(),
      });
      toast.success('Vital added successfully');
      refetchVitals();
      setVitalForm({
        temperature: '',
        pulseRate: '',
        bloodPressure: '',
        height: '',
        weight: '',
        oxygenSaturation: '',
      });
    } catch (error) {
      toast.error('Failed to add vital');
    }
  };

  const calculatedBMI = vitalForm.height && vitalForm.weight
    ? calculateBMI(parseFloat(vitalForm.height), parseFloat(vitalForm.weight))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Encounter: {encounter?.data?.encounterNumber}
        </h1>
        <Button variant="destructive">Close Encounter</Button>
      </div>

      <div className="flex gap-2 border-b">
        {['vitals', 'diagnosis', 'notes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize ${
              activeTab === tab
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'vitals' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Vitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperature (°F)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalForm.temperature}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, temperature: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pulse Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={vitalForm.pulseRate}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, pulseRate: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Blood Pressure</Label>
                  <Input
                    placeholder="120/80"
                    value={vitalForm.bloodPressure}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, bloodPressure: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SpO2 (%)</Label>
                  <Input
                    type="number"
                    value={vitalForm.oxygenSaturation}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, oxygenSaturation: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalForm.height}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, height: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitalForm.weight}
                    onChange={(e) =>
                      setVitalForm({ ...vitalForm, weight: e.target.value })
                    }
                  />
                </div>
              </div>
              {calculatedBMI && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm font-medium">
                    Calculated BMI: <span className="text-lg">{calculatedBMI}</span>
                  </p>
                </div>
              )}
              <Button onClick={handleAddVital}>Add Vital</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vital History</CardTitle>
            </CardHeader>
            <CardContent>
              {vitals?.data?.length ? (
                <div className="space-y-2">
                  {vitals.data.map((vital: any) => (
                    <div key={vital.id} className="rounded-md border p-3 text-sm">
                      <p>Temp: {vital.temperature}°F | BP: {vital.bloodPressure}</p>
                      <p>Pulse: {vital.pulseRate} | SpO2: {vital.oxygenSaturation}%</p>
                      <p>BMI: {vital.bmi}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No vitals recorded</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
