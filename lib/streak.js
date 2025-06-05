// lib/streak.js
import { supabase } from '../supabaseClient';

// updateDailyStreak: increments “streak” a maximum of once per calendar day.
// It checks profile.last_streak_date and only bumps profile.streak if last_streak_date < today.
// Returns the new streak count, or the existing streak if already bumped today.
export async function updateDailyStreak(userId) {
  // “YYYY-MM-DD” string for today
  const todayStr = new Date().toISOString().split('T')[0];

  // 1) Fetch current streak + last_streak_date from the profile table
  const { data: profileData, error: fetchError } = await supabase
    .from('profile')
    .select('streak, last_streak_date')
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    console.warn('⚠️ Error fetching profile for streak:', fetchError.message);
    return null;
  }

  // Destructure values (fallback streak to 0 if null)
  let { streak = 0, last_streak_date } = profileData;

  // 2) If last_streak_date is exactly today, we’ve already bumped. Bail.
  if (last_streak_date === todayStr) {
    return streak;
  }

  // 3) Otherwise, bump it and write back
  const newStreak = streak + 1;
  const { error: updateError } = await supabase
    .from('profile')
    .update({
      streak: newStreak,
      last_streak_date: todayStr,
    })
    .eq('user_id', userId);

  if (updateError) {
    console.warn('⚠️ Error updating streak in profile:', updateError.message);
    return null;
  }

  return newStreak;
}
