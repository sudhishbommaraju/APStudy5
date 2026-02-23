import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, FileText, CheckCircle } from 'lucide-react';

export default function NotionSetupGuide() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('NotionSync'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sync
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Notion Database Setup Guide</h1>
          <p className="text-neutral-400">Complete structure for Proofly Question Bank</p>
        </div>

        {/* Step 1 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">1</div>
            <div>
              <h2 className="text-xl font-medium text-white mb-2">Create Notion Database</h2>
              <p className="text-neutral-400 mb-4">In Notion, create a new database named: <span className="text-white font-mono">Proofly Question Bank</span></p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">2</div>
            <div className="flex-1">
              <h2 className="text-xl font-medium text-white mb-4">Add Database Properties</h2>
              
              <div className="space-y-4">
                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Question ID</div>
                  <div className="text-xs text-neutral-400">Type: Text • Example: "SAT-MATH-001"</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Exam</div>
                  <div className="text-xs text-neutral-400">Type: Select • Options: SAT, ACT, AP</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Subject</div>
                  <div className="text-xs text-neutral-400">Type: Select • For AP: "AP Biology", "AP Calculus AB", etc.</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Section</div>
                  <div className="text-xs text-neutral-400">Type: Select • SAT: "Math", "Reading & Writing" | ACT: "English", "Math", "Reading", "Science"</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Domain</div>
                  <div className="text-xs text-neutral-400">Type: Text • SAT Math: "Algebra", "Geometry", etc.</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Unit</div>
                  <div className="text-xs text-neutral-400">Type: Text • For AP: "Unit 1", "Unit 2", etc.</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Skill</div>
                  <div className="text-xs text-neutral-400">Type: Text • Specific skill tested</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Difficulty</div>
                  <div className="text-xs text-neutral-400">Type: Number • Range: 1-5</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Question Type</div>
                  <div className="text-xs text-neutral-400">Type: Select • Options: MCQ, FRQ</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Stem</div>
                  <div className="text-xs text-neutral-400">Type: Rich Text • Question text (use LaTeX: $x^2$ or $$\frac{'{'a'}{'}{b}$$)</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Choice A, Choice B, Choice C, Choice D</div>
                  <div className="text-xs text-neutral-400">Type: Text • Answer choices (LaTeX supported)</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Correct Answer</div>
                  <div className="text-xs text-neutral-400">Type: Select • Options: A, B, C, D</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Explanation</div>
                  <div className="text-xs text-neutral-400">Type: Rich Text • Detailed explanation</div>
                </div>

                <div className="bg-neutral-800/50 rounded-lg p-4">
                  <div className="font-mono text-sm text-blue-400 mb-2">Is Active</div>
                  <div className="text-xs text-neutral-400">Type: Checkbox • Toggle to show/hide questions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">3</div>
            <div>
              <h2 className="text-xl font-medium text-white mb-4">LaTeX Formatting Examples</h2>
              
              <div className="bg-neutral-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-neutral-400 mb-2">Inline Math:</div>
                <code className="text-blue-400 text-sm">If $x = 5$, what is $x^2$?</code>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4 mb-4">
                <div className="text-sm text-neutral-400 mb-2">Block Math:</div>
                <code className="text-blue-400 text-sm">$$\frac{'{'x^2 + 3x + 2'}{'}{x + 1}$$</code>
              </div>

              <div className="bg-neutral-800 rounded-lg p-4">
                <div className="text-sm text-neutral-400 mb-2">Mixed:</div>
                <code className="text-blue-400 text-sm">{"Solve for $x$: $$x^2 - 5x + 6 = 0$$"}</code>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold">4</div>
            <div>
              <h2 className="text-xl font-medium text-white mb-4">Example Question Entry</h2>
              
              <div className="space-y-3 text-sm">
                <div><span className="text-neutral-400">Question ID:</span> <span className="text-white">SAT-MATH-ALG-001</span></div>
                <div><span className="text-neutral-400">Exam:</span> <span className="text-white">SAT</span></div>
                <div><span className="text-neutral-400">Section:</span> <span className="text-white">Math</span></div>
                <div><span className="text-neutral-400">Domain:</span> <span className="text-white">Algebra</span></div>
                <div><span className="text-neutral-400">Skill:</span> <span className="text-white">Linear Equations</span></div>
                <div><span className="text-neutral-400">Difficulty:</span> <span className="text-white">3</span></div>
                <div><span className="text-neutral-400">Question Type:</span> <span className="text-white">MCQ</span></div>
                <div><span className="text-neutral-400">Stem:</span> <span className="text-white">If $2x + 5 = 13$, what is the value of $x$?</span></div>
                <div><span className="text-neutral-400">Choice A:</span> <span className="text-white">2</span></div>
                <div><span className="text-neutral-400">Choice B:</span> <span className="text-white">4</span></div>
                <div><span className="text-neutral-400">Choice C:</span> <span className="text-white">6</span></div>
                <div><span className="text-neutral-400">Choice D:</span> <span className="text-white">8</span></div>
                <div><span className="text-neutral-400">Correct Answer:</span> <span className="text-green-400">B</span></div>
                <div><span className="text-neutral-400">Explanation:</span> <span className="text-white">Subtract 5 from both sides: $2x = 8$. Divide by 2: $x = 4$</span></div>
                <div><span className="text-neutral-400">Is Active:</span> <span className="text-white">✓</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-red-900/20 border border-red-800 rounded-2xl p-8">
          <h3 className="text-red-400 font-medium mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            CRITICAL: Compliance Requirements
          </h3>
          <div className="text-sm text-red-300/70 space-y-2">
            <p>• NEVER copy official College Board question text</p>
            <p>• NEVER scrape or ingest copyrighted exam materials</p>
            <p>• ALL questions must be original Proofly-generated content</p>
            <p>• Align to official skill taxonomies, but create new questions</p>
            <p>• Use AI to generate questions, not to reproduce existing ones</p>
          </div>
        </div>
      </div>
    </div>
  );
}