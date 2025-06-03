// ProfileScreen.js

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer'; // ← Required so Buffer.from(...) works
import { supabase } from './supabaseClient';
import styles from './styles'; // your existing ProfileScreen styles

export default function ProfileScreen({
  session,
  dark,
  toggleDark,
  goBack,
  onLogout,
}) {
  /** ------------------------- Local state ------------------------- */
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    level: 0,
    exp: 0,
    avatar_url: '',
  });
  const [videoCnt, setVideoCnt] = useState(0);
  const [workoutCnt, setWorkoutCnt] = useState(0);
  const [latestBfp, setLatestBfp] = useState(null);
  const [loadingBfp, setLoadingBfp] = useState(true);

  // NEW: track workout dates for calendar
  const [workoutDates, setWorkoutDates] = useState(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  // String used to mark today's date in the calendar
  const todayStr = useMemo(
    () => new Date().toISOString().split('T')[0],
    []
  );

  const isGuest = session?.user?.app_metadata?.guest;
  const userId = session?.user?.id;

  /** ---------------------- Fetch profile, stats, and workout dates ---------------------- */
  useEffect(() => {
    if (!userId || isGuest) {
      // Guest or no real user → skip fetching
      setLoading(false);
      setLoadingBfp(false);
      return;
    }

    (async () => {
      try {
        // 1) Fetch the single row from "profile"
        const { data: p, error: pErr } = await supabase
          .from('profile')
          .select('first_name, level, exp, avatar_url')
          .eq('id', userId)
          .single();
        if (pErr) throw pErr;

        // 2) Count how many videos belong to this user
        const { count: vCnt, error: vErr } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (vErr) throw vErr;

        // 3) Count how many strength logs (workouts) this user has
        const { count: wCnt, error: wErr } = await supabase
          .from('strength_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        if (wErr) throw wErr;

        // 4) Fetch the latest body fat entry for this user
        const { data: bfpEntry, error: bfpErr } = await supabase
          .from('body_fat_entries')
          .select('body_fat_percentage, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (bfpErr && bfpErr.code !== 'PGRST116') {
          // PGRST116 means “no rows found”—ignore that
          throw bfpErr;
        }

        // 5) Fetch all workout dates from "strength_logs"
        const { data: logs, error: logsErr } = await supabase
          .from('strength_logs')
          .select('date_performed')
          .eq('user_id', userId);
        if (!logsErr && logs) {
          const datesSet = new Set(
            logs.map((l) => {
              // date_performed might be a string like "2025-06-02T00:00:00.000Z"
              const d = l.date_performed;
              if (typeof d === 'string') {
                return d.split('T')[0];
              } else {
                return d.toISOString().split('T')[0];
              }
            })
          );
          setWorkoutDates(datesSet);
        }

        // 6) Store profile, counts, and latestBfp into local state
        setProfile({
          first_name: p?.first_name ?? '',
          level: p?.level ?? 0,
          exp: p?.exp ?? 0,
          avatar_url: p?.avatar_url ?? '',
        });
        setVideoCnt(vCnt ?? 0);
        setWorkoutCnt(wCnt ?? 0);
        setLatestBfp(bfpEntry ?? null);
      } catch (e) {
        console.warn('Profile fetch error:', e.message);
        Alert.alert('Error', 'Could not load profile or body‐fat data.');
      } finally {
        setLoading(false);
        setLoadingBfp(false);
      }
    })();
  }, [userId, isGuest]);

  /** ---------------------- Pick & upload avatar ---------------------- */
  const pickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission', 'We need gallery access to pick an avatar.');
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (res.canceled || !res.assets?.length) return;

      const { uri } = res.assets[0];
      const ext = uri.split('.').pop();
      const fileName = `${userId}/avatar.${ext}`;

      setUploading(true);
      // Read file as Base64
      const b64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload (upsert) to the "avatars" bucket
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, Buffer.from(b64, 'base64'), {
          contentType: `image/${ext}`,
          upsert: true,
        });
      if (upErr) throw upErr;

      // Grab the public URL back
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      // Save the publicUrl to our "profile" table
      const { error: tableErr } = await supabase
        .from('profile')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (tableErr) throw tableErr;

      // Reflect the new avatar URL in local state
      setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
    } catch (e) {
      console.warn('Avatar error:', e.message);
      Alert.alert('Avatar', 'Failed to update avatar.');
    } finally {
      setUploading(false);
    }
  };

  /** ---------------------- Early exits + loading spinners ---------------------- */
  if (!session?.user) {
    return (
      <View style={[styles.center, { backgroundColor: dark ? '#0a0f0d' : '#fff' }]}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={dark ? '#666' : '#999'}
        />
        <Text style={[styles.screenTitle, !dark && styles.screenTitleLight]}>
          No User Found
        </Text>
      </View>
    );
  }
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: dark ? '#0a0f0d' : '#fff',
        }}
      >
        <ActivityIndicator size="large" color="#1abc9c" />
      </View>
    );
  }

  /** ---------------------- Derive Display Name ---------------------- */
  const displayName =
    profile.first_name?.trim() ||
    session.user.user_metadata?.first_name ||
    session.user.email.split('@')[0];

  // XP progress bar
  const xpNeeded = 1000;
  const progressPct = Math.min(100, Math.floor((profile.exp / xpNeeded) * 100));

  /** ---------------------- Helpers for Calendar ---------------------- */
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  function generateCalendar(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks = [];
    let week = [];

    // Fill blanks before the 1st
    const startWeekday = firstDay.getDay(); // 0 = Sunday
    for (let i = 0; i < startWeekday; i++) {
      week.push(null);
    }

    // Fill actual days
    for (let date = 1; date <= lastDay.getDate(); date++) {
      const dateObj = new Date(year, month, date);
      week.push(dateObj);
      if (dateObj.getDay() === 6) {
        weeks.push(week);
        week = [];
      }
    }

    // If any days left in last week, pad to length 7
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }

    return weeks;
  }

  // Recompute calendar weeks only when month or year changes
  const weeks = useMemo(
    () => generateCalendar(calendarYear, calendarMonth),
    [calendarYear, calendarMonth]
  );

  /** ---------------------- Main Render ---------------------- */
  return (
    <View style={{ flex: 1, backgroundColor: dark ? '#0a0f0d' : '#fff' }}>
      {/* Back button in top‐left */}
      <TouchableOpacity
        onPress={goBack}
        style={{
          position: 'absolute',
          top: 50,
          left: 20,
          zIndex: 10,
          backgroundColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          borderRadius: 20,
          padding: 8,
        }}
      >
        <Ionicons name="arrow-back" size={24} color={dark ? '#fff' : '#000'} />
      </TouchableOpacity>

      <ScrollView style={styles.profileContent}>
        {/* ───────── Profile Header ───────── */}
        <View style={[styles.profileHeader, !dark && styles.profileHeaderLight]}>
          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 10 }}
            />
          ) : (
            <View
              style={{
                backgroundColor: 'rgba(26,188,156,0.15)',
                borderRadius: 60,
                padding: 10,
                marginBottom: 10,
              }}
            >
              <Ionicons name="person-circle" size={80} color="#1abc9c" />
            </View>
          )}

          {/* “Change Avatar” button (only for real users) */}
          {!isGuest && (
            <TouchableOpacity onPress={pickAvatar} disabled={uploadingAvatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#1abc9c" />
              ) : (
                <Text style={{ color: '#1abc9c', marginBottom: 8 }}>
                  {profile.avatar_url ? 'Change Avatar' : 'Add Avatar'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Display Name & Email */}
          <Text style={[styles.profileName, !dark && styles.profileNameLight]}>
            {isGuest ? 'Guest User' : displayName}
          </Text>
          <Text style={[styles.profileEmail, !dark && styles.profileEmailLight]}>
            {isGuest ? 'Limited Access' : session.user.email}
          </Text>
        </View>

        {/* ───────── Stats Section (only for real users) ───────── */}
        {!isGuest && (
          <>
            <View style={styles.statsSection}>
              <Text style={[styles.sectionTitle, !dark && styles.sectionTitleLight]}>
                Your Stats
              </Text>

              {/* Total Workouts */}
              <View style={[styles.statRow, !dark && styles.statRowLight]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="fitness"
                    size={20}
                    color="#1abc9c"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[styles.statLabel, !dark && styles.statLabelLight]}>
                    Total Workouts
                  </Text>
                </View>
                <Text style={styles.statValue}>{workoutCnt}</Text>
              </View>

              {/* Videos Uploaded */}
              <View style={[styles.statRow, !dark && styles.statRowLight]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name="videocam"
                    size={20}
                    color="#3498db"
                    style={{ marginRight: 12 }}
                  />
                  <Text style={[styles.statLabel, !dark && styles.statLabelLight]}>
                    Videos Uploaded
                  </Text>
                </View>
                <Text style={styles.statValue}>{videoCnt}</Text>
              </View>

              {/* Latest Body Fat % (new!) */}
              {loadingBfp ? (
                <View style={[styles.statRow, !dark && styles.statRowLight]}>
                  <ActivityIndicator size="small" color="#1abc9c" />
                  <Text
                    style={[
                      styles.statLabel,
                      !dark && styles.statLabelLight,
                      { marginLeft: 12 },
                    ]}
                  >
                    Loading Body Fat…
                  </Text>
                </View>
              ) : latestBfp ? (
                <View style={[styles.statRow, !dark && styles.statRowLight]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="barbell"
                      size={20}
                      color="#f39c12"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.statLabel, !dark && styles.statLabelLight]}>
                      Latest Body Fat
                    </Text>
                  </View>
                  <Text style={styles.statValue}>
                    {latestBfp.body_fat_percentage}% (
                    {new Date(latestBfp.created_at).toLocaleDateString()})
                  </Text>
                </View>
              ) : (
                <View style={[styles.statRow, !dark && styles.statRowLight]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name="barbell"
                      size={20}
                      color="#f39c12"
                      style={{ marginRight: 12 }}
                    />
                    <Text style={[styles.statLabel, !dark && styles.statLabelLight]}>
                      Latest Body Fat
                    </Text>
                  </View>
                  <Text style={[styles.statValue, { color: dark ? '#666' : '#999' }]}>
                    No entries yet
                  </Text>
                </View>
              )}
              </View>

              {/* ───────── Level & Experience Section ───────── */}
              <View style={styles.levelSection}>
                <Text style={[styles.sectionTitle, !dark && styles.sectionTitleLight]}> 
                  Level & Experience
                </Text>
                <View style={[styles.levelCard, !dark && styles.levelCardLight]}>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelNumber}>{profile.level}</Text>
                    <Text style={styles.rankText}>
                      {profile.level < 5
                        ? 'Rookie'
                        : profile.level < 10
                        ? 'Intermediate'
                        : 'Pro'}
                    </Text>
                  </View>
                  <View
                    style={[styles.progressBar, !dark && styles.progressBarLight]}
                  >
                    <View
                      style={[styles.progressFill, { width: `${progressPct}%` }]}
                    />
                  </View>
                  <Text style={[styles.progressText, !dark && styles.progressTextLight]}>
                    {profile.exp} / {xpNeeded} XP
                  </Text>
                </View>
              </View>

              {/* ───────── Workout Calendar (moved above Settings) ───────── */}
            <View
              style={[
                calendarStyles.calendarContainer,
                { backgroundColor: dark ? '#1c1c1c' : '#f2f2f2' },
              ]}
            >
              {/* Month Header with Nav */}
              <View style={calendarStyles.monthHeader}>
                <TouchableOpacity
                  onPress={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }}
                >
                  <Ionicons
                    name="chevron-back"
                    size={24}
                    color={dark ? '#fff' : '#000'}
                  />
                </TouchableOpacity>
                <Text
                  style={[
                    calendarStyles.monthTitle,
                    { color: dark ? '#fff' : '#000' },
                  ]}
                >
                  {monthNames[calendarMonth]} {calendarYear}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={24}
                    color={dark ? '#fff' : '#000'}
                  />
                </TouchableOpacity>
              </View>

              {/* Weekday Labels */}
              <View style={calendarStyles.weekdaysRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
                  <Text
                    key={w}
                    style={[
                      calendarStyles.weekdayLabel,
                      { color: dark ? '#ccc' : '#444' },
                    ]}
                  >
                    {w}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              {weeks.map((week, wi) => (
                <View key={wi} style={calendarStyles.weekRow}>
                  {week.map((dayObj, di) => {
                    if (!dayObj) {
                      // Empty placeholder
                      return <View key={di} style={calendarStyles.dayBox} />;
                    }
                    const dateStr = dayObj.toISOString().split('T')[0]; // "YYYY-MM-DD"
                    const didWorkout = workoutDates.has(dateStr);
                    const isToday = dateStr === todayStr;
                    return (
                      <View
                        key={di}
                        style={[
                          calendarStyles.dayBox,
                          {
                            backgroundColor: didWorkout
                              ? dark
                                ? '#2ecc71'
                                : '#c8e6c9'
                              : 'transparent',
                            borderWidth: isToday ? 2 : 1,
                            borderColor: isToday
                              ? '#e67e22'
                              : dark
                              ? '#444'
                              : '#ccc',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            calendarStyles.dayText,
                            isToday && calendarStyles.todayText,
                            { color: dark ? '#fff' : '#000' },
                          ]}
                        >
                          {dayObj.getDate()}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* ───────── Settings Section ───────── */}
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, !dark && styles.sectionTitleLight]}>
                Settings
              </Text>

              {/* Dark/Light toggle */}
              <TouchableOpacity
                style={[styles.settingItem, !dark && styles.settingItemLight]}
                onPress={toggleDark}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name={dark ? 'sunny' : 'moon'}
                    size={20}
                    color="#1abc9c"
                  />
                  <Text
                    style={[styles.settingText, !dark && styles.settingTextLight]}
                  >
                    {dark ? 'Enable Light Mode' : 'Enable Dark Mode'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={dark ? '#666' : '#999'}
                />
              </TouchableOpacity>

              {/* Sign Out button */}
              <TouchableOpacity
                style={[styles.settingItem, !dark && styles.settingItemLight]}
                onPress={onLogout}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name="log-out" size={20} color="#e74c3c" />
                  <Text
                    style={[
                      styles.settingText,
                      { color: '#e74c3c', marginLeft: 15 },
                    ]}
                  >
                    Sign Out
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

          </>
        )}

        {/* Bottom padding so the navbar doesn’t overlap */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const calendarStyles = StyleSheet.create({
  calendarContainer: {
    marginTop: 20,
    marginHorizontal: 10,
    padding: 12,
    borderRadius: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  weekdayLabel: {
    width: 30,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '700',
  },
});
