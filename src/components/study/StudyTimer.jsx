import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudyTimer({ examType, activityType, onSessionEnd }) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
      <Clock className="w-4 h-4 text-slate-600" />
      <span className="text-sm font-medium text-slate-700 tabular-nums">
        {formatTime(seconds)}
      </span>
      <button
        onClick={() => setIsActive(!isActive)}
        className="ml-1 p-1 hover:bg-slate-200 rounded-full transition-colors"
      >
        {isActive ? (
          <Pause className="w-3 h-3 text-slate-600" />
        ) : (
          <Play className="w-3 h-3 text-slate-600" />
        )}
      </button>
    </div>
  );
}