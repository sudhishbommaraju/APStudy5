import { jsPDF } from 'jspdf';

export function exportNoteToPDF(note) {
  const nd = note.notes_data || {};
  const doc = new jsPDF();
  
  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  
  // Helper to add text with wrapping
  const addWrappedText = (text, fontSize, isBold = false, color = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach(line => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += fontSize / 2.5;
    });
  };
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(note.title, maxWidth);
  titleLines.forEach(line => {
    doc.text(line, margin, yPosition);
    yPosition += 8;
  });
  yPosition += 5;
  
  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString()} | Source: ${note.source_type === 'youtube' ? '📺 YouTube' : note.source_type === 'upload' ? '📄 Upload' : '✨ AI Generated'}`, margin, yPosition);
  yPosition += 8;
  
  // Horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Summary
  const summaryBullets = Array.isArray(nd.summary) ? nd.summary : (nd.summary ? [nd.summary] : []);
  if (summaryBullets.length > 0) {
    addWrappedText('Summary', 14, true, [37, 99, 235]);
    yPosition += 3;
    summaryBullets.forEach(bullet => {
      addWrappedText(`• ${bullet}`, 11);
      yPosition += 2;
    });
    yPosition += 5;
  }
  
  // Sections
  const sections = nd.sections || [];
  sections.forEach(section => {
    addWrappedText(section.title, 13, true, [0, 0, 0]);
    yPosition += 3;
    
    const bullets = section.bullets || section.content || [];
    bullets.forEach(bullet => {
      addWrappedText(`• ${bullet}`, 11);
      yPosition += 2;
    });
    yPosition += 5;
  });
  
  // Key Terms
  const keyTerms = nd.keyTerms || [];
  if (keyTerms.length > 0) {
    addWrappedText('Key Terms', 14, true, [67, 56, 202]);
    yPosition += 3;
    
    keyTerms.forEach(k => {
      const term = typeof k === 'string' ? k : k.term;
      const def = typeof k === 'string' ? '' : k.definition;
      
      if (def) {
        addWrappedText(`${term}: ${def}`, 11);
      } else {
        addWrappedText(term, 11);
      }
      yPosition += 3;
    });
  }
  
  // Save PDF
  doc.save(`${note.title}.pdf`);
}