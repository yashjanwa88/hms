import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Plus, Search, FileText, TrendingUp, CheckCircle, Download, Eye, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { billingService } from '../services/billingService';
import { CreateInvoiceForm } from '../components/CreateInvoiceFormEnhanced';

export function BillingPageEnhanced() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    invoiceNumber: '',
    patientName: '',
    status: '',
    fromDate: '',
    toDate: '',
    pageNumber: 1,
    pageSize: 10,
  });

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', searchFilters],
    queryFn: () => billingService.searchInvoices(searchFilters),
  });

  const invoices = invoicesData?.data?.items || [];
  const totalCount = invoicesData?.data?.totalCount || 0;

  // Fetch summary statistics
  const { data: summaryData } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5005/api/billing/summary', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
          'X-User-Id': localStorage.getItem('userId') || '',
        },
      });
      const data = await response.json();
      return data.data;
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: billingService.createInvoice,
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
      setShowCreateInvoice(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'Unpaid':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Billing & Invoicing</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/billing/ar-aging')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            AR Aging Report
          </Button>
          <Button variant="outline" onClick={() => navigate('/billing/refunds/approval')}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Refund Approvals
          </Button>
          <Button onClick={() => setShowCreateInvoice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summaryData?.totalRevenue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summaryData?.outstandingAmount || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Pending payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(summaryData?.paidToday || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{summaryData?.invoicesToday || 0} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-purple-600">{summaryData?.totalInvoices || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                placeholder="INV-XXXX"
                value={searchFilters.invoiceNumber}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, invoiceNumber: e.target.value, pageNumber: 1 })
                }
              />
            </div>
            <div>
              <Label>Patient Name</Label>
              <Input
                placeholder="Search patient"
                value={searchFilters.patientName}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, patientName: e.target.value, pageNumber: 1 })
                }
              />
            </div>
            <div>
              <Label>Status</Label>
              <select
                className="w-full border rounded px-3 py-2"
                value={searchFilters.status}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, status: e.target.value, pageNumber: 1 })
                }
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={searchFilters.fromDate}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, fromDate: e.target.value, pageNumber: 1 })
                }
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={searchFilters.toDate}
                onChange={(e) =>
                  setSearchFilters({ ...searchFilters, toDate: e.target.value, pageNumber: 1 })
                }
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() =>
                setSearchFilters({
                  invoiceNumber: '',
                  patientName: '',
                  status: '',
                  fromDate: '',
                  toDate: '',
                  pageNumber: 1,
                  pageSize: 10,
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices ({totalCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading invoices...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Invoice #</th>
                      <th className="text-left p-3 text-sm font-medium">Date</th>
                      <th className="text-left p-3 text-sm font-medium">Patient</th>
                      <th className="text-right p-3 text-sm font-medium">Amount</th>
                      <th className="text-right p-3 text-sm font-medium">Paid</th>
                      <th className="text-right p-3 text-sm font-medium">Balance</th>
                      <th className="text-center p-3 text-sm font-medium">Status</th>
                      <th className="text-center p-3 text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => (
                      <tr key={invoice.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <button
                            onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {invoice.invoiceNumber}
                          </button>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(invoice.invoiceDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm">{invoice.patientName || 'N/A'}</td>
                        <td className="p-3 text-right font-semibold">
                          {formatCurrency(invoice.grandTotal)}
                        </td>
                        <td className="p-3 text-right text-green-600">
                          {formatCurrency(invoice.paidAmount)}
                        </td>
                        <td className="p-3 text-right text-red-600">
                          {formatCurrency(invoice.grandTotal - invoice.paidAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              invoice.status
                            )}`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(`/billing/invoices/${invoice.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalCount > searchFilters.pageSize && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {(searchFilters.pageNumber - 1) * searchFilters.pageSize + 1} to{' '}
                    {Math.min(searchFilters.pageNumber * searchFilters.pageSize, totalCount)} of{' '}
                    {totalCount} invoices
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      disabled={searchFilters.pageNumber === 1}
                      onClick={() =>
                        setSearchFilters({
                          ...searchFilters,
                          pageNumber: searchFilters.pageNumber - 1,
                        })
                      }
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={searchFilters.pageNumber * searchFilters.pageSize >= totalCount}
                      onClick={() =>
                        setSearchFilters({
                          ...searchFilters,
                          pageNumber: searchFilters.pageNumber + 1,
                        })
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceForm
          onClose={() => setShowCreateInvoice(false)}
          onSubmit={(data: any) => createInvoiceMutation.mutate(data)}
        />
      )}
    </div>
  );
}
