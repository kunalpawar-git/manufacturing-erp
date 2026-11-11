import ExcelJS from 'exceljs';

/**
 * Generates a styled Excel workbook buffer for any ERP report.
 * @param {string} sheetName Name of the worksheet
 * @param {Array<{ header: string, key: string, width: number }>} columns
 * @param {Array<Object>} data
 * @param {string} title Report Title
 * @returns {Promise<Buffer>}
 */
export const generateExcelReport = async (sheetName, columns, data, title = 'ERP Report') => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Manufacturing Operations ERP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  // Title Row
  worksheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F243A' }, // Navy
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 35;

  // Subtitle / Timestamp
  worksheet.mergeCells(2, 1, 2, columns.length);
  const subCell = worksheet.getCell(2, 1);
  subCell.value = `Exported on: ${new Date().toLocaleString('en-IN')} | Total Records: ${data.length}`;
  subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  // Blank row
  worksheet.addRow([]);

  // Header Row
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F5184' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Data Rows
  data.forEach((item, index) => {
    const rowValues = columns.map((col) => {
      const val = item[col.key];
      return val !== null && val !== undefined ? val : '-';
    });
    const row = worksheet.addRow(rowValues);
    row.height = 22;

    const isEven = index % 2 === 0;
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 9.5 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
  });

  // Set column widths
  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width || 18;
  });

  return await workbook.xlsx.writeBuffer();
};
