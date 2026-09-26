import html2canvas from 'html2canvas';

const PAGE_GROUPS = [
  {
    title: 'Pages publiques',
    audience: 'Visiteurs',
    items: [
      ['Accueil presentation', '/', 'Promesse Bordero, positionnement et portes d entree.'],
      ['Landing lecteur', '/landing-lecteur', 'Parcours de commande et benefices lecteur.'],
      ['Landing voyageur', '/landing-voyageur', 'Recrutement des voyageurs et missions Express.'],
      ['Landing relais', '/landing-relais', 'Inscription et validation des commerces partenaires.'],
      ['Acces relais', '/relais', 'Entree alternative vers le parcours relais.'],
    ],
  },
  {
    title: 'Espace lecteur',
    audience: 'Lecteurs connectes',
    items: [
      ['Catalogue', '/catalogue', 'Recherche livre, destination, relais et panier.'],
      ['Etagere', '/etagere', 'Bibliotheque vivante et suivi des livres.'],
      ['Bibliotheque', '/bibliotheque', 'Alias de l etagere lecteur.'],
      ['Wishlist', '/wishlist', 'Livres souhaites et intentions d achat.'],
      ['Favoris', '/favoris', 'Selection personnelle et livres sauvegardes.'],
      ['Progression collecte', '/progression-collecte', 'Suivi Collecte Bordero cote lecteur.'],
      ['Profil', '/profil', 'Informations personnelles et historique.'],
      ['Wallet', '/wallet', 'Vue portefeuille et informations financieres.'],
      ['Aide', '/aide', 'Support et explications des parcours.'],
    ],
  },
  {
    title: 'Voyageur et relais',
    audience: 'Voyageurs et points relais',
    items: [
      ['Missions', '/missions', 'Liste des missions Express disponibles ou acceptees.'],
      ['Accueil voyageur', '/accueil-voyageur', 'Synthese voyageur, gains et preparation.'],
      ['Stock relais', '/stock', 'Gestion du stock et des commandes en relais.'],
      ['Scanner', '/scanner', 'Validation terrain par scan.'],
      ['Profils relais', '/profils', 'Profils et indicateurs relais.'],
    ],
  },
  {
    title: 'Administration',
    audience: 'Equipe Bordero',
    items: [
      ['Tableau de bord admin', '/admin', 'Pilotage, alertes, validations et export PDF.'],
      ['Panel profil', '/panel-profil', 'Vue profil historique et compatibilite.'],
    ],
  },
];

const C = { burgundy: '0.431 0.118 0.180', ivory: '0.953 0.910 0.824', gold: '0.780 0.631 0.353', ink: '0.118 0.102 0.094', orange: '0.761 0.255 0.047' };
const euro = (v) => `${Number(v || 0).toFixed(2).replace('.', ',')} EUR`;
const clean = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (v) => clean(v).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const txt = (text, x, y, size = 11, color = C.ink) => `${fill(color)} BT /F1 ${size} Tf ${x} ${y} Td (${esc(text)}) Tj ET`;
const fill = (rgb) => `${rgb} rg`;
const stroke = (rgb) => `${rgb} RG`;
const rect = (x, y, w, h, color) => `${fill(color)} ${x} ${y} ${w} ${h} re f`;
const border = (x, y, w, h, color) => `${stroke(color)} ${x} ${y} ${w} ${h} re S`;
const line = (x1, y1, x2, y2, color) => `${stroke(color)} ${x1} ${y1} m ${x2} ${y2} l S`;

function shell(title, page, total) {
  return [
    rect(0, 0, 595, 842, C.ivory),
    rect(0, 792, 595, 50, C.burgundy),
    txt('BORDERO', 42, 814, 18, C.ivory),
    txt(title, 342, 814, 10, C.ivory),
    line(42, 58, 553, 58, C.gold),
    txt(`Page ${page}/${total}`, 500, 36, 9),
  ];
}

function buildPdf(pageStreams) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>'];
  objects.push(`<< /Type /Pages /Kids [${pageStreams.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pageStreams.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pageStreams.forEach((stream, i) => {
    const pageId = 4 + i * 2;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((o, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(o => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function cover(origin, today) {
  return [
    rect(0, 0, 595, 842, C.ivory), rect(0, 0, 190, 842, C.burgundy), border(32, 92, 531, 658, C.gold),
    txt('BORDERO', 66, 702, 28, C.ivory), txt('DOSSIER COMPLET DES PAGES CAPTUREES', 224, 686, 18),
    txt('Export administrateur soigne', 224, 656, 12), txt(`Genere le ${today}`, 224, 632, 11),
    txt(`Application : ${origin}`, 224, 608, 10),
    txt('Contenu : routes, audiences, objectifs et indicateurs de pilotage.', 224, 560, 11),
    txt('Document pret a partager pour documentation interne Bordero.', 224, 540, 11),
  ].join('\n');
}

function statsPage(stats, page, total) {
  const cards = [
    ['CA jour', euro(stats?.caJour)], ['CA mois', euro(stats?.caMois)],
    ['Commandes filtrees', stats?.filteredCommandes?.length || 0], ['Bloquees > 48h', stats?.bloquees?.length || 0],
    ['Litiges', stats?.litiges?.length || 0], ['Profils a valider', stats?.profilsAttente || 0],
    ['Relais visibles', stats?.visibleRelays?.length || 0], ['Voyageurs actifs', stats?.voyageurs?.actifs || 0],
  ];
  const ops = shell('Indicateurs admin', page, total);
  ops.push(txt('Synthese de pilotage', 54, 744, 22), txt('Etat des donnees au moment de l export.', 54, 716, 11));
  cards.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 54 : 314;
    const y = 650 - Math.floor(i / 2) * 92;
    ops.push(rect(x, y, 228, 62, '0.980 0.945 0.870'), border(x, y, 228, 62, C.gold), txt(label, x + 18, y + 38, 10), txt(value, x + 18, y + 16, 18));
  });
  return ops.join('\n');
}

function groupPage(group, origin, page, total) {
  const ops = shell(group.title, page, total);
  ops.push(txt(group.title, 54, 744, 21), txt(`Audience : ${group.audience}`, 54, 718, 11), line(54, 696, 541, 696, C.gold));
  let y = 662;
  group.items.forEach(([label, path, description], index) => {
    ops.push(rect(54, y - 34, 487, 50, index % 2 ? '0.965 0.920 0.835' : '0.990 0.960 0.900'));
    ops.push(border(54, y - 34, 487, 50, '0.780 0.631 0.353'));
    ops.push(txt(label, 72, y, 13), txt(description, 72, y - 17, 9), txt(`${origin}${path}`, 336, y - 17, 8));
    y -= 62;
  });
  return ops.join('\n');
}

function openExportBlob(blob, filename, previewWindow) {
  const url = URL.createObjectURL(blob);
  const target = previewWindow && !previewWindow.closed ? previewWindow : window.open('', '_blank');

  if (target) {
    target.document.title = filename;
    target.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 120000);
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 120000);
}

function renderCard(parent, title, subtitle, rows = []) {
  const card = document.createElement('section');
  card.style.cssText = 'width:1080px;min-height:1520px;background:#F3E8D2;color:#1E1A18;padding:72px;box-sizing:border-box;font-family:Georgia,serif;border-bottom:18px solid #6E1E2E;position:relative;';
  card.innerHTML = `
    <div style="height:92px;background:#6E1E2E;color:#F3E8D2;margin:-72px -72px 62px;padding:28px 72px;box-sizing:border-box;font:700 34px Georgia,serif;letter-spacing:4px;">BORDERO</div>
    <h1 style="margin:0;color:#6E1E2E;font-size:48px;line-height:1.1;">${clean(title)}</h1>
    <p style="margin:18px 0 42px;color:#3B2A23;font-size:24px;">${clean(subtitle)}</p>
  `;
  rows.forEach((row, index) => {
    const item = document.createElement('div');
    item.style.cssText = `margin:0 0 22px;padding:26px 30px;background:${index % 2 ? '#F7EEDC' : '#FFF7E6'};border:2px solid #C7A15A;border-radius:22px;box-shadow:0 12px 28px rgba(59,42,35,.10);`;
    item.innerHTML = `<strong style="display:block;color:#6E1E2E;font-size:27px;margin-bottom:8px;">${clean(row[0])}</strong><span style="display:block;font-size:20px;color:#3B2A23;line-height:1.35;">${clean(row[1])}</span>${row[2] ? `<small style="display:block;margin-top:10px;color:#6E1E2E;font-size:16px;font-family:Arial,sans-serif;">${clean(row[2])}</small>` : ''}`;
    card.appendChild(item);
  });
  parent.appendChild(card);
}

function buildPngSource(stats) {
  const origin = window.location.origin;
  const today = new Date().toLocaleDateString('fr-FR');
  const root = document.createElement('div');
  root.style.cssText = 'position:fixed;left:-12000px;top:0;width:1080px;background:#F3E8D2;z-index:-1;';

  renderCard(root, 'Dossier complet des pages capturées', `Export administrateur généré le ${today}`, [
    ['Application', origin],
    ['Contenu', 'Routes, audiences, objectifs et indicateurs de pilotage.'],
    ['Usage', 'Document prêt à partager pour documentation interne Bordero.'],
  ]);

  renderCard(root, 'Indicateurs admin', 'État des données au moment de l export.', [
    ['CA jour', euro(stats?.caJour)], ['CA mois', euro(stats?.caMois)],
    ['Commandes filtrées', stats?.filteredCommandes?.length || 0], ['Bloquées > 48h', stats?.bloquees?.length || 0],
    ['Litiges', stats?.litiges?.length || 0], ['Profils à valider', stats?.profilsAttente || 0],
    ['Relais visibles', stats?.visibleRelays?.length || 0], ['Voyageurs actifs', stats?.voyageurs?.actifs || 0],
  ]);

  PAGE_GROUPS.forEach(group => renderCard(root, group.title, `Audience : ${group.audience}`, group.items.map(([label, path, description]) => [label, description, `${origin}${path}`])));

  document.body.appendChild(root);
  return root;
}

export function downloadApplicationPagesPdf({ stats } = {}) {
  const origin = window.location.origin;
  const today = new Date().toLocaleDateString('fr-FR');
  const total = PAGE_GROUPS.length + 2;
  const streams = [cover(origin, today), statsPage(stats, 2, total), ...PAGE_GROUPS.map((group, i) => groupPage(group, origin, i + 3, total))];
  const blob = buildPdf(streams);
  openExportBlob(blob, `bordero-dossier-pages-capturees-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function downloadApplicationPagesPng({ stats } = {}) {
  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write('<p style="font-family:Arial;padding:24px;color:#6E1E2E;">Préparation du PNG Bordero…</p>');
  }

  const source = buildPngSource(stats);
  const canvas = await html2canvas(source, { backgroundColor: '#F3E8D2', scale: 1, useCORS: true });
  source.remove();

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.96));
  openExportBlob(blob, `bordero-dossier-pages-capturees-${new Date().toISOString().slice(0, 10)}.png`, previewWindow);
}