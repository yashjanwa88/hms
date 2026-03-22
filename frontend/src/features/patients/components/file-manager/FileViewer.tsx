import { FileManagerModel } from '../../types';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface FileViewerProps {
  file: FileManagerModel;
  onClose: () => void;
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [zoom, setZoom] = useState(100);

  const isImage = file.fileType.startsWith('image/');
  const isPDF = file.fileType === 'application/pdf';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.filePath;
    link.download = file.fileName;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-bold">{file.fileName}</h2>
            <p className="text-sm text-gray-600">
              {file.category} • {new Date(file.uploadedDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <>
                <Button size="sm" variant="outline" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{zoom}%</span>
                <Button size="sm" variant="outline" onClick={() => setZoom(Math.min(200, zoom + 10))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {isImage ? (
            <div className="flex items-center justify-center h-full">
              <img
                src={file.filePath}
                alt={file.fileName}
                style={{ maxWidth: `${zoom}%`, maxHeight: `${zoom}%` }}
                className="object-contain"
              />
            </div>
          ) : isPDF ? (
            <iframe
              src={file.filePath}
              className="w-full h-full border-0"
              title={file.fileName}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download to View
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {file.description && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-700">
              <strong>Description:</strong> {file.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
