import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Upload, File, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { FileManagerModel } from '../../types';
import { DocumentList } from './DocumentList';
import { FileViewer } from './FileViewer';
import { patientService } from '../../services/patientService';

interface FileManagerProps {
  patientId: string;
  patientName: string;
}

const CATEGORIES = ['Medical', 'Insurance', 'Identity', 'Report', 'Prescription', 'Other'];

export function FileManager({ patientId, patientName }: FileManagerProps) {
  const { t } = useTranslation();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileManagerModel | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uploadData, setUploadData] = useState({
    category: 'Medical',
    subCategory: '',
    description: '',
    documentDate: new Date().toISOString().split('T')[0],
    isConfidential: false,
    tags: '',
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const queryClient = useQueryClient();

  // ── Fetch documents ──────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['patient-documents', patientId, categoryFilter, searchTerm],
    queryFn: () => patientService.getDocuments(patientId, {
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      search: searchTerm || undefined,
    }),
    enabled: !!patientId,
  });

  const documents: FileManagerModel[] = (data?.data ?? []).map((d: any) => ({
    id: d.id,
    patientId: d.patientId,
    fileName: d.originalFileName ?? d.fileName,
    fileType: d.fileType,
    fileSize: d.fileSize,
    filePath: d.filePath,
    category: d.category,
    subCategory: d.subCategory,
    description: d.description,
    uploadedDate: d.uploadedDate,
    uploadedBy: d.uploadedBy,
    uploadedByName: d.uploadedByName,
    documentDate: d.documentDate,
    expiryDate: d.expiryDate,
    isConfidential: d.isConfidential,
    accessLevel: d.accessLevel ?? 'Private',
    tags: d.tags ? d.tags.split(',').map((t: string) => t.trim()) : [],
    version: d.version ?? 1,
    isLatestVersion: d.isLatestVersion ?? true,
    downloadCount: d.downloadCount ?? 0,
    notes: d.notes,
  }));

  // ── Upload ───────────────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => patientService.uploadDocuments(patientId, formData),
    onSuccess: () => {
      toast.success('Documents uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
      resetUploadForm();
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    const formData = new FormData();
    formData.append('category', uploadData.category);
    if (uploadData.subCategory) formData.append('subCategory', uploadData.subCategory);
    if (uploadData.description) formData.append('description', uploadData.description);
    formData.append('documentDate', uploadData.documentDate);
    formData.append('isConfidential', String(uploadData.isConfidential));
    if (uploadData.tags) formData.append('tags', uploadData.tags);
    if (uploadData.notes) formData.append('notes', uploadData.notes);
    Array.from(selectedFiles).forEach((f) => formData.append('files', f));

    uploadMutation.mutate(formData);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => patientService.deleteDocument(patientId, docId),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['patient-documents', patientId] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const handleDelete = (id: string) => {
    if (confirm('Delete this document? This cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  // ── Download ─────────────────────────────────────────────────────────────────

  const handleDownload = async (doc: FileManagerModel) => {
    try {
      const res = await patientService.downloadDocument(patientId, doc.id!);
      const blob = new Blob([res.data], { type: doc.fileType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  // ── View ─────────────────────────────────────────────────────────────────────

  const handleView = (doc: FileManagerModel) => {
    setSelectedFile(doc);
    setShowViewer(true);
  };

  const resetUploadForm = () => {
    setUploadData({
      category: 'Medical', subCategory: '', description: '',
      documentDate: new Date().toISOString().split('T')[0],
      isConfidential: false, tags: '', notes: '',
    });
    setSelectedFiles(null);
    setShowUpload(false);
  };

  const getCategoryIcon = (cat: string) => {
    if (['Report', 'Prescription', 'Medical'].includes(cat))
      return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('documents.title')}</h1>
          <p className="text-gray-600 mt-1">Patient: {patientName}</p>
        </div>
        <Button onClick={() => setShowUpload(!showUpload)}>
          <Upload className="h-4 w-4 mr-2" />
          {t('documents.upload')}
        </Button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <Card>
          <CardHeader><CardTitle>{t('documents.upload')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>{t('documents.category')} *</Label>
                  <select
                    value={uploadData.category}
                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <Label>{t('documents.sub_category')}</Label>
                  <Input
                    value={uploadData.subCategory}
                    onChange={(e) => setUploadData({ ...uploadData, subCategory: e.target.value })}
                    placeholder="e.g., Blood Test, X-Ray"
                  />
                </div>
                <div>
                  <Label>{t('documents.date')}</Label>
                  <Input
                    type="date"
                    value={uploadData.documentDate}
                    onChange={(e) => setUploadData({ ...uploadData, documentDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>{t('documents.description')}</Label>
                <Input
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <Label>{t('documents.tags')} (comma separated)</Label>
                <Input
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  placeholder="e.g., urgent, follow-up"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="confidential"
                  checked={uploadData.isConfidential}
                  onChange={(e) => setUploadData({ ...uploadData, isConfidential: e.target.checked })}
                />
                <Label htmlFor="confidential">{t('documents.confidential')}</Label>
              </div>

              <div>
                <Label>{t('documents.select_files')} *</Label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="w-full border rounded px-3 py-2"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('documents.max_size')}</p>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={uploadMutation.isPending}>
                  {uploadMutation.isPending ? 'Uploading...' : t('documents.upload')}
                </Button>
                <Button type="button" variant="outline" onClick={resetUploadForm}>{t('common.cancel')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Documents ({documents.length})</CardTitle>
            <div className="flex gap-2">
              <div className="relative w-56">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>{t('documents.no_documents')}</p>
            </div>
          ) : (
            <DocumentList
              documents={documents}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>

      {showViewer && selectedFile && (
        <FileViewer
          file={selectedFile}
          onClose={() => { setShowViewer(false); setSelectedFile(null); }}
        />
      )}
    </div>
  );
}
