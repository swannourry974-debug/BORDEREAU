import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const stamp = () => new Date().toISOString().slice(0, 10);

export async function downloadCanvasPng(element) {
  const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#F5E6CC', useCORS: true });
  const link = document.createElement('a');
  link.download = `dossier-canvas-bordero-${stamp()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadCanvasPdf(sections) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  for (let index = 0; index < sections.length; index += 1) {
    const canvas = await html2canvas(sections[index], { scale: 2, backgroundColor: '#F5E6CC', useCORS: true });
    const img = canvas.toDataURL('image/png');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    if (index > 0) pdf.addPage();
    pdf.addImage(img, 'PNG', (pageWidth - width) / 2, (pageHeight - height) / 2, width, height);
  }
  pdf.save(`dossier-canvas-bordero-${stamp()}.pdf`);
}