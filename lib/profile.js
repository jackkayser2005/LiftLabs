// lib/profile.js
import { supabase } from '../supabaseClient';

// Create a new profile if one does not exist (call this right after signup)
export async function createProfileIfNeeded(user) {
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
        { id: user.id, email: user.email }
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
