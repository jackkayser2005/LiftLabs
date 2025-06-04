import { supabase } from '../supabaseClient';

export async function updateDailyStreak(userId) {
  if (!userId) return null;
  const today = new Date().toISOString().split('T')[0];

  // fetch latest log for this user
  const { data: latest, error } = await supabase
    .from('calorie_logs')
    .select('log_date, streak_days')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('updateDailyStreak fetch error:', error.message);
    return null;
  }

  if (latest && latest.log_date === today) {
    // streak already updated today
    return latest.streak_days || 0;
  }

  let newStreak = 1;
  if (latest) {
    const diff = new Date(today) - new Date(latest.log_date);
    if (diff <= 86400000) {
      newStreak = (latest.streak_days || 0) + 1;
    }
  }

  // ensure today row exists
  const { data: todayRow } = await supabase
    .from('calorie_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle();

  if (todayRow) {
    await supabase
      .from('calorie_logs')
      .update({ streak_days: newStreak })
      .eq('id', todayRow.id);
  } else {
    await supabase.from('calorie_logs').insert({
      user_id: userId,
      log_date: today,
      streak_days: newStreak,
    });
  }

  return newStreak;
}
