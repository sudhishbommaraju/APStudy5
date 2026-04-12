import { base44 } from '@/api/base44Client';

export async function updateUserStreak(userEmail) {
  try {
    const userStats = await base44.entities.UserStats.filter(
      { user_email: userEmail },
      '-created_date',
      1
    ).then(r => r[0]);

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    if (!userStats) {
      // First activity - create stats with streak of 1
      await base44.entities.UserStats.create({
        user_email: userEmail,
        streak: 1,
        last_activity_date: today,
      });
      return 1;
    }

    const lastActivityDate = userStats.last_activity_date;
    const lastDate = lastActivityDate ? new Date(lastActivityDate) : null;
    const lastDateStr = lastDate ? lastDate.toISOString().split('T')[0] : null;

    if (lastDateStr === today) {
      // Already active today, don't increment streak
      return userStats.streak || 1;
    }

    // Check if activity was yesterday (maintain streak)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newStreak = lastDateStr === yesterdayStr ? (userStats.streak || 1) + 1 : 1;

    await base44.entities.UserStats.update(userStats.id, {
      streak: newStreak,
      last_activity_date: today,
    });

    return newStreak;
  } catch (error) {
    console.error('Failed to update streak:', error);
    return 0;
  }
}