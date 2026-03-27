import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { pharmacyService } from '../services/pharmacyService';
import { Package, AlertTriangle, TrendingUp, Pill } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PharmacyDashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: drugsData } = useQuery({
    queryKey: ['drugs'],
    queryFn: () => pharmacyService.getDrugs(),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => pharmacyService.getLowStockReport(),
  });

  const { data: salesData } = useQuery({
    queryKey: ['daily-sales', selectedDate],
    queryFn: () => pharmacyService.getDailySalesReport(selectedDate),
  });

  const drugs = drugsData?.data || [];
  const lowStockItems = lowStockData?.data?.items || [];
  const sales = salesData?.data || {};

  const totalDrugs = drugs.length;
  const activeDrugs = drugs.filter((d: any) => d.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/pharmacy/drugs')}>Manage Drugs</Button>
          <Button onClick={() => navigate('/pharmacy/prescriptions')} variant="outline">Prescriptions</Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Total Drugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDrugs}</p>
            <p className="text-xs text-gray-500 mt-1">{activeDrugs} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
            <Button 
              size="sm" 
              variant="link" 
              className="p-0 h-auto text-xs mt-1"
              onClick={() => navigate('/pharmacy/inventory')}
            >
              View Details
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Today's Prescriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sales.totalPrescriptions || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">₹{sales.totalRevenue?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item: any) => (
                <div key={item.drugId} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.drugName}</p>
                    <p className="text-sm text-gray-600">Code: {item.drugCode}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="font-bold text-red-600">{item.availableStock}</span> / {item.reorderLevel}
                    </p>
                    <p className="text-xs text-gray-500">{item.status}</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length > 5 && (
                <Button variant="link" onClick={() => navigate('/pharmacy/inventory')} className="w-full">
                  View all {lowStockItems.length} alerts
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Selling Drugs */}
      {sales.topDrugs && sales.topDrugs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Drugs (Today)</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-right p-2">Quantity Sold</th>
                  <th className="text-right p-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.topDrugs.map((drug: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{drug.drugName}</td>
                    <td className="text-right p-2">{drug.quantitySold}</td>
                    <td className="text-right p-2 font-medium">₹{drug.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
