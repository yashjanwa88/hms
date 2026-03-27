import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { pharmacyService } from '../services/pharmacyService';
import { AlertTriangle, Package, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function InventoryManagementPage() {
  const navigate = useNavigate();

  const { data: drugsData, isLoading: drugsLoading } = useQuery({
    queryKey: ['drugs'],
    queryFn: () => pharmacyService.getDrugs(),
  });

  const { data: lowStockData, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => pharmacyService.getLowStockReport(),
  });

  const drugs = drugsData?.data || [];
  const lowStockItems = lowStockData?.data?.items || [];

  const criticalStock = lowStockItems.filter((item: any) => item.status === 'Critical');
  const warningStock = lowStockItems.filter((item: any) => item.status === 'Low');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Button onClick={() => navigate('/pharmacy/drugs')}>Manage Drugs</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Drugs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{drugs.length}</p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Critical Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{criticalStock.length}</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Low Stock Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{warningStock.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Alerts */}
      {criticalStock.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Stock - Immediate Action Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Code</th>
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-right p-2">Available</th>
                  <th className="text-right p-2">Reorder Level</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {criticalStock.map((item: any) => (
                  <tr key={item.drugId} className="border-b hover:bg-red-50">
                    <td className="p-2 font-mono text-sm">{item.drugCode}</td>
                    <td className="p-2 font-medium">{item.drugName}</td>
                    <td className="p-2 text-right font-bold text-red-600">{item.availableStock}</td>
                    <td className="p-2 text-right">{item.reorderLevel}</td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 font-bold">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Warnings */}
      {warningStock.length > 0 && (
        <Card className="border-yellow-300">
          <CardHeader>
            <CardTitle className="text-yellow-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Code</th>
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-right p-2">Available</th>
                  <th className="text-right p-2">Reorder Level</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {warningStock.map((item: any) => (
                  <tr key={item.drugId} className="border-b hover:bg-yellow-50">
                    <td className="p-2 font-mono text-sm">{item.drugCode}</td>
                    <td className="p-2 font-medium">{item.drugName}</td>
                    <td className="p-2 text-right font-bold text-yellow-600">{item.availableStock}</td>
                    <td className="p-2 text-right">{item.reorderLevel}</td>
                    <td className="p-2 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* All Drugs Inventory */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {drugsLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Drug Code</th>
                  <th className="text-left p-2">Drug Name</th>
                  <th className="text-left p-2">Category</th>
                  <th className="text-right p-2">Available Stock</th>
                  <th className="text-right p-2">Reorder Level</th>
                  <th className="text-center p-2">Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {drugs.map((drug: any) => {
                  const stockPercent = (drug.availableStock / drug.reorderLevel) * 100;
                  const stockStatus = stockPercent < 50 ? 'Critical' : stockPercent < 100 ? 'Low' : 'Good';
                  const statusColor = stockStatus === 'Critical' ? 'bg-red-100 text-red-800' : 
                                     stockStatus === 'Low' ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-green-100 text-green-800';
                  
                  return (
                    <tr key={drug.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{drug.drugCode}</td>
                      <td className="p-2 font-medium">{drug.drugName}</td>
                      <td className="p-2 text-sm">{drug.category}</td>
                      <td className="p-2 text-right font-semibold">{drug.availableStock}</td>
                      <td className="p-2 text-right">{drug.reorderLevel}</td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${statusColor}`}>
                          {stockStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
