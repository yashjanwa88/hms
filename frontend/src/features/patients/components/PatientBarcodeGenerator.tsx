import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Search, Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { patientService } from '../services/patientService';

interface PatientInfo {
  id: string;
  uhid: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  gender?: string;
  dateOfBirth?: string;
}

// ── Minimal QR code renderer using canvas (no external lib needed) ─────────────
// For production, install 'qrcode' package: npm i qrcode @types/qrcode
// and replace this with: import QRCode from 'qrcode'; QRCode.toCanvas(canvas, text)

function drawQRPlaceholder(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d')!;
  const size = canvas.width;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000';
  ctx.font = `${size * 0.06}px monospace`;
  ctx.textAlign = 'center';

  // Draw finder pattern corners (simplified visual)
  const drawSquare = (x: number, y: number, s: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, s, s);
  };
  const m = size * 0.1;
  const b = size * 0.25;
  drawSquare(m, m, b, '#000'); drawSquare(m + 4, m + 4, b - 8, '#fff'); drawSquare(m + 10, m + 10, b - 20, '#000');
  drawSquare(size - m - b, m, b, '#000'); drawSquare(size - m - b + 4, m + 4, b - 8, '#fff'); drawSquare(size - m - b + 10, m + 10, b - 20, '#000');
  drawSquare(m, size - m - b, b, '#000'); drawSquare(m + 4, size - m - b + 4, b - 8, '#fff'); drawSquare(m + 10, size - m - b + 10, b - 20, '#000');

  // Data text in center
  ctx.fillStyle = '#000';
  ctx.fillText(text.substring(0, 20), size / 2, size / 2 - 8);
  ctx.fillText(text.substring(20, 40), size / 2, size / 2 + 12);
}

function drawBarcode(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = Math.floor(canvas.width / (text.length * 11 + 20));
  let x = 10;
  ctx.fillStyle = '#000';

  for (const char of text) {
    const code = char.charCodeAt(0);
    for (let i = 0; i < 8; i++) {
      if ((code >> (7 - i)) & 1) {
        ctx.fillRect(x, 10, barWidth, canvas.height - 30);
      }
      x += barWidth + 1;
    }
    x += barWidth * 2;
  }

  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height - 8);
}

export const PatientBarcodeGenerator: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [codeType, setCodeType] = useState<'barcode' | 'qr'>('qr');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const displayName = patient
    ? (patient.fullName ?? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim())
    : '';

  useEffect(() => {
    if (!patient || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const text = patient.uhid;
    if (codeType === 'qr') {
      canvas.width = 200; canvas.height = 200;
      drawQRPlaceholder(canvas, text);
    } else {
      canvas.width = 320; canvas.height = 80;
      drawBarcode(canvas, text);
    }
  }, [patient, codeType]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) { toast.error('Enter UHID or mobile number'); return; }
    setIsSearching(true);
    try {
      // Try UHID first, then quick search
      let found: PatientInfo | null = null;
      try {
        const res = await patientService.getPatientByUHIDRegistration(searchTerm.trim());
        const p = res?.data;
        if (p) found = { id: p.id, uhid: p.uhid ?? p.UHID, fullName: p.fullName, firstName: p.firstName, lastName: p.lastName, mobileNumber: p.mobileNumber, gender: p.gender, dateOfBirth: p.dateOfBirth };
      } catch { /* not found by UHID, try quick search */ }

      if (!found) {
        const res = await patientService.quickSearch(searchTerm.trim(), 1);
        const p = res?.[0];
        if (p) found = { id: p.id, uhid: p.uhid ?? p.UHID, fullName: p.fullName, firstName: p.firstName ?? p.first_name, lastName: p.lastName ?? p.last_name, mobileNumber: p.mobileNumber ?? p.mobile_number, gender: p.gender };
      }

      if (found) { setPatient(found); toast.success('Patient found'); }
      else toast.error('Patient not found');
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handlePrint = () => {
    if (!canvasRef.current || !patient) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const win = window.open('', '_blank')!;
    win.document.write(`
      <html><body style="text-align:center;font-family:sans-serif;padding:20px">
        <h3>${displayName}</h3>
        <p>UHID: <strong>${patient.uhid}</strong></p>
        ${patient.mobileNumber ? `<p>Mobile: ${patient.mobileNumber}</p>` : ''}
        <img src="${dataUrl}" style="margin:10px auto;display:block"/>
        <script>window.onload=()=>{window.print();window.close()}<\/script>
      </body></html>`);
    win.document.close();
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${patient?.uhid ?? 'barcode'}-${codeType}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Patient Barcode / QR Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Search by UHID or Mobile Number</Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter UHID or mobile number"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="mt-6">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="flex gap-3">
            <Button
              variant={codeType === 'qr' ? 'default' : 'outline'}
              onClick={() => setCodeType('qr')}
            >
              <QrCode className="h-4 w-4 mr-2" /> QR Code
            </Button>
            <Button
              variant={codeType === 'barcode' ? 'default' : 'outline'}
              onClick={() => setCodeType('barcode')}
            >
              Barcode
            </Button>
          </div>
        </CardContent>
      </Card>

      {patient && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="border-2 border-dashed p-8 rounded-lg inline-block">
                <canvas ref={canvasRef} className="mx-auto" />
              </div>
              <div className="text-sm space-y-1">
                <p className="font-bold text-lg">{displayName}</p>
                <p className="font-mono">UHID: {patient.uhid}</p>
                {patient.mobileNumber && <p>Mobile: {patient.mobileNumber}</p>}
                {patient.gender && <p>Gender: {patient.gender}</p>}
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                  Download PNG
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
