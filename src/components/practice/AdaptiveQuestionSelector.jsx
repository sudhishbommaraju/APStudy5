import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Target } from 'lucide-react';

export default function AdaptiveQuestionSelector({ examType, onStart }) {
  const [difficulty, setDifficulty] = useState('adaptive');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);

  useEffect(() => {
    loadSkills();
  }, [examType]);

  async function loadSkills() {
    try {
      const skills = await base44.entities.EngineSkill.list('', 20);
      setAvailableSkills(skills);
    } catch (error) {
      console.error('Failed to load skills:', error);
    }
  }

  function toggleSkill(skillId) {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  }

  async function startAdaptivePractice() {
    // Calculate adaptive difficulty based on user performance
    let adaptiveDifficulty = 3;
    
    if (difficulty === 'adaptive') {
      const user = await base44.auth.me();
      const skillPerf = await base44.entities.EngineUserSkillPerformance.filter({
        user_email: user.email
      }, '-accuracy', 10);

      if (skillPerf.length > 0) {
        const avgAccuracy = skillPerf.reduce((sum, s) => sum + s.accuracy, 0) / skillPerf.length;
        
        if (avgAccuracy >= 85) adaptiveDifficulty = 5;
        else if (avgAccuracy >= 70) adaptiveDifficulty = 4;
        else if (avgAccuracy >= 55) adaptiveDifficulty = 3;
        else if (avgAccuracy >= 40) adaptiveDifficulty = 2;
        else adaptiveDifficulty = 1;
      }
    } else {
      adaptiveDifficulty = parseInt(difficulty);
    }

    onStart({
      difficulty: adaptiveDifficulty,
      skills: selectedSkills,
      questionCount
    });
  }

  return (
    <Card className="bg-neutral-900 border-neutral-800 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold text-white">Adaptive Practice Settings</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-3">Difficulty Level</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button
            variant={difficulty === 'adaptive' ? 'default' : 'outline'}
            onClick={() => setDifficulty('adaptive')}
            className={difficulty === 'adaptive' ? 'bg-purple-600' : ''}
          >
            <Zap className="w-4 h-4 mr-2" />
            Adaptive
          </Button>
          {[1, 2, 3, 4, 5].map(level => (
            <Button
              key={level}
              variant={difficulty === level.toString() ? 'default' : 'outline'}
              onClick={() => setDifficulty(level.toString())}
            >
              Level {level}
            </Button>
          ))}
        </div>
        {difficulty === 'adaptive' && (
          <p className="text-xs text-neutral-400 mt-2">
            Difficulty will adjust based on your recent performance
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Focus Skills (optional)
        </label>
        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-neutral-800 rounded-lg">
          {availableSkills.map(skill => (
            <Badge
              key={skill.id}
              variant={selectedSkills.includes(skill.id) ? 'default' : 'outline'}
              className={`cursor-pointer ${
                selectedSkills.includes(skill.id) 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'hover:bg-neutral-700'
              }`}
              onClick={() => toggleSkill(skill.id)}
            >
              {skill.name}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-neutral-400 mt-2">
          {selectedSkills.length === 0 
            ? 'All skills will be included' 
            : `${selectedSkills.length} skill(s) selected`}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-300 mb-2">
          Number of Questions
        </label>
        <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
          <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5 Questions</SelectItem>
            <SelectItem value="10">10 Questions</SelectItem>
            <SelectItem value="15">15 Questions</SelectItem>
            <SelectItem value="20">20 Questions</SelectItem>
            <SelectItem value="30">30 Questions</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button 
        onClick={startAdaptivePractice}
        className="w-full bg-purple-600 hover:bg-purple-700"
        size="lg"
      >
        <Target className="w-5 h-5 mr-2" />
        Start Adaptive Practice
      </Button>
    </Card>
  );
}