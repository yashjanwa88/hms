import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, Calculator, Receipt, ChevronLeft, 
  Search, User, Calendar, CreditCard, Banknote, 
  ShieldCheck, FileText, AlertCircle, CheckCircle,
  Package, Activity, ClipboardList, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { billingService } from '../services/billingService';
import { patientService } from '@/features/patients/services/patientService';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/lib/utils';

interface InvoiceItem {
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
}

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [items, setItems] = useState<InvoiceItem[]>([
    { itemType: 'Consultation', description: 'General Consultation', quantity: 1, unitPrice: 500, taxRate: 18, discountRate: 0 }
  ]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');

  const { data: patients, isPending: searchPending } = useQuery({
    queryKey: ['patients-search', patientSearch],
    queryFn: () => patientService.searchPatients({ searchTerm: patientSearch, pageSize: 5 }),
    enabled: patientSearch.length > 2,
  });

  const createMutation = useMutation({
    mutationFn: billingService.createInvoice,
    onSuccess: (data) => {
      toast.success('Revenue record committed successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/billing/invoices/${data.data.id}`);
    },
    onError: () => toast.error('Failed to commit revenue record'),
  });

  const addItem = () => {
    setItems([...items, { itemType: 'Service', description: '', quantity: 1, unitPrice: 0, taxRate: 18, discountRate: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const lineTotal = item.quantity * item.unitPrice;
      const lineDiscount = (lineTotal * item.discountRate) / 100;
      const taxableAmount = lineTotal - lineDiscount;
      const lineTax = (taxableAmount * item.taxRate) / 100;

      subtotal += lineTotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
    });

    return {
      subtotal,
      totalTax,
      totalDiscount,
      grandTotal: subtotal - totalDiscount + totalTax
    };
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Patient identity required for invoicing');
      return;
    }

    createMutation.mutate({
      patientId: selectedPatient.id,
      encounterId: selectedPatient.id, // In a real scenario, this would be linked to an encounter
      tax: totals.totalTax,
      discount: totals.totalDiscount,
      paymentMode,
      notes,
      items: items.map(item => ({
        ...item,
        amount: (item.quantity * item.unitPrice) - ((item.quantity * item.unitPrice * item.discountRate) / 100) + (((item.quantity * item.unitPrice) - ((item.quantity * item.unitPrice * item.discountRate) / 100)) * item.taxRate / 100)
      })),
    });
  };

  const serviceTemplates = [
    { type: 'Consultation', desc: 'General Consultation', price: 500, tax: 18 },
    { type: 'Diagnostic', desc: 'Blood Test - CBC', price: 300, tax: 5 },
    { type: 'Diagnostic', desc: 'X-Ray Chest', price: 800, tax: 12 },
    { type: 'Pharmacy', desc: 'Medicine Dispensing', price: 0, tax: 12 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
            <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate('/billing')}>Revenue Hub</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-primary">Invoice Generation</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Revenue Provisioning
          </h1>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">
            Itemize clinical services and generate high-fidelity financial records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/billing')}
            className="h-12 px-6 font-bold border-2"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Hub
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Patient Selection Card */}
          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Patient Identity Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {!selectedPatient ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search patient by name, UHID, or mobile..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-slate-100 focus:border-primary text-base"
                    />
                  </div>
                  
                  {searchPending ? (
                    <div className="space-y-2">
                      {[1, 2].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                  ) : patients?.data?.items && patientSearch.length > 2 && (
                    <div className="border border-slate-100 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
                      {patients.data.items.map((patient: any) => (
                        <div
                          key={patient.id}
                          className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-between"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setPatientSearch('');
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary">
                              {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{patient.fullName}</div>
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                UHID: {patient.uhid} | Mobile: {patient.mobileNumber}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-primary/5 border-2 border-primary/10 rounded-2xl p-6 flex items-center justify-between animate-in zoom-in-95">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-primary/10 flex items-center justify-center shadow-sm">
                      <span className="text-2xl font-black text-primary">
                        {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        {selectedPatient.fullName}
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-white/50 border-primary/20">
                          UHID: {selectedPatient.uhid}
                        </Badge>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          Age: {selectedPatient.age} | {selectedPatient.gender}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 font-black uppercase tracking-widest text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                    onClick={() => setSelectedPatient(null)}
                  >
                    Switch Identity
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Items Card */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Service Itemization
              </CardTitle>
              <Button type="button" onClick={addItem} size="sm" className="h-8 gap-1.5 font-black uppercase tracking-widest text-[10px]">
                <Plus className="h-3 w-3" />
                Add Clinical Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => (
                  <div key={index} className="p-6 space-y-4 group relative">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                      <div className="md:col-span-3 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Service Category</Label>
                        <select
                          className="w-full h-11 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                          value={item.itemType}
                          onChange={(e) => updateItem(index, 'itemType', e.target.value)}
                        >
                          <option>Consultation</option>
                          <option>Procedure</option>
                          <option>Diagnostic</option>
                          <option>Pharmacy</option>
                          <option>Service</option>
                        </select>
                      </div>
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="e.g. Specialized Cardiac Consultation"
                          className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-100"
                        />
                      </div>
                      <div className="md:col-span-1 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-100"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                          className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-100 font-black text-primary"
                        />
                      </div>
                      <div className="md:col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tax Rate (%)</Label>
                        <Input
                          type="number"
                          value={item.taxRate}
                          onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                          className="h-8 bg-transparent border-slate-100 text-[10px] font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Discount (%)</Label>
                        <Input
                          type="number"
                          value={item.discountRate}
                          onChange={(e) => updateItem(index, 'discountRate', parseFloat(e.target.value))}
                          className="h-8 bg-transparent border-slate-100 text-[10px] font-bold"
                        />
                      </div>
                      <div className="col-span-2 flex flex-col items-end justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Item Total (incl. tax)</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency((item.quantity * item.unitPrice) * (1 - item.discountRate / 100) * (1 + item.taxRate / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Quick Templates</p>
                <div className="flex flex-wrap gap-3">
                  {serviceTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setItems([...items, { 
                          itemType: tpl.type, 
                          description: tpl.desc, 
                          quantity: 1, 
                          unitPrice: tpl.price, 
                          taxRate: tpl.tax, 
                          discountRate: 0 
                        }]);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/50 hover:shadow-md transition-all group"
                    >
                      <Plus className="h-3 w-3 text-primary group-hover:scale-125 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{tpl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Revenue Summary Card */}
          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/10 p-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Calculator className="h-4 w-4 text-primary" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Subtotal</span>
                  <span className="text-sm font-black text-white/80">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Clinical Discounts</span>
                  <span className="text-sm font-black text-rose-400">-{formatCurrency(totals.totalDiscount)}</span>
                </div>
                <div className="flex justify-between items-center group pb-4 border-b border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Tax Liability (GST)</span>
                  <span className="text-sm font-black text-emerald-400">+{formatCurrency(totals.totalTax)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-black uppercase tracking-widest text-white">Grand Total</span>
                  <span className="text-3xl font-black text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>
              
              <div className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Payment Instrument</Label>
                  <select
                    className="w-full h-11 bg-white/10 border border-white/10 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all text-white"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option className="text-slate-900" value="Cash">Cash Liquidity</option>
                    <option className="text-slate-900" value="Card">Card Terminal</option>
                    <option className="text-slate-900" value="UPI">Digital UPI</option>
                    <option className="text-slate-900" value="NetBanking">Net Banking</option>
                    <option className="text-slate-900" value="Insurance">Insurance Claim</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/50">Administrative Notes</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Add terms or clinical billing remarks..."
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/40 mt-4 gap-2"
                disabled={createMutation.isPending || !selectedPatient}
              >
                {createMutation.isPending ? (
                  <Activity className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {createMutation.isPending ? 'Provisioning...' : 'Provision Revenue Record'}
              </Button>
            </CardContent>
          </Card>

          {/* Revenue Guard Widget */}
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
            <CardHeader className="border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Revenue Guard™
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-[11px] font-medium text-slate-500">Invoice will be linked to the Patient Master Index automatically.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-[11px] font-medium text-slate-500">Tax compliance (GST) is calculated based on clinical service codes.</p>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[11px] font-medium text-slate-500">Once provisioned, this revenue record will be immutable without an audit trail.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}