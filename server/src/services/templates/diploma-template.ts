export interface DiplomaTemplateData {
  studentName: string
  documentNumber: string
  trackName: string
  issueDate: string
  grade: number
  referenceCode: string
}

export function renderDiplomaHtml(data: DiplomaTemplateData): string {
  const { studentName, documentNumber, trackName, issueDate, grade, referenceCode } = data;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Georgia', 'Times New Roman', serif;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 25mm 20mm;
    position: relative;
  }
  .gold-border {
    position: absolute;
    top: 15mm; left: 15mm; right: 15mm; bottom: 15mm;
    border: 3px solid #D4A843;
    pointer-events: none;
  }
  .inner-border {
    position: absolute;
    top: 18mm; left: 18mm; right: 18mm; bottom: 18mm;
    border: 1px solid #D4A843;
    pointer-events: none;
  }
  .header {
    text-align: center;
    margin-bottom: 30mm;
    padding-top: 15mm;
  }
  .header .ministry {
    font-size: 11px;
    color: #666;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 8mm;
  }
  .header .university {
    font-size: 22px;
    font-weight: bold;
    color: #1B4F8A;
    letter-spacing: 1px;
    margin-bottom: 4mm;
  }
  .header .subtitle {
    font-size: 13px;
    color: #888;
    font-style: italic;
  }
  .separator {
    width: 60mm;
    height: 1px;
    background: #D4A843;
    margin: 8mm auto;
  }
  .body-content {
    text-align: center;
    padding: 0 10mm;
  }
  .body-content .label {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin-bottom: 6mm;
  }
  .body-content .student-name {
    font-size: 28px;
    font-weight: bold;
    color: #1B4F8A;
    margin-bottom: 4mm;
    letter-spacing: 0.5px;
  }
  .body-content .document {
    font-size: 12px;
    color: #666;
    margin-bottom: 8mm;
  }
  .body-content .certifies {
    font-size: 12px;
    color: #888;
    font-style: italic;
    margin-bottom: 6mm;
  }
  .body-content .track-name {
    font-size: 18px;
    font-weight: bold;
    color: #2B6DAE;
    margin-bottom: 8mm;
    line-height: 1.4;
  }
  .body-content .grade {
    font-size: 14px;
    color: #1a1a1a;
    margin-bottom: 8mm;
  }
  .body-content .grade .number {
    font-size: 22px;
    font-weight: bold;
    color: #D4A843;
  }
  .footer {
    position: absolute;
    bottom: 25mm;
    left: 20mm;
    right: 20mm;
  }
  .footer .date {
    text-align: center;
    font-size: 11px;
    color: #888;
    margin-bottom: 8mm;
  }
  .footer .signature-line {
    width: 50mm;
    height: 1px;
    background: #999;
    margin: 0 auto 3mm;
  }
  .footer .signature-label {
    text-align: center;
    font-size: 10px;
    color: #999;
  }
  .footer .verification {
    text-align: center;
    margin-top: 10mm;
    padding-top: 6mm;
    border-top: 1px solid #ddd;
    font-size: 9px;
    color: #aaa;
  }
  .footer .verification code {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    color: #2B6DAE;
    background: #f0f4f8;
    padding: 2px 6px;
    border-radius: 3px;
  }
</style>
</head>
<body>
<div class="page">
  <div class="gold-border"></div>
  <div class="inner-border"></div>

  <div class="header">
    <div class="ministry">Ministerio de Educación</div>
    <div class="university">Universidad Nacional de Córdoba</div>
    <div class="subtitle">Diploma Tracking System</div>
  </div>

  <div class="separator"></div>

  <div class="body-content">
    <div class="label">Certifica que</div>
    <div class="student-name">${escapeHtml(studentName)}</div>
    <div class="document">DNI: ${escapeHtml(documentNumber)}</div>
    <div class="certifies">ha completado satisfactoriamente la</div>
    <div class="track-name">${escapeHtml(trackName)}</div>
    <div class="grade">
      Calificación obtenida: <span class="number">${grade}/10</span>
    </div>
  </div>

  <div class="separator" style="margin-top: 12mm;"></div>

  <div class="footer">
    <div class="date">Córdoba, ${escapeHtml(issueDate)}</div>
    <div class="signature-line"></div>
    <div class="signature-label">Dirección de Educación Continua</div>
    <div class="verification">
      Verifique este documento en: diplomatrackingsystem.qzz.io/verify<br>
      Código de verificación: <code>${escapeHtml(referenceCode)}</code>
    </div>
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
