import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, BookOpen, Target, FileText, TrendingUp } from 'lucide-react';

export default function APStudyKit() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [units, setUnits] = useState([]);
  const [unitProgress, setUnitProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadUnits();
      loadProgress();
    }
  }, [selectedSubject]);

  async function loadSubjects() {
    const apSubjects = await base44.entities.APSubject.list();
    setSubjects(apSubjects);
    setLoading(false);
  }

  async function loadUnits() {
    const subjectUnits = await base44.entities.APUnit.filter({
      subject_id: selectedSubject
    });
    const sorted = subjectUnits.sort((a, b) => a.order_index - b.order_index);
    setUnits(sorted);
  }

  async function loadProgress() {
    const user = await base44.auth.me();
    const skills = await base44.entities.EngineSkill.list();
    const performance = await base44.entities.EngineUserSkillPerformance.filter({
      user_email: user.email
    });

    const progress = {};
    for (const unit of units) {
      const unitSkills = skills.filter(s => s.unit_id === unit.id);
      const unitPerformance = performance.filter(p => 
        unitSkills.some(s => s.id === p.skill_id)
      );

      if (unitPerformance.length > 0) {
        const avgAccuracy = unitPerformance.reduce((sum, p) => sum + p.accuracy, 0) / unitPerformance.length;
        progress[unit.id] = {
          mastery: avgAccuracy,
          attempted: unitPerformance.length,
          total: unitSkills.length
        };
      } else {
        progress[unit.id] = {
          mastery: 0,
          attempted: 0,
          total: unitSkills.length
        };
      }
    }

    setUnitProgress(progress);
  }

  function startUnitPractice(unitId) {
    navigate(createPageUrl('APUnitPractice') + `?unit=${unitId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading AP Study Kit...</div>
      </div>
    );
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
          Back to Dashboard
        </Button>

        <div className="mb-12">
          <h1 className="text-3xl font-light text-white mb-2">AP Study Kit</h1>
          <p className="text-neutral-400">Master AP exams with structured unit-by-unit practice</p>
        </div>

        {/* Subject Selection */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-medium text-white mb-6">Select AP Subject</h2>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="bg-black border-neutral-700 text-white">
              <SelectValue placeholder="Choose an AP subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Units Display */}
        {selectedSubject && units.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white mb-6">Course Units</h2>
            {units.map((unit) => {
              const progress = unitProgress[unit.id] || { mastery: 0, attempted: 0, total: 0 };
              return (
                <div
                  key={unit.id}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white mb-2">
                        Unit {unit.order_index}: {unit.name}
                      </h3>
                      <p className="text-sm text-neutral-400">{unit.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-semibold text-white mb-1">
                        {progress.mastery.toFixed(0)}%
                      </div>
                      <div className="text-xs text-neutral-400">Mastery</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-neutral-400 mb-2">
                      <span>Progress</span>
                      <span>{progress.attempted}/{progress.total} skills practiced</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${progress.mastery}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => startUnitPractice(unit.id)}
                    className="w-full bg-white text-black hover:bg-neutral-100"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Practice This Unit
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {selectedSubject && units.length === 0 && (
          <div className="text-center py-12 text-neutral-400">
            No units available for this subject yet
          </div>
        )}
      </div>
    </div>
  );
}