import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';

const LIMITS = {
  daily_practice_count: 5,
  daily_exam_count: 3,
  daily_tutor_count: 5,
  daily_notes_count: 5,
};

export async function checkAndResetCredits(user) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  if (user.plan === 'pro') {
    return { canProceed: true, user };
  }
  
  // Reset if new day
  if (user.last_reset_date !== today) {
    const updatedUser = await base44.auth.updateMe({
      daily_practice_count: 0,
      daily_exam_count: 0,
      daily_tutor_count: 0,
      daily_notes_count: 0,
      last_reset_date: today,
    });
    return { canProceed: true, user: updatedUser };
  }
  
  return { canProceed: true, user };
}

export async function checkCredits(user, type) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  if (user.plan === 'pro') {
    return { allowed: true, remaining: Infinity };
  }
  
  let count = user[type] || 0;
  const limit = LIMITS[type];
  
  // Reset if new day
  if (user.last_reset_date !== today) {
    count = 0;
  }
  
  const remaining = limit - count;
  return {
    allowed: remaining > 0,
    remaining,
    limit,
  };
}

export async function useCredit(user, type) {
  if (user.plan === 'pro') {
    return user;
  }
  
  const today = format(new Date(), 'yyyy-MM-dd');
  let currentCount = user[type] || 0;
  
  // Reset if new day
  if (user.last_reset_date !== today) {
    currentCount = 0;
  }
  
  const updatedUser = await base44.auth.updateMe({
    [type]: currentCount + 1,
    last_reset_date: today,
  });
  
  return updatedUser;
}