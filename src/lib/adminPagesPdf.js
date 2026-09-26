const PAGE_GROUPS = [
  {
    title: 'Pages publiques',
    items: [
      ['Accueil presentation', '/'],
      ['Landing lecteur', '/landing-lecteur'],
      ['Landing voyageur', '/landing-voyageur'],
      ['Landing relais', '/landing-relais'],
      ['Acces relais', '/relais'],
    ],
  },
  {
    title: 'Espace lecteur',
    items: [
      ['Catalogue', '/catalogue'],
      ['Etagere', '/etagere'],
      ['Bibliotheque', '/bibliotheque'],
      ['Wishlist', '/wishlist'],
      ['Favoris', '/favoris'],
      ['Progression collecte', '/progression-collecte'],
      ['Profil', '/profil'],
      ['Wallet', '/wallet'],
      ['Aide', '/aide'],
    ],
  },
  {
    title: 'Voyageur et relais',
    items: [
      ['Missions', '/missions'],
      ['Accueil voyageur', '/accueil-voyageur'],
      ['Stock relais', '/stock'],
      ['Scanner', '/scanner'],
      ['Profils relais', '/profils'],
    ],
  },
  {
    title: 'Administration',
    items: [
      ['Tableau de bord admin', '/admin'],
      ['Panel profil', '/panel-profil'],
    ],
  },
];

const clean = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const escapePdf = (value) => clean(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

function contentStream(lines) {
  const safeLines = lines.map(({ text, size = 12, x = 54, y }) =>
    `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET`
  );
  return safeLines.join('\n');
}

function buildPdf(pageStreams) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  const pageRefs = pageStreams.map((_, index) => `${4 + index * 2} 0 R`).join(' ');
  objects.push(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pageStreams.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  pageStreams.forEach((stream, index) => {
    const pageId = 4 + index * 2;
    const contentId = pageId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

export function downloadApplicationPagesPdf() {
  const origin = window.location.origin;
  const today = new Date().toLocaleDateString('fr-FR');
  const streams = [];

  streams.push(contentStream([
    { text: 'BORDERO', size: 28, y: 760 },
    { text: 'Document des pages de l application', size: 18, y: 724 },
    { text: `Genere le ${today}`, size: 11, y: 696 },
    { text: 'Ce PDF compile les espaces principaux, leurs routes et leurs liens directs.', size: 12, y: 652 },
    { text: `Application : ${origin}`, size: 12, y: 628 },
  ]));

  PAGE_GROUPS.forEach((group) => {
    const lines = [{ text: group.title, size: 20, y: 770 }];
    let y = 724;
    group.items.forEach(([label, path]) => {
      lines.push({ text: label, size: 14, y });
      lines.push({ text: `${origin}${path}`, size: 10, y: y - 18, x: 72 });
      y -= 54;
    });
    streams.push(contentStream(lines));
  });

  const blob = buildPdf(streams);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bordero-pages-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}