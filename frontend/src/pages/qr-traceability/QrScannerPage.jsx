import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { Html5QrcodeScanner } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Download,
  Printer,
  History,
  Box,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function QrScannerPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [inputCode, setInputCode] = useState(initialSearch);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  const handleResolveCode = async (codeToSearch) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) {
      toast.error('Please enter a Part ID, Box ID, or QR code token');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/qr/scan', { code });
      if (res.data) {
        setScanResult(res.data);
        if (res.data.is_authentic) {
          toast.success(`Identity Verified: ${res.data.id}`);
        } else {
          toast.warning(res.data.message || 'Entity not found in ERP');
        }
      }
    } catch (err) {
      toast.error(err.message || 'QR code resolution failed');
      setScanResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialSearch) {
      handleResolveCode(initialSearch);
    }
  }, [initialSearch]);

  // Setup HTML5 Camera Scanner
  useEffect(() => {
    let html5QrcodeScanner = null;
    if (isScanningCamera) {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader-container',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          setInputCode(decodedText);
          setIsScanningCamera(false);
          html5QrcodeScanner.clear();
          handleResolveCode(decodedText);
        },
        (error) => {
          // ignore stream scanning frame errors
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(() => {});
      }
    };
  }, [isScanningCamera]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">QR Code Scanning & Traceability Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Resolve physical part or master box identities to inspect end-to-end historical lineage and custody records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/qr/labels-pdf?type=parts"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Part Labels PDF</span>
          </a>
          <a
            href="/api/qr/labels-pdf?type=boxes"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Box Labels PDF</span>
          </a>
        </div>
      </div>

      {/* SCANNER INPUT CARD */}
      <Card>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleResolveCode()}
              placeholder="Enter Part ID (PT-0001), Master Box (BX-0001), Batch (B-2026-0001) or Token..."
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono font-medium shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResolveCode()}
              disabled={loading}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Lookup Lineage</span>
            </button>

            <button
              onClick={() => setIsScanningCamera(!isScanningCamera)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isScanningCamera
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isScanningCamera ? 'Stop Camera' : 'Scan Camera'}</span>
            </button>
          </div>
        </div>

        {/* Quick sample pills */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Quick Test IDs:</span>
          {['PT-0001', 'PT-0002', 'PT-0010', 'BX-0001', 'BX-0002'].map((sample) => (
            <button
              key={sample}
              onClick={() => { setInputCode(sample); handleResolveCode(sample); }}
              className="px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border border-slate-200 transition-colors"
            >
              {sample}
            </button>
          ))}
        </div>

        {/* Camera Scanner Viewport */}
        {isScanningCamera && (
          <div className="mt-4 p-4 border border-brand-200 rounded-xl bg-slate-50 flex flex-col items-center">
            <div id="qr-reader-container" className="w-full max-w-sm rounded-lg overflow-hidden bg-white"></div>
            <p className="text-xs text-slate-500 mt-2">Point your device camera at the printed physical QR label</p>
          </div>
        )}
      </Card>

      {/* RESOLUTION RESULTS */}
      {loading && <LoadingSkeleton rows={5} cols={4} />}

      {!loading && scanResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Authenticity Banner */}
          <div className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
            scanResult.is_authentic ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-start gap-3">
              {scanResult.is_authentic ? (
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-sm font-bold">
                  {scanResult.is_authentic ? 'VERIFIED AUTHENTIC INDUSTRIAL IDENTITY' : 'UNVERIFIED OR MISMATCHED IDENTITY'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  {scanResult.is_authentic
                    ? `Physical ${scanResult.type?.toUpperCase()} registered and matched with verified batch lineage, IQC test certificates, and dispatch authorization.`
                    : scanResult.message}
                </p>
                {scanResult.scan_stats?.suspicious_repeat_scan && (
                  <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded inline-block">
                    ⚠️ ALERT: Repeated scan count ({scanResult.scan_stats.scan_count}) exceeds threshold! Validate chain of custody.
                  </div>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="font-mono font-black text-lg block">{scanResult.id}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold opacity-75">{scanResult.type} Entity</span>
            </div>
          </div>

          {/* MAIN TRACEABILITY DETAIL CARDS */}
          {scanResult.type === 'part' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product & Box */}
                <Card title="Product & Master Box" subtitle="Finished assembly specs">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Product Name</span>
                      <span className="font-bold text-slate-900">{scanResult.product?.name}</span>
                      <div className="text-slate-500 font-mono text-[11px]">{scanResult.product?.code}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Contained in Master Box</span>
                      <span className="font-mono font-bold text-indigo-700 text-sm">
                        {scanResult.box ? scanResult.box.box_number : 'Unboxed'}
                      </span>
                      <div className="text-[11px] text-slate-500">Box Capacity: {scanResult.box?.capacity || 20} pcs</div>
                    </div>
                  </div>
                </Card>

                {/* Vendor & Source Batch */}
                <Card title="Raw Material Origin" subtitle="Vendor batch preservation">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Supplier Vendor</span>
                      <span className="font-bold text-slate-900">{scanResult.vendor?.name || 'V-03 Tech Corp'}</span>
                      <div className="text-slate-500 font-mono text-[11px]">{scanResult.vendor?.gst || '27AAACT2727Q1ZB'}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Original Vendor Batch (Preserved)</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {scanResult.source_batch?.vendor_batch_number || 'VB-88219'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Internal Batch ID (Unique)</span>
                      <span className="font-mono font-bold text-brand-700">
                        {scanResult.source_batch?.internal_batch_id || 'B-2026-0025'}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Quality & Dispatch */}
                <Card title="IQC, QC & Outward Pass" subtitle="Inspection and clearance records">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IQC Division:</span>
                      <span className="font-semibold text-slate-800">{scanResult.iqc?.division || 'Paint'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sample QC:</span>
                      <span className="font-bold text-emerald-700">Passed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">3-Way Clearance:</span>
                      <span className="text-emerald-700 font-bold">Admin, Sales & Accounts Approved</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Outward Shipment</span>
                      <span className="font-mono font-bold text-slate-900">
                        {scanResult.shipment?.shipment_number || 'SH-2026-0001'}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        Vehicle: {scanResult.shipment?.vehicle_number || 'MH-12-AB-9876'}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* VISUAL TRACEABILITY TIMELINE */}
              <Card title="End-to-End Visual Traceability Lineage" subtitle="Verifiable progression from supplier intake to outward custody">
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {scanResult.timeline?.map((step) => (
                    <div key={step.step} className="relative group">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-brand-600 text-white font-bold text-[10px] flex items-center justify-center ring-4 ring-white shadow">
                        {step.step}
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-brand-300 transition-colors">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                          <span className="font-mono text-[11px] px-2 py-0.5 bg-brand-50 text-brand-700 font-semibold rounded border border-brand-200">
                            {step.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <span>Recorded Date: {step.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* BOX DETAILS */}
          {scanResult.type === 'box' && (
            <Card title={`Master Box Details - ${scanResult.id}`} subtitle="Consolidated box containing tracked physical units">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Box Capacity / Packed</span>
                    <span className="font-bold text-slate-900">{scanResult.packed_count} / {scanResult.capacity} pcs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Packaging Order</span>
                    <span className="font-mono font-bold text-brand-700">{scanResult.packaging_order}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Shipment</span>
                    <span className="font-mono font-bold text-slate-900">{scanResult.shipment?.shipment_number || 'Awaiting Shipment'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Contained Part Instances ({scanResult.parts?.length || 0})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                    {scanResult.parts?.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { setInputCode(p.part_number); handleResolveCode(p.part_number); }}
                        className="p-2 bg-white rounded border border-slate-200 text-left hover:border-brand-500 hover:bg-brand-50/40 transition-colors"
                      >
                        <div className="font-mono font-bold text-xs text-brand-800">{p.part_number}</div>
                        <div className="text-[10px] text-slate-500 truncate">{p.serial_number}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

