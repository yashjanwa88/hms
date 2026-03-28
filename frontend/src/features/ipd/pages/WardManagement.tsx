import React, { useState, useEffect } from 'react';
import { ipdService, Ward } from '../services/ipdService';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function WardManagement() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    try {
      const data = await ipdService.getWards();
      setWards(data);
    } catch (error) {
      console.error('Failed to load wards', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ward Management</h1>
          <p className="text-muted-foreground">Manage hospital wards and beds</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Ward
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <p>Loading wards...</p>
        ) : wards.length === 0 ? (
          <p className="col-span-3 text-center text-gray-500 py-10">No wards configured</p>
        ) : (
          wards.map(ward => (
            <div key={ward.id} className="p-4 bg-white border rounded-lg shadow-sm">
              <h3 className="font-semibold text-lg">{ward.name}</h3>
              <p className="text-sm text-gray-500 mb-2">Type: {ward.type} | Floor: {ward.floorNumber}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm font-medium">${ward.basePricePerDay}/day</span>
                <Button variant="outline" size="sm">Manage Beds</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
