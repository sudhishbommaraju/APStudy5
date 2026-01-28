import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { generateLatexDocument, examToLatex, downloadLatexFile, createLicenseFooter } from '@/components/utils/LatexExporter';

export default function ExamExporter({ exam, questions, answers, showSolutions = false }) {
  const exportExamOnly = () => {
    const latexBody = examToLatex(exam, questions, answers, false);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), exam.subject_name || 'Exam');
    downloadLatexFile(fullLatex, `${exam.subject_name || 'exam'}_questions.tex`);
  };

  const exportWithSolutions = () => {
    const latexBody = examToLatex(exam, questions, answers, true);
    const fullLatex = generateLatexDocument(latexBody + createLicenseFooter(), exam.subject_name + ' - Solutions');
    downloadLatexFile(fullLatex, `${exam.subject_name || 'exam'}_with_solutions.tex`);
  };

  return (
    <div className="flex gap-3">
      <Button
        onClick={exportExamOnly}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        Export Exam (.tex)
      </Button>
      {showSolutions && (
        <Button
          onClick={exportWithSolutions}
          variant="outline"
          size="sm"
        >
          <FileText className="w-4 h-4 mr-2" />
          With Solutions (.tex)
        </Button>
      )}
    </div>
  );
}