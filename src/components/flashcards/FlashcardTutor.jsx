import TutorPanel from '@/components/tutor/TutorPanel';

/**
 * FlashcardTutor — thin wrapper around shared TutorPanel for flashcard mode.
 */
export default function FlashcardTutor({ question, isSubmitted }) {
  return (
    <TutorPanel
      questionText={question}
      isSubmitted={isSubmitted}
    />
  );
}