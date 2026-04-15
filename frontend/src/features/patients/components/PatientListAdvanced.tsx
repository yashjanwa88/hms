import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Search, Filter, Download, RefreshCw, Eye, Edit,
  Trash2, FileText, Phone, Mail, MapPin, Calendar,
  User, Activity, ChevronLeft, ChevronRight, X, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { PatientSearchModel, PatientInfoModel } from '../types';
import { patientService } from '../services/patientService';
import { cn } from '@/lib/utils';

const EMPTY_FILTERS: PatientSearchModel = {
  searchText: '', uhid: '', firstName: '', lastName: '',
  mobileNumber: '', email: '', dateOfBirth: '', gender: '',
  patientTypeId: '', registrationTypeId: '', status: '',
  fromDate: '', toDate: '', ageFrom: undefined, ageTo: undefined,
  bloodGroup: '', city: '', state: '', pincode: '',
  insuranceCompany: '', policyNumber: '',
  pageNumber: 1, pageSize: 20, sortBy: 'registrationDate', sortOrder: 'desc',
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active:   'status-active',
    Inactive: 'status-inactive',
    Merged:   'status-pill bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Deceased: 'status-pill bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return <span className={map[status] ?? 'status-inactive'}>{status}</span>;
}

function TableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function PatientListAdvanced() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [rawSearch, setRawSearch] = useState('');
  const [filters, setFilters] = useState<PatientSearchModel>(EMPTY_FILTERS);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, searchText: rawSearch, pageNumber: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [rawSearch]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['patients-list', filters],
    queryFn: () => patientService.searchPatients(filters),
  });

  const patients: PatientInfoModel[] = data?.data?.items ?? [];
  const totalCount: number = data?.data?.totalCount ?? 0;
  const totalPages: number = data?.data?.totalPages ?? 0;

  const deleteMutation = useMutation({
    mutationFn: patientService.deletePatient,
    onSuccess: () => { toast.success('Patient removed'); queryClient.invalidateQueries({ queryKey: ['patients-list'] }); },
    onError: () => toast.error('Failed to remove patient'),
  });

  const setPage = (p: number) => setFilters(f => ({ ...f, pageNumber: p }));
  const setFilter = (patch: Partial<PatientSearchModel>) =>
    setFilters(f => ({ ...f, ...patch, pageNumber: 1 }));

  const allSelected = patients.length > 0 && selected.length === patients.length;
  const toggleAll = (v: boolean) => setSelected(v ? patients.map(p => p.id) : []);
  const toggleOne = (id: string, v: boolean) =>
    setSelected(s => v ? [...s, id] : s.filter(x => x !== id));

  const handleDelete = (id: string) => {
    if (confirm('Remove this patient record?')) deleteMutation.mutate(id);
  };

  const from = (filters.pageNumber - 1) * filters.pageSize + 1;
  const to   = Math.min(filters.pageNumber * filters.pageSize, totalCount);

  // Page numbers to show
  const pageNums = (() => {
    const pages: number[] = [];
    const start = Math.max(1, filters.pageNumber - 2);
    const end   = Math.min(totalPages, start + 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  })();

  return (
    <div className="space-y-4">

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            value={rawSearch}
            onChange={e => setRawSearch(e.target.value)}
            placeholder="Search by name, UHID, mobile…"
            className="pl-9 h-9 text-sm"
          />
          {rawSearch && (
            <button onClick={() => setRawSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn p-0.5">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className={cn('gap-1.5', showFilters && 'border-primary text-primary')}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            {showFilters && <X className="h-3 w-3" />}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info('Exporting…')}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Gender</Label>
                <select
                  className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={filters.gender}
                  onChange={e => setFilter({ gender: e.target.value })}
                >
                  <option value="">All</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">Status</Label>
                <select
                  className="w-full h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={filters.status}
                  onChange={e => setFilter({ status: e.target.value })}
                >
                  <option value="">All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-500">City</Label>
                <Input
                  placeholder="Filter by city"
                  className="h-8 text-sm"
                  value={filters.city}
                  onChange={e => setFilter({ city: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => { setFilters(EMPTY_FILTERS); setRawSearch(''); }}>
                Clear All
              </Button>
              <Button size="sm" onClick={() => setFilters(f => ({ ...f, pageNumber: 1 }))}>
                Apply
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-semibold text-primary">{selected.length} selected</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSelected([])}>Clear</Button>
            <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Delete ${selected.length} patients?`)) selected.forEach(id => deleteMutation.mutate(id)); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>
        </div>
      )}

      {/* Results info + page size */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          {totalCount > 0 ? `Showing ${from}–${to} of ${totalCount} patients` : 'No results'}
        </span>
        <div className="flex items-center gap-2">
          <span>Per page:</span>
          <select
            className="h-7 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 text-xs focus:outline-none"
            value={filters.pageSize}
            onChange={e => setFilter({ pageSize: Number(e.target.value) })}
          >
            {[10, 20, 50, 100].map(n => <option key={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input type="checkbox" checked={allSelected} onChange={e => toggleAll(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-primary" />
                  </th>
                  <th>UHID</th>
                  <th>Patient</th>
                  <th>Age / Gender</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Registered</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>

              {isLoading ? <TableSkeleton /> : (
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                          <Users className="h-12 w-12 opacity-20" />
                          <p className="text-sm font-medium">No patients found</p>
                          <Button size="sm" onClick={() => navigate('/patients/register')}>
                            Register New Patient
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : patients.map(p => (
                    <tr key={p.id}>
                      <td>
                        <input type="checkbox" checked={selected.includes(p.id)}
                          onChange={e => toggleOne(p.id, e.target.checked)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary" />
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/patients/${p.id}`)}
                          className="font-mono text-xs font-semibold text-primary hover:underline"
                        >
                          {p.uhid}
                        </button>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {(p.firstName ?? p.fullName ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm leading-none">
                              {p.fullName ?? `${p.firstName} ${p.lastName}`}
                            </p>
                            {p.bloodGroup && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.bloodGroup}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm">{p.age ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p.gender}</p>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          {p.mobileNumber && (
                            <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                              <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                              {p.mobileNumber}
                            </div>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 max-w-[160px]">
                              <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate">{p.email}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        {p.city && (
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            {p.city}{p.state ? `, ${p.state}` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                          {new Date(p.registrationDate).toLocaleDateString('en-IN')}
                        </div>
                        {p.patientType && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.patientType}</p>
                        )}
                      </td>
                      <td className="text-center">
                        <StatusPill status={p.status} />
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => navigate(`/patients/${p.id}`)} className="icon-btn" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/patients/${p.id}/edit`)} className="icon-btn" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => navigate(`/patients/${p.id}/documents`)} className="icon-btn" title="Documents">
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="icon-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={filters.pageNumber === 1}
            onClick={() => setPage(filters.pageNumber - 1)}
            className="gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </Button>

          <div className="flex items-center gap-1">
            {pageNums[0] > 1 && (
              <>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setPage(1)}>1</Button>
                {pageNums[0] > 2 && <span className="text-slate-400 text-xs px-1">…</span>}
              </>
            )}
            {pageNums.map(n => (
              <Button
                key={n} size="sm"
                variant={n === filters.pageNumber ? 'default' : 'outline'}
                className="h-7 w-7 p-0 text-xs"
                onClick={() => setPage(n)}
              >
                {n}
              </Button>
            ))}
            {pageNums[pageNums.length - 1] < totalPages && (
              <>
                {pageNums[pageNums.length - 1] < totalPages - 1 && <span className="text-slate-400 text-xs px-1">…</span>}
                <Button variant="outline" size="sm" className="h-7 w-7 p-0 text-xs" onClick={() => setPage(totalPages)}>{totalPages}</Button>
              </>
            )}
          </div>

          <Button
            variant="outline" size="sm"
            disabled={filters.pageNumber === totalPages}
            onClick={() => setPage(filters.pageNumber + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
