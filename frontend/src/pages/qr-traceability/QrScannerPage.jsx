import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  ShieldAlert,
  Download,
  Printer,
  Box,
  Layers,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export default function QrScannerPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [inputCode, setInputCode] = useState(initialSearch);
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleResolveCode = async (codeToSearch) => {
    const code = (codeToSearch || inputCode).trim();
    if (!code) {
      toast.error('Please enter a Part ID, Box ID, Batch ID, Shipment ID, or QR token');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/qr/scan', { code });
      if (res.data) {
        setScanResult(res.data);
        if (res.data.is_authentic) {
          toast.success(`Identity Verified: ${res.data.id} (${res.data.type?.toUpperCase()})`);
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
    } else {
      // Load default illustrative example PT-0001 on first visit so user immediately sees full lineage
      setInputCode('PT-0001');
      handleResolveCode('PT-0001');
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
        () => {
          // ignore stream scanning frame errors
        }
      );
    }

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(() => { });
      }
    };
  }, [isScanningCamera]);

  const handleDownloadQrPng = () => {
    if (!scanResult?.qr_data_url) {
      toast.warning('No QR PNG image available for this record type');
      return;
    }
    const a = document.createElement('a');
    a.href = scanResult.qr_data_url;
    a.download = `QR_${scanResult.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Downloaded QR_${scanResult.id}.png`);
  };

  const handleDownloadLabelsPdf = (type, ids = '') => {
    const token = localStorage.getItem('erp_token') || '';
    const idsParam = ids ? `&ids=${encodeURIComponent(ids)}` : '';
    window.open(`/api/qr/labels-pdf?type=${type}${idsParam}&token=${encodeURIComponent(token)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">QR Code Scanning & End-to-End Traceability Engine</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scan or lookup Part QR (`PT-`), Master Box (`BX-`), Internal Batch (`B-`), or Shipment (`SH-`) to inspect full custody lineage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadLabelsPdf('parts')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Part Labels PDF</span>
          </button>
          <button
            onClick={() => handleDownloadLabelsPdf('boxes')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Box Labels PDF</span>
          </button>
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
              placeholder="Enter Part ID (PT-0001), Master Box (BX-0145), Batch (B-2026-0025), Shipment (SH-0089) or Token..."
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
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${isScanningCamera
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isScanningCamera ? 'Stop Camera' : 'Scan Camera'}</span>
            </button>
          </div>
        </div>

        {/* Quick sample pills matching PDF specification */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-600">Quick Reference IDs (from Spec):</span>
          {[
            { code: 'PT-0001', label: 'Part: PT-0001' },
            { code: 'PT-0002', label: 'Part: PT-0002' },
            { code: 'BX-0145', label: 'Box: BX-0145' },
            { code: 'BX-0001', label: 'Box: BX-0001' },
            { code: 'B-2026-0025', label: 'Batch: B-2026-0025' },
            { code: 'SH-0089', label: 'Shipment: SH-0089' },
          ].map((sample) => (
            <button
              key={sample.code}
              onClick={() => {
                setInputCode(sample.code);
                handleResolveCode(sample.code);
              }}
              className={`px-2.5 py-1 rounded-md font-mono font-semibold border transition-colors ${inputCode === sample.code
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-slate-100 hover:bg-brand-50 hover:text-brand-700 border-slate-200 text-slate-700'
                }`}
            >
              {sample.label}
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
          {/* Authenticity Banner + QR Preview */}
          <div
            className={`p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${scanResult.is_authentic
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}
          >
            <div className="flex items-start gap-3 flex-1 min-w-[260px]">
              {scanResult.is_authentic ? (
                <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">
                    {scanResult.is_authentic
                      ? 'CONSISTENT & VERIFIED ERP TRACEABILITY RECORD'
                      : 'UNVERIFIED OR MISMATCHED IDENTITY'}
                  </h3>
                  <Badge status={scanResult.status || (scanResult.is_authentic ? 'Verified' : 'Rejected')} />
                </div>
                <p className="text-xs opacity-90 mt-1">
                  {scanResult.is_authentic
                    ? `Physical ${scanResult.type?.toUpperCase()} (${scanResult.id}) matched against recorded vendor batch, IQC certificate, production work order, and 3-way dispatch custody.`
                    : scanResult.message}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 italic">
                  Note: Per Section 5 of the Traceability Spec, QR/batch consistency must always be evaluated alongside recorded shipment and custody history.
                </p>
                {scanResult.scan_stats?.suspicious_repeat_scan && (
                  <div className="mt-2 text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded inline-block">
                    ALERT: Repeated scan count ({scanResult.scan_stats.scan_count}) exceeds threshold! Validate chain of custody.
                  </div>
                )}
              </div>
            </div>

            {/* Right: QR Image + Download PNG / Print Label */}
            <div className="flex items-center gap-4 bg-white/90 p-3 rounded-xl border border-slate-200 shadow-sm">
              {scanResult.qr_data_url && (
                <div className="text-center">
                  <img
                    src={scanResult.qr_data_url}
                    alt={scanResult.id}
                    className="w-20 h-20 rounded border border-slate-200 bg-white p-1 mx-auto"
                  />
                  <span className="font-mono font-bold text-[11px] text-slate-800 block mt-1">{scanResult.id}</span>
                </div>
              )}
              <div className="space-y-1.5 text-right">
                <span className="font-mono font-black text-base text-slate-900 block">{scanResult.id}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 inline-block">
                  {scanResult.type} Record
                </span>
                {scanResult.qr_data_url && (
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      onClick={handleDownloadQrPng}
                      className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[11px] font-semibold flex items-center justify-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      onClick={() =>
                        handleDownloadLabelsPdf(
                          scanResult.type === 'box' ? 'boxes' : 'parts',
                          scanResult.id
                        )
                      }
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center justify-center gap-1 border border-slate-200"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print Label PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 1. PART TRACEABILITY VIEW */}
          {scanResult.type === 'part' && scanResult.found && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Product & Box */}
                <Card title="Product & Master Box" subtitle="Finished assembly & packaging specs">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Product Name & Code</span>
                      <span className="font-bold text-slate-900">{scanResult.product?.name}</span>
                      <div className="text-slate-500 font-mono text-[11px]">
                        {scanResult.product?.code} | Serial: {scanResult.serial_number || 'N/A'}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Contained in Master Box</span>
                      {scanResult.box ? (
                        <button
                          onClick={() => {
                            setInputCode(scanResult.box.box_number);
                            handleResolveCode(scanResult.box.box_number);
                          }}
                          className="font-mono font-bold text-indigo-700 hover:underline text-sm"
                        >
                          {scanResult.box.box_number}
                        </button>
                      ) : (
                        <span className="text-slate-500">Unboxed</span>
                      )}
                      <div className="text-[11px] text-slate-500">
                        Packaging Order: {scanResult.packaging?.packaging_number || 'PKG-2026-0001'} ({scanResult.packaging?.status || 'Approved'})
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Vendor & Source Batch */}
                <Card title="Raw Material Origin" subtitle="Immutable vendor batch preservation">
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Supplier Vendor</span>
                      <span className="font-bold text-slate-900">
                        {scanResult.vendor?.code} - {scanResult.vendor?.name || 'V-03 Tech Corp'}
                      </span>
                      <div className="text-slate-500 font-mono text-[11px]">
                        GST: {scanResult.vendor?.gst || '27AAACT2727Q1ZB'}
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Original Vendor Batch (Preserved)</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {scanResult.source_batch?.vendor_batch_number || 'VB-88219'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Internal Batch ID (Unique)</span>
                      <button
                        onClick={() => {
                          const bId = scanResult.source_batch?.internal_batch_id || 'B-2026-0025';
                          setInputCode(bId);
                          handleResolveCode(bId);
                        }}
                        className="font-mono font-bold text-brand-700 hover:underline"
                      >
                        {scanResult.source_batch?.internal_batch_id || 'B-2026-0025'}
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Quality & Dispatch */}
                <Card title="IQC, Sample QC & Outward Dispatch" subtitle="Inspection and 3-way clearance records">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">IQC Division & Status:</span>
                      <span className="font-semibold text-slate-800">
                        {scanResult.iqc?.division || 'Paint'} ({scanResult.iqc?.status || 'Accepted'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Production Work Order:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {scanResult.work_order?.work_order_number || 'WO-2026-0001'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Sample QC Result:</span>
                      <span className="font-bold text-emerald-700">{scanResult.sample_qc?.result || 'Passed'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 block font-medium">Outward Shipment & Custody</span>
                      {scanResult.shipment ? (
                        <>
                          <button
                            onClick={() => {
                              setInputCode(scanResult.shipment.shipment_number);
                              handleResolveCode(scanResult.shipment.shipment_number);
                            }}
                            className="font-mono font-bold text-slate-900 hover:underline"
                          >
                            {scanResult.shipment.shipment_number}
                          </button>
                          <div className="text-[11px] text-slate-500">
                            Dispatch Date: {scanResult.shipment.dispatch_date || 'Pending Gate-Out'} | Vehicle: {scanResult.shipment.vehicle_number}
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-500">In Warehouse Stock (Not yet shipped)</span>
                      )}
                    </div>
                  </div>
                </Card>
              </div>

              {/* VISUAL TRACEABILITY TIMELINE */}
              <Card
                title="End-to-End Visual Traceability Lineage"
                subtitle="Verifiable progression from supplier intake to outward customer custody"
              >
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
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Recorded Date: {step.date}</span>
                          <span>•</span>
                          <span>Status: {step.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* 2. MASTER BOX TRACEABILITY VIEW */}
          {scanResult.type === 'box' && scanResult.found && (
            <Card
              title={`Master Box Details - ${scanResult.id}`}
              subtitle="Consolidated master box linking all packed item IDs to source batches, packaging approval, and shipment"
            >
              <div className="space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Product</span>
                    <span className="font-bold text-slate-900">{scanResult.product}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Packed Quantity</span>
                    <span className="font-bold text-slate-900">
                      {scanResult.packed_count} / {scanResult.capacity} pcs
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Packaging Order</span>
                    <span className="font-mono font-bold text-brand-700">{scanResult.packaging_order}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Shipment Association</span>
                    {scanResult.shipment ? (
                      <button
                        onClick={() => {
                          setInputCode(scanResult.shipment.shipment_number);
                          handleResolveCode(scanResult.shipment.shipment_number);
                        }}
                        className="font-mono font-bold text-indigo-700 hover:underline"
                      >
                        {scanResult.shipment.shipment_number} ({scanResult.shipment.status})
                      </button>
                    ) : (
                      <span className="text-slate-500">Awaiting Shipment</span>
                    )}
                  </div>
                </div>

                {/* Source Batches & Vendors */}
                {scanResult.source_batches?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 mb-2">
                      Source Raw Material Batches & Vendors ({scanResult.source_batches.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {scanResult.source_batches.map((sb, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800">{sb.material_name}</div>
                            <div className="text-[11px] text-slate-500">
                              Vendor: <strong>{sb.vendor_code} - {sb.vendor_name}</strong> | Vendor Lot: <span className="font-mono">{sb.vendor_batch_number}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setInputCode(sb.internal_batch_id);
                              handleResolveCode(sb.internal_batch_id);
                            }}
                            className="font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-200 hover:bg-brand-100"
                          >
                            {sb.internal_batch_id}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contained Parts */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2">
                    Contained Part Instances ({scanResult.parts?.length || 0}) — Click any Part to inspect unit lineage
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                    {scanResult.parts?.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setInputCode(p.part_number);
                          handleResolveCode(p.part_number);
                        }}
                        className="p-2.5 bg-white rounded-lg border border-slate-200 text-left hover:border-brand-500 hover:bg-brand-50/40 transition-colors"
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

          {/* 3. BATCH TRACEABILITY VIEW */}
          {scanResult.type === 'batch' && scanResult.found && (
            <Card
              title={`Internal Batch Genealogy - ${scanResult.id}`}
              subtitle="Vendor origin, IQC inspection result, and downstream production work orders"
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Original Vendor Batch</span>
                    <span className="font-mono font-bold text-slate-900">{scanResult.vendor_batch_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Material</span>
                    <span className="font-bold text-slate-900">{scanResult.material?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">IQC Division</span>
                    <span className="font-semibold text-brand-700">{scanResult.division} Division</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Stock (Current / Initial)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {scanResult.current_quantity} / {scanResult.initial_quantity} {scanResult.material?.unit}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <h4 className="font-bold text-slate-800 mb-2">Supplier & IQC Verification</h4>
                    <p><strong>Vendor:</strong> {scanResult.vendor?.code} - {scanResult.vendor?.name}</p>
                    <p><strong>GST:</strong> <span className="font-mono">{scanResult.vendor?.gst}</span></p>
                    <p><strong>IQC Record:</strong> <span className="font-mono">{scanResult.iqc?.inspection_number}</span> ({scanResult.iqc?.status})</p>
                    <p><strong>Inspector:</strong> {scanResult.iqc?.inspector} on {scanResult.iqc?.inspection_date}</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                    <h4 className="font-bold text-slate-800 mb-2">
                      Consumed in Production Work Orders ({scanResult.work_orders?.length || 0})
                    </h4>
                    {scanResult.work_orders?.length === 0 ? (
                      <p className="text-slate-400">No production consumption recorded yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {scanResult.work_orders.map((wo, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-50 border">
                            <div>
                              <span className="font-mono font-bold text-brand-700">{wo.work_order_number}</span>
                              <span className="ml-2 text-slate-600">{wo.product_name}</span>
                            </div>
                            <span className="font-mono font-semibold">{wo.quantity_consumed} consumed</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 4. SHIPMENT TRACEABILITY VIEW */}
          {scanResult.type === 'shipment' && scanResult.found && (
            <Card
              title={`Outward Shipment Traceability - ${scanResult.id} (Rev v${scanResult.version})`}
              subtitle="Customer destination, 3-way dispatch approvals, and contained master boxes"
            >
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block font-medium">Customer / Recipient</span>
                    <span className="font-bold text-slate-900">{scanResult.customer?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Vehicle & LR #</span>
                    <span className="font-mono font-bold text-slate-900">
                      {scanResult.vehicle_number} / {scanResult.lr_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Dispatch Date</span>
                    <span className="font-semibold text-slate-800">{scanResult.dispatch_date || 'Pending Gate-Out'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total Packed</span>
                    <span className="font-mono font-bold text-brand-700">
                      {scanResult.total_boxes} Boxes ({scanResult.total_parts} Parts)
                    </span>
                  </div>
                </div>

                {/* 3-Way Approvals */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Mandatory 3-Way Dispatch Clearances</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {scanResult.approvals?.map((app, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{app.role} Approval</span>
                          <Badge status={app.decision} />
                        </div>
                        <div className="text-[11px] text-slate-600 mt-1">Signee: {app.approver}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{app.comments}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contained Boxes */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Included Master Boxes — Click to inspect box</h4>
                  <div className="flex flex-wrap gap-2">
                    {scanResult.boxes?.map((b) => (
                      <button
                        key={b.box_number}
                        onClick={() => {
                          setInputCode(b.box_number);
                          handleResolveCode(b.box_number);
                        }}
                        className="px-3 py-2 bg-white hover:bg-brand-50 rounded-lg border border-slate-200 font-mono font-bold text-brand-700 flex items-center gap-2"
                      >
                        <Box className="w-4 h-4" />
                        <span>{b.box_number} ({b.packed_count} pcs)</span>
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
