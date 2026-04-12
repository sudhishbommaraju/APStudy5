import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Pause, Play, Save, AlertCircle } from 'lucide-react';
import ExamTimer from './ExamTimer';

export default function ExamMode({ 
  children, 
  totalQuestions = 50, 
  timeLimitMinutes = 60,
  onSave = () => {},
  onComplete = () => {},
  examTitle = 'Practice Test'
}) {
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitMinutes * 60);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      if (!isPaused) {
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [onSave, isPaused]);

  // Countdown timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, onComplete]);

  const handlePauseToggle = () => {
    setIsPaused(!isPaused);
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    await onSave();
    setIsSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 9999,
    }}>
      {/* Header bar */}
      <div style={{
        padding: '12px 20px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            {examTitle}
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
            Full-screen exam mode
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Timer */}
          <ExamTimer secondsRemaining={remainingSeconds} />

          {/* Save indicator */}
          {isSaving && (
            <div style={{
              fontSize: 12, color: '#3b82f6',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: '50%',
                background: '#3b82f6',
                animation: 'pulse 2s infinite',
              }} />
              Saving...
            </div>
          )}

          {/* Manual save button */}
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: '1px solid #e2e8f0', background: '#ffffff',
              cursor: 'pointer', fontSize: 12, fontWeight: 500,
              color: '#64748b',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => {
              if (!isSaving) {
                e.currentTarget.style.background = '#f1f5f9';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Save size={14} />
            Save
          </button>

          {/* Pause/Resume button */}
          <button
            onClick={handlePauseToggle}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              border: 'none',
              background: isPaused ? '#fef08a' : '#dbeafe',
              color: isPaused ? '#92400e' : '#1e40af',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              transition: 'all 150ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            {isPaused ? (
              <>
                <Play size={14} />
                Resume
              </>
            ) : (
              <>
                <Pause size={14} />
                Pause
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {isPaused && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 32,
              maxWidth: 400,
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}>
              <div style={{
                width: 48, height: 48,
                background: '#fef08a',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <AlertCircle size={28} color='#92400e' />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                Exam Paused
              </h3>
              <p style={{
                fontSize: 14, color: '#64748b', margin: '0 0 20px',
                lineHeight: 1.6,
              }}>
                Your test is paused. Questions are hidden. Click Resume to continue.
              </p>
              <button
                onClick={handlePauseToggle}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  background: '#1e40af', color: '#ffffff',
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: 14,
                  transition: 'all 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1e3a8a'}
                onMouseLeave={e => e.currentTarget.style.background = '#1e40af'}
              >
                Resume Exam
              </button>
            </div>
          </div>
        )}

        {/* Question content - hidden when paused */}
        <div style={{ opacity: isPaused ? 0 : 1, pointerEvents: isPaused ? 'none' : 'auto' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}