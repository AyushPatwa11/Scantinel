import jsPDF from 'jspdf';
import 'jspdf-autotable';

const C = {
  bg:     [6,   8,  16],
  bg2:    [13,  16,  32],
  bg3:    [23,  28,  53],
  text1:  [226, 228, 240],
  text2:  [144, 152, 192],
  text3:  [84,  92, 136],
  accent: [91, 115, 255],
  crit:   [255,  58,  92],
  high:   [255, 107,  53],
  med:    [245, 166,  35],
  low:    [54,  212, 183],
  safe:   [46,  213, 122],
  info:   [123, 143, 255],
  white:  [255, 255, 255]
};

const SEV_COLOR = {
  critical: C.crit,
  high:     C.high,
  medium:   C.med,
  low:      C.low,
  info:     C.info
};

const GRADE_COLOR = { A: C.safe, B: [34,211,238], C: C.med, D: C.high, F: C.crit };

function setFill(doc, rgb)   { doc.setFillColor(rgb[0], rgb[1], rgb[2]); }
function setDraw(doc, rgb)   { doc.setDrawColor(rgb[0], rgb[1], rgb[2]); }
function setFont(doc, rgb)   { doc.setTextColor(rgb[0], rgb[1], rgb[2]); }
function rect(doc, x, y, w, h, rgb, style='F') { setFill(doc, rgb); doc.rect(x, y, w, h, style); }
function rRect(doc, x, y, w, h, rgb, r=3, style='F') { setFill(doc, rgb); doc.roundedRect(x, y, w, h, r, r, style); }

function addPage(doc) {
  doc.addPage();
  rect(doc, 0, 0, 210, 297, C.bg);
  return 20;
}

function checkPageBreak(doc, y, needed=30) {
  if (y + needed > 275) return addPage(doc);
  return y;
}

export function generatePDFReport(scan) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, M = 16, IW = W - M * 2;
  const now = new Date();

  // ── Cover page ─────────────────────────────────────────────────────────────
  rect(doc, 0, 0, W, 297, C.bg);

  // Top accent bar
  rect(doc, 0, 0, W, 1.2, C.accent);

  // Brand
  setFont(doc, C.accent);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('SCANTINEL', M, 20);
  setFont(doc, C.text3);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Security Intelligence Platform  v2.0', M, 26);

  // Title
  setFont(doc, C.text1);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Security', M, 75);
  doc.text('Assessment', M, 88);
  doc.text('Report', M, 101);

  // Decorative accent block
  rect(doc, W - 70, 55, 60, 60, C.bg2);
  setFill(doc, C.accent);
  doc.setFillColor(91, 115, 255, 0.15);
  doc.rect(W - 70, 55, 60, 60, 'F');

  // Grade circle
  const gc = GRADE_COLOR[scan.summary?.grade] || C.accent;
  setFill(doc, gc);
  doc.circle(W - 40, 85, 20, 'F');
  setFont(doc, C.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(scan.summary?.grade || 'N/A', W - 40, 88, { align: 'center' });
  setFont(doc, C.text2);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('SECURITY GRADE', W - 40, 96, { align: 'center' });

  // Divider
  rect(doc, M, 115, IW, 0.4, C.bg3);

  // Meta info
  const meta = [
    ['Target URL', scan.url],
    ['Scan Date', now.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })],
    ['Scan Time', now.toLocaleTimeString()],
    ['Report ID', scan.scanId?.slice(0,8).toUpperCase() || 'N/A'],
    ['Status', scan.status?.toUpperCase() || 'N/A']
  ];

  let y = 125;
  meta.forEach(([k, v]) => {
    setFont(doc, C.text3);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(k.toUpperCase(), M, y);
    setFont(doc, C.text1);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const truncated = v.length > 50 ? v.slice(0, 47) + '...' : v;
    doc.text(truncated, M + 38, y);
    y += 10;
  });

  // Risk summary boxes
  rect(doc, M, 185, IW, 0.4, C.bg3);
  y = 195;
  setFont(doc, C.text2);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK SUMMARY', M, y);

  y += 6;
  const boxes = [
    { label: 'Critical', val: scan.summary?.critical || 0, color: C.crit },
    { label: 'High',     val: scan.summary?.high     || 0, color: C.high },
    { label: 'Medium',   val: scan.summary?.medium   || 0, color: C.med  },
    { label: 'Low',      val: scan.summary?.low      || 0, color: C.low  },
    { label: 'Info',     val: scan.summary?.info     || 0, color: C.info }
  ];
  const bw = (IW - 16) / 5;
  boxes.forEach((b, i) => {
    const x = M + i * (bw + 4);
    rRect(doc, x, y, bw, 22, C.bg3, 2);
    setFill(doc, b.color);
    doc.rect(x, y, 2, 22, 'F');
    setFont(doc, b.color);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(String(b.val), x + bw / 2, y + 12, { align: 'center' });
    setFont(doc, C.text3);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(b.label, x + bw / 2, y + 19, { align: 'center' });
  });

  // Score bar
  y += 36;
  const score = scan.summary?.riskScore || 0;
  setFont(doc, C.text2);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RISK SCORE', M, y);
  setFont(doc, C.text1);
  doc.setFontSize(7.5);
  doc.text(`${score}/100  (${scan.summary?.riskLevel || 'N/A'})`, W - M, y, { align: 'right' });
  y += 5;
  rect(doc, M, y, IW, 5, C.bg3);
  const scoreColor = score >= 75 ? C.safe : score >= 50 ? C.med : C.crit;
  rect(doc, M, y, IW * (score / 100), 5, scoreColor);

  // Footer
  setFont(doc, C.text3);
  doc.setFontSize(6.5);
  doc.text('CONFIDENTIAL — For authorized use only', W / 2, 285, { align: 'center' });
  rect(doc, 0, 295, W, 2, C.accent);

  // ── Page 2: Open Ports ─────────────────────────────────────────────────────
  if (scan.openPorts?.length > 0) {
    y = addPage(doc);
    rect(doc, 0, 0, W, 1.2, C.accent);

    setFont(doc, C.accent);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SCANTINEL', M, 10);

    setFont(doc, C.text1);
    doc.setFontSize(16);
    doc.text('Open Ports & Services', M, y);
    y += 10;

    const portRows = scan.openPorts.map(p => [
      String(p.port),
      p.protocol?.toUpperCase() || 'TCP',
      p.service || 'Unknown',
      p.state?.toUpperCase() || 'OPEN',
      p.risk?.toUpperCase() || 'UNKNOWN'
    ]);

    doc.autoTable({
      startY: y,
      head: [['PORT', 'PROTO', 'SERVICE', 'STATE', 'RISK LEVEL']],
      body: portRows,
      theme: 'plain',
      headStyles: {
        fillColor: C.bg3,
        textColor: C.text3,
        fontStyle: 'bold',
        fontSize: 7.5,
        cellPadding: 4
      },
      bodyStyles: {
        fillColor: C.bg2,
        textColor: C.text1,
        fontSize: 8.5,
        cellPadding: 4
      },
      alternateRowStyles: { fillColor: C.bg3 },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: C.accent },
        4: { fontStyle: 'bold' }
      },
      margin: { left: M, right: M },
      didParseCell(data) {
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.text[0]?.toLowerCase();
          const colors = { critical: C.crit, high: C.high, medium: C.med, low: C.low, safe: C.safe };
          if (colors[val]) data.cell.styles.textColor = colors[val];
        }
      }
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // ── Pages 3+: Findings ─────────────────────────────────────────────────────
  if (scan.findings?.length > 0) {
    y = addPage(doc);
    rect(doc, 0, 0, W, 1.2, C.accent);
    setFont(doc, C.accent);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('SCANTINEL', M, 10);

    setFont(doc, C.text1);
    doc.setFontSize(16);
    doc.text('Security Findings', M, y);
    y += 4;
    setFont(doc, C.text3);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${scan.findings.length} total findings sorted by severity`, M, y + 5);
    y += 14;

    const order = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    const sorted = [...scan.findings].sort((a, b) => (order[a.severity] ?? 5) - (order[b.severity] ?? 5));

    sorted.forEach((finding, idx) => {
      const sevColor = SEV_COLOR[finding.severity] || C.info;
      const descLines = doc.splitTextToSize(finding.description || '', IW - 10);
      const recLines  = doc.splitTextToSize(finding.recommendation || '', IW - 10);
      const evidLines = finding.evidence ? doc.splitTextToSize(`Evidence: ${finding.evidence}`, IW - 10) : [];

      const needed = 18 + (descLines.length * 4.2) + (recLines.length * 4.2) + (evidLines.length * 4) + 14;
      y = checkPageBreak(doc, y, needed);

      // Card bg
      rRect(doc, M, y, IW, needed - 4, C.bg2, 3);
      // Severity left stripe
      rect(doc, M, y, 3, needed - 4, sevColor);

      // Severity badge
      rRect(doc, M + 7, y + 4, 28, 6, sevColor, 2);
      setFont(doc, C.bg);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.severity.toUpperCase(), M + 7 + 14, y + 8.2, { align: 'center' });

      // Category
      if (finding.category) {
        setFont(doc, C.text3);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.text(finding.category.toUpperCase(), M + 40, y + 8.2);
      }

      // CVSS
      if (finding.cvss) {
        setFont(doc, C.text2);
        doc.setFontSize(6.5);
        doc.text(`CVSS ${finding.cvss.toFixed(1)}`, W - M - 4, y + 8.2, { align: 'right' });
      }

      // Title
      setFont(doc, C.text1);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'bold');
      doc.text(finding.title, M + 7, y + 17);

      let fy = y + 23;

      // Description
      setFont(doc, C.text2);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(descLines, M + 7, fy);
      fy += descLines.length * 4.2 + 4;

      // Recommendation label
      setFont(doc, sevColor);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('HOW TO FIX:', M + 7, fy);
      fy += 4.5;

      setFont(doc, C.text1);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(recLines, M + 7, fy);
      fy += recLines.length * 4.2;

      // Evidence
      if (evidLines.length > 0) {
        fy += 2;
        setFont(doc, C.text3);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'italic');
        doc.text(evidLines, M + 7, fy);
      }

      y += needed + 3;
    });
  }

  // ── Footer on all pages ────────────────────────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    setFont(doc, C.text3);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Scantinel Security Report  ·  ${scan.url}  ·  Page ${i} of ${total}`, W / 2, 290, { align: 'center' });
  }

  const filename = `Scantinel-${scan.url.replace(/[^a-z0-9]/gi, '-').slice(0, 40)}-${Date.now()}.pdf`;
  doc.save(filename);
}
