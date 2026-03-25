import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const typeSafeAutoTable = autoTable as unknown as (
  doc: jsPDF,
  options: Record<string, unknown>
) => void;

export interface PdfSection {
  title: string;
  rows: Record<string, unknown>[];
}

export function exportToPdf(
  sections: PdfSection[],
  reportTitle: string,
  filename: string,
  dateRange: string
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();

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

    typeSafeAutoTable(doc, {
      startY: yOffset,
      head: [headers],
      body: tableRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
      margin: { left: 14, right: 14 },
    });

    const docWithTable = doc as unknown as { lastAutoTable: { finalY: number } };
    yOffset = docWithTable.lastAutoTable.finalY + 10;
  }

  doc.save(`${filename}.pdf`);
}
