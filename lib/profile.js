// lib/profile.js
import { supabase } from '../supabaseClient';

// Create a new profile if one does not exist (call this right after signup)
export async function createProfileIfNeeded(user, firstName) {
  if (!user) throw new Error('No user passed to createProfileIfNeeded');
  // See if this user already has a profile
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Only ignore "no rows found" error, else throw
    throw fetchError;
  }

  if (!existing) {
    // Insert a new profile row
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          first_name: firstName || null,
          level: 1,
          ex: 0,
        },
      ]);
    if (insertError) throw insertError;
  }
}

// Fetch the logged-in user's profile row
export async function fetchMyProfile() {
  // Get user from auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

// Add experience points and update level if needed.
// Returns an object { exp, level, levelUp } or null on failure.
export async function addExp(userId, amount) {
  if (!userId || !amount) return null;
  const { data: profile, error } = await supabase
    .from('profile')
    .select('exp, level')
    .eq('user_id', userId)
    .single();
  if (error) {
    console.warn('addExp fetch error:', error.message);
    return null;
  }
  const currentExp = profile?.exp || 0;
  const currentLevel = profile?.level || 1;
  const newExp = currentExp + amount;
  const levelThreshold = 5000;
  const newLevel = Math.floor(newExp / levelThreshold) + 1;
  const levelUp = newLevel > currentLevel;

  const { error: updateError } = await supabase
    .from('profile')
    .update({ exp: newExp, level: newLevel })
    .eq('user_id', userId);
  if (updateError) {
    console.warn('addExp update error:', updateError.message);
    return null;
  }
  return { exp: newExp, level: newLevel, levelUp };
}

