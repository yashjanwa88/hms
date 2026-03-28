import React, { useState, useEffect } from 'react';
import { ipdService, Admission } from '../services/ipdService';
import { Plus, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export default function IPDDashboard() {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      const data = await ipdService.getActiveAdmissions();
      setAdmissions(data);
    } catch (error) {
      console.error('Failed to load admissions', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IPD Admissions</h1>
          <p className="text-muted-foreground">Manage currently admitted patients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/ipd/wards')}>Manage Wards</Button>
          <Button onClick={() => console.log('Admit')}>
            <Plus className="mr-2 h-4 w-4" />
            Admit Patient
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border">
        {loading ? (
          <p>Loading admissions...</p>
        ) : admissions.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <User className="mx-auto h-10 w-10 text-gray-300 mb-2" />
            <p>No active admissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3 text-left">Adm No.</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Reason</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map(adm => (
                  <tr key={adm.id} className="border-b">
                    <td className="p-3 font-medium">{adm.admissionNumber}</td>
                    <td className="p-3">{new Date(adm.admissionDate).toLocaleDateString()}</td>
                    <td className="p-3">{adm.reasonForAdmission}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                        {adm.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button variant="outline" size="sm">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
