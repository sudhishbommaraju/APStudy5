// Pragmatic Markdown(+LaTeX math) -> LaTeX document exporter.
// Notes are generated as Markdown with $...$ / $$...$$ math; this wraps them
// into a compilable .tex article, converting the common Markdown constructs.

function escapeLatexText(line) {
  // Escape LaTeX specials in prose, but leave $...$ math spans untouched.
  const parts = line.split(/(\$[^$]*\$)/g);
  return parts
    .map((part) => {
      if (part.startsWith('$') && part.endsWith('$')) return part; // math, keep as-is
      return part
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/([&%#_{}])/g, '\\$1')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}')
        // inline markdown emphasis
        .replace(/\*\*([^*]+)\*\*/g, '\\textbf{$1}')
        .replace(/\*([^*]+)\*/g, '\\textit{$1}')
        .replace(/`([^`]+)`/g, '\\texttt{$1}');
    })
    .join('');
}

export function markdownToLatex(markdown, { title = 'Proofly Notes', subject = '' } = {}) {
  const lines = String(markdown || '').split('\n');
  const out = [];
  let inList = false;
  let inMathBlock = false;

  const closeList = () => {
    if (inList) {
      out.push('\\end{itemize}');
      inList = false;
    }
  };

  for (let raw of lines) {
    const line = raw.replace(/\s+$/, '');

    // Display math block $$...$$ on its own line(s)
    if (line.trim() === '$$') {
      inMathBlock = !inMathBlock;
      out.push(inMathBlock ? '\\[' : '\\]');
      continue;
    }
    if (inMathBlock) {
      out.push(line);
      continue;
    }
    const oneLineDisplay = line.trim().match(/^\$\$(.+)\$\$$/);
    if (oneLineDisplay) {
      closeList();
      out.push('\\[' + oneLineDisplay[1] + '\\]');
      continue;
    }

    if (line.trim() === '') {
      closeList();
      out.push('');
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      const cmd = ['section', 'subsection', 'subsubsection', 'paragraph'][level - 1];
      out.push(`\\${cmd}{${escapeLatexText(h[2])}}`);
      continue;
    }

    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) {
        out.push('\\begin{itemize}');
        inList = true;
      }
      out.push('  \\item ' + escapeLatexText(li[1]));
      continue;
    }

    closeList();
    out.push(escapeLatexText(line));
  }
  closeList();

  const body = out.join('\n');
  return `\\documentclass[11pt]{article}
\\usepackage[margin=1in]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\title{${title.replace(/([&%#_{}])/g, '\\$1')}}
\\author{${subject.replace(/([&%#_{}])/g, '\\$1')}}
\\date{\\today}
\\begin{document}
\\maketitle
${body}
\\end{document}
`;
}

export function downloadText(filename, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
