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

  const { data: clinicalNotes, refetch: refetchNotes } = useQuery({
    queryKey: ['clinical-notes', id],
    queryFn: () => emrService.getClinicalNotes(id!),
  });

  const [vitalForm, setVitalForm] = useState({
    temperature: '',
    pulseRate: '',
    bloodPressure: '',
    height: '',
    weight: '',
    oxygenSaturation: '',
  });

  const [soapForm, setSoapForm] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
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

  const handleAddSOAPNote = async () => {
    try {
      await emrService.addClinicalNote(id!, {
        noteType: 'SOAP',
        subjective: soapForm.subjective,
        objective: soapForm.objective,
        assessment: soapForm.assessment,
        plan: soapForm.plan,
      });
      toast.success('Clinical note added successfully');
      refetchNotes();
      setSoapForm({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
      });
    } catch (error) {
      toast.error('Failed to add clinical note');
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

      {activeTab === 'notes' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add SOAP Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Subjective (Patient Complaints)</Label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="What the patient tells you about symptoms, complaints, history..."
                  value={soapForm.subjective}
                  onChange={(e) => setSoapForm({ ...soapForm, subjective: e.target.value })}
                />
              </div>

              <div>
                <Label>Objective (Findings)</Label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="Vital signs, physical examination findings, test results..."
                  value={soapForm.objective}
                  onChange={(e) => setSoapForm({ ...soapForm, objective: e.target.value })}
                />
              </div>

              <div>
                <Label>Assessment (Diagnosis)</Label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="Clinical impression, diagnosis, ICD codes..."
                  value={soapForm.assessment}
                  onChange={(e) => setSoapForm({ ...soapForm, assessment: e.target.value })}
                />
              </div>

              <div>
                <Label>Plan (Treatment)</Label>
                <textarea
                  className="w-full min-h-[80px] p-2 border rounded-md"
                  placeholder="Treatment plan, medications, follow-up, patient education..."
                  value={soapForm.plan}
                  onChange={(e) => setSoapForm({ ...soapForm, plan: e.target.value })}
                />
              </div>

              <Button onClick={handleAddSOAPNote} className="w-full">
                Add SOAP Note
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clinical Notes History</CardTitle>
            </CardHeader>
            <CardContent>
              {clinicalNotes?.data?.length ? (
                <div className="space-y-4">
                  {clinicalNotes.data.map((note: any) => (
                    <div key={note.id} className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm bg-primary/10 text-primary px-2 py-1 rounded">
                          {note.noteType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      {note.subjective && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">SUBJECTIVE</p>
                          <p className="text-sm mt-1">{note.subjective}</p>
                        </div>
                      )}
                      
                      {note.objective && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">OBJECTIVE</p>
                          <p className="text-sm mt-1">{note.objective}</p>
                        </div>
                      )}
                      
                      {note.assessment && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">ASSESSMENT</p>
                          <p className="text-sm mt-1">{note.assessment}</p>
                        </div>
                      )}
                      
                      {note.plan && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">PLAN</p>
                          <p className="text-sm mt-1">{note.plan}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No clinical notes recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
