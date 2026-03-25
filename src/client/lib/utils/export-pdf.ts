import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

export interface PdfSection {
  title: string;
  rows: Record<string, unknown>[];
}

/**
 * Generates a multi-section PDF analytics report and triggers a download.
 *
 * @param sections Array of titled data sections to include
 * @param reportTitle Title printed at the top of the PDF
 * @param filename Filename without extension
 * @param dateRange Human-readable date range string shown in the subtitle
 */
export function exportToPdf(
  sections: PdfSection[],
  reportTitle: string,
  filename: string,
  dateRange: string
): void {
  const doc = new jsPDF({ orientation: 'landscape' });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, pageWidth / 2, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(dateRange, pageWidth / 2, 26, { align: 'center' });

  let yOffset = 34;

  for (const section of sections) {
    if (section.rows.length === 0) continue;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 14, yOffset);
    yOffset += 4;

    const headers = Object.keys(section.rows[0]);
    const tableRows = section.rows.map((r) =>
      headers.map((h) => {
        const val = r[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val as string | number | boolean);
      })
    );

    doc.autoTable({
      startY: yOffset,
      head: [headers],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: { cursor: { y: number } }) => {
        yOffset = data.cursor.y + 10;
      },
    });

    const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
    yOffset = lastTable.finalY + 10;
  }

  doc.save(`${filename}.pdf`);
}
