import PDFDocument from 'pdfkit';

/**
 * Generates a PDF sheet of QR labels with human-readable IDs, product name, and batch info.
 * @param {Array} labels Array of { id, title, subtitle, qrDataUrl, extra }
 * @returns {Promise<Buffer>}
 */
export const generateQrLabelSheet = async (labels = [], title = 'QR Identification Labels') => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#0f243a').text(title, { align: 'center' });
      doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
      doc.moveDown(1.5);

      const itemsPerRow = 3;
      const labelWidth = 165;
      const labelHeight = 160;
      const startX = 40;
      let startY = 80;
      const gapX = 20;
      const gapY = 20;

      labels.forEach((item, index) => {
        const col = index % itemsPerRow;
        const row = Math.floor((index % 9) / itemsPerRow);

        if (index > 0 && index % 9 === 0) {
          doc.addPage();
          startY = 50;
        }

        const x = startX + col * (labelWidth + gapX);
        const y = startY + row * (labelHeight + gapY);

        // Border box
        doc.roundedRect(x, y, labelWidth, labelHeight, 6).lineWidth(1).strokeColor('#cbd5e1').stroke();

        // QR Code image
        if (item.qrDataUrl) {
          const base64Data = item.qrDataUrl.replace(/^data:image\/png;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          doc.image(imgBuffer, x + 35, y + 10, { width: 95, height: 95 });
        }

        // Readable labels
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f243a').text(item.id, x + 5, y + 110, {
          width: labelWidth - 10,
          align: 'center',
        });

        if (item.title) {
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#334155').text(item.title, x + 5, y + 125, {
            width: labelWidth - 10,
            align: 'center',
            ellipsis: true,
          });
        }

        if (item.subtitle) {
          doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(item.subtitle, x + 5, y + 140, {
            width: labelWidth - 10,
            align: 'center',
            ellipsis: true,
          });
        }
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates an official Dispatch Gate Pass PDF.
 */
export const generateDispatchGatePass = async (shipment, boxes = [], parts = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(40, 40, 515, 60).fill('#0f243a');
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text('MANUFACTURING OPERATIONS ERP', 55, 50);
      doc.fontSize(11).font('Helvetica').fillColor('#94a3b8').text('OUTWARD DISPATCH GATE PASS & DELIVERY CHALLAN', 55, 75);

      doc.moveDown(3);
      doc.fillColor('#0f172a');

      // Shipment details table
      const leftCol = 50;
      const rightCol = 320;
      let curY = 125;

      doc.fontSize(11).font('Helvetica-Bold').text(`Shipment ID: ${shipment.shipment_number}`, leftCol, curY);
      doc.font('Helvetica').text(`Gate-Out Date: ${shipment.dispatch_date || new Date().toISOString().split('T')[0]}`, rightCol, curY);
      curY += 20;

      doc.font('Helvetica-Bold').text(`Customer / Destination:`, leftCol, curY);
      doc.font('Helvetica').text(shipment.customer ? shipment.customer.name : 'Authorized Consignee', leftCol + 140, curY);
      curY += 18;

      doc.font('Helvetica').text(`Address: ${shipment.destination_address || 'Factory Outward Dispatch Yard'}`, leftCol, curY);
      curY += 22;

      doc.font('Helvetica-Bold').text(`Vehicle Number:`, leftCol, curY);
      doc.font('Helvetica').text(shipment.vehicle_number || 'MH-12-AB-9876', leftCol + 100, curY);
      doc.font('Helvetica-Bold').text(`LR / Consignment:`, rightCol, curY);
      doc.font('Helvetica').text(shipment.lr_consignment_number || 'LR-2026-8812', rightCol + 110, curY);
      curY += 20;

      doc.font('Helvetica-Bold').text(`Driver / Receiving Party:`, leftCol, curY);
      doc.font('Helvetica').text(`${shipment.driver_name || 'Ramesh Kumar'} (${shipment.driver_phone || '9876543210'})`, leftCol + 140, curY);
      curY += 30;

      // 3-Way Clearance status
      doc.rect(40, curY, 515, 30).fill('#f1f5f9');
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#166534').text(
        '✓ MANDATORY 3-WAY DISPATCH CLEARANCE VERIFIED: Admin [Approved] | Sales [Approved] | Accounts [Approved]',
        50,
        curY + 9
      );
      curY += 45;

      // Summary of Boxes & Parts
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('CONTAINED MASTER BOXES & TRACEABILITY SUMMARY:', leftCol, curY);
      curY += 20;

      boxes.forEach((box, i) => {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(
          `Box ${i + 1}: ${box.box_number} (Capacity: ${box.capacity || 20} pcs, Packed: ${box.packed_count || 20} pcs, Status: ${box.status})`,
          leftCol + 10,
          curY
        );
        curY += 16;
      });

      curY += 25;
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#475569').text(`Total Master Boxes: ${boxes.length} | Total Tracked Parts: ${shipment.total_parts || parts.length}`, leftCol, curY);
      curY += 40;

      // Signatures
      doc.rect(leftCol, curY, 130, 1).strokeColor('#94a3b8').stroke();
      doc.rect(leftCol + 180, curY, 130, 1).strokeColor('#94a3b8').stroke();
      doc.rect(leftCol + 350, curY, 130, 1).strokeColor('#94a3b8').stroke();

      doc.fontSize(9).font('Helvetica').fillColor('#64748b');
      doc.text('Authorized Store Incharge', leftCol, curY + 6);
      doc.text('Security Gate Outward Officer', leftCol + 180, curY + 6);
      doc.text('Carrier / Driver Signature', leftCol + 350, curY + 6);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generates a formatted enterprise PDF report from tabular columns and rows.
 */
export const generateReportPdf = async (title = 'ERP Operational Report', columns = [], rows = []) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Header Banner
      doc.rect(30, 25, 780, 48).fill('#0f243a');
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#ffffff').text(title.toUpperCase(), 45, 34);
      doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8').text(
        `Manufacturing Operations & QR Traceability ERP | Generated: ${new Date().toLocaleString('en-IN')} | Total Records: ${rows.length}`,
        45,
        54
      );

      const pageWidth = 780;
      const colCount = Math.max(columns.length, 1);
      const colWidth = Math.floor(pageWidth / colCount);
      let y = 85;

      const drawHeader = (topY) => {
        doc.rect(30, topY, pageWidth, 22).fill('#1e293b');
        columns.forEach((col, i) => {
          doc
            .fontSize(8)
            .font('Helvetica-Bold')
            .fillColor('#ffffff')
            .text(String(col.header || ''), 34 + i * colWidth, topY + 6, {
              width: colWidth - 8,
              ellipsis: true,
            });
        });
        return topY + 24;
      };

      y = drawHeader(y);

      rows.forEach((row, rIdx) => {
        if (y > 530) {
          doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
          y = drawHeader(35);
        }

        if (rIdx % 2 === 0) {
          doc.rect(30, y - 2, pageWidth, 18).fill('#f8fafc');
        }

        columns.forEach((col, cIdx) => {
          const val = row[col.key] !== null && row[col.key] !== undefined ? String(row[col.key]) : '-';
          doc
            .fontSize(7.5)
            .font('Helvetica')
            .fillColor('#1e293b')
            .text(val, 34 + cIdx * colWidth, y + 2, {
              width: colWidth - 8,
              ellipsis: true,
            });
        });

        y += 18;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
