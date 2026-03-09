import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SeedTaxonomy() {
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [result, setResult] = useState(null);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u?.role !== 'admin') navigate(createPageUrl('Dashboard'));
      else { setUser(u); setChecking(false); }
    }).catch(() => navigate(createPageUrl('Dashboard')));
  }, []);

  if (checking || !user) return null;

  async function seedDatabase() {
    setSeeding(true);
    const results = { exams: 0, domains: 0, skills: 0, subjects: 0, units: 0 };

    try {
      // Create Exams
      const satExam = await base44.entities.Exam.create({ exam_type: 'SAT', name: 'SAT' });
      const actExam = await base44.entities.Exam.create({ exam_type: 'ACT', name: 'ACT' });
      results.exams = 2;

      // SAT Domains
      const satMathDomains = [
        { name: 'Algebra', section: 'Math', exam_id: satExam.id },
        { name: 'Advanced Math', section: 'Math', exam_id: satExam.id },
        { name: 'Problem-Solving and Data Analysis', section: 'Math', exam_id: satExam.id },
        { name: 'Geometry and Trigonometry', section: 'Math', exam_id: satExam.id }
      ];

      const satRWDomains = [
        { name: 'Information and Ideas', section: 'Reading & Writing', exam_id: satExam.id },
        { name: 'Craft and Structure', section: 'Reading & Writing', exam_id: satExam.id },
        { name: 'Expression of Ideas', section: 'Reading & Writing', exam_id: satExam.id },
        { name: 'Standard English Conventions', section: 'Reading & Writing', exam_id: satExam.id }
      ];

      for (const domain of [...satMathDomains, ...satRWDomains]) {
        await base44.entities.Domain.create(domain);
        results.domains++;
      }

      // ACT Domains
      const actDomains = [
        { name: 'Production of Writing', section: 'English', exam_id: actExam.id },
        { name: 'Knowledge of Language', section: 'English', exam_id: actExam.id },
        { name: 'Number & Quantity', section: 'Math', exam_id: actExam.id },
        { name: 'Algebra', section: 'Math', exam_id: actExam.id },
        { name: 'Functions', section: 'Math', exam_id: actExam.id },
        { name: 'Key Ideas and Details', section: 'Reading', exam_id: actExam.id },
        { name: 'Interpretation of Data', section: 'Science', exam_id: actExam.id }
      ];

      for (const domain of actDomains) {
        await base44.entities.Domain.create(domain);
        results.domains++;
      }

      // AP Subjects
      const apSubjects = [
        { name: 'AP Biology', subject_code: 'APBIO' },
        { name: 'AP Chemistry', subject_code: 'APCHEM' },
        { name: 'AP Physics 1', subject_code: 'APPHYS1' },
        { name: 'AP Calculus AB', subject_code: 'APCALCAB' },
        { name: 'AP Calculus BC', subject_code: 'APCALCBC' },
        { name: 'AP Statistics', subject_code: 'APSTATS' },
        { name: 'AP US History', subject_code: 'APUSH' },
        { name: 'AP World History', subject_code: 'APWH' },
        { name: 'AP English Language', subject_code: 'APLANG' },
        { name: 'AP English Literature', subject_code: 'APLIT' },
        { name: 'AP Computer Science A', subject_code: 'APCSA' },
        { name: 'AP Psychology', subject_code: 'APPSYCH' }
      ];

      for (const subject of apSubjects) {
        const created = await base44.entities.APSubject.create(subject);
        results.subjects++;

        // Create units for each subject (generic 1-9)
        for (let i = 1; i <= 9; i++) {
          await base44.entities.APUnit.create({
            name: `Unit ${i}`,
            subject_id: created.id,
            order_index: i,
            description: `Unit ${i} content`
          });
          results.units++;
        }
      }

      setResult({ success: true, ...results });
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setSeeding(false);
    }
  }

  return (
    <div className="min-h-screen bg-black py-16">
      <div className="max-w-4xl mx-auto px-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Dashboard'))}
          className="mb-8 text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">Seed Taxonomy</h1>
          <p className="text-neutral-400">Initialize SAT, ACT, and AP structure</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-medium text-white mb-4">What will be created:</h2>
          <div className="space-y-3 text-neutral-300">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-400" />
              <span>SAT and ACT exam records</span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-green-400" />
              <span>SAT domains (Algebra, Advanced Math, etc.)</span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <span>ACT domains (English, Math, Reading, Science)</span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-orange-400" />
              <span>12 AP subjects (Biology, Chemistry, Calculus, etc.)</span>
            </div>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-pink-400" />
              <span>9 units per AP subject (108 total units)</span>
            </div>
          </div>

          <Button
            onClick={seedDatabase}
            disabled={seeding}
            className="w-full mt-8 bg-white text-black hover:bg-neutral-100 py-6 text-lg"
          >
            {seeding ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Seeding Database...
              </>
            ) : (
              <>
                <Database className="w-5 h-5 mr-2" />
                Seed Taxonomy
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className={`rounded-2xl p-8 ${
            result.success 
              ? 'bg-green-900/20 border border-green-800' 
              : 'bg-red-900/20 border border-red-800'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-400" />
              )}
              <h3 className={`text-xl font-medium ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.success ? 'Taxonomy Seeded Successfully' : 'Seed Failed'}
              </h3>
            </div>

            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/50 rounded-xl p-4">
                  <div className="text-2xl font-semibold text-white mb-1">{result.exams}</div>
                  <div className="text-sm text-neutral-400">Exams</div>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4">
                  <div className="text-2xl font-semibold text-white mb-1">{result.domains}</div>
                  <div className="text-sm text-neutral-400">Domains</div>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4">
                  <div className="text-2xl font-semibold text-white mb-1">{result.subjects}</div>
                  <div className="text-sm text-neutral-400">AP Subjects</div>
                </div>
                <div className="bg-neutral-900/50 rounded-xl p-4 md:col-span-3">
                  <div className="text-2xl font-semibold text-white mb-1">{result.units}</div>
                  <div className="text-sm text-neutral-400">AP Units</div>
                </div>
              </div>
            )}

            {result.error && (
              <div className="text-sm text-red-300 bg-red-900/20 rounded-lg p-3">
                Error: {result.error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}