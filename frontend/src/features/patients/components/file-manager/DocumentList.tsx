import { FileManagerModel } from '../../types';
import { File, Download, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DocumentListProps {
  documents: FileManagerModel[];
  onView: (doc: FileManagerModel) => void;
  onDownload: (doc: FileManagerModel) => void;
  onDelete: (id: string) => void;
}

export function DocumentList({ documents, onView, onDownload, onDelete }: DocumentListProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="p-3 text-left">File Name</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">Size</th>
            <th className="p-3 text-left">Upload Date</th>
            <th className="p-3 text-left">Uploaded By</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-gray-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{doc.fileName}</span>
                  {doc.isConfidential && (
                    <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Confidential</span>
                  )}
                </div>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {doc.category}
                </span>
              </td>
              <td className="p-3 text-sm">{formatFileSize(doc.fileSize)}</td>
              <td className="p-3 text-sm">{new Date(doc.uploadedDate).toLocaleDateString()}</td>
              <td className="p-3 text-sm">{doc.uploadedByName || 'N/A'}</td>
              <td className="p-3">
                <div className="flex justify-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onView(doc)} title="View">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDownload(doc)} title="Download">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onDelete(doc.id!)} title="Delete">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
