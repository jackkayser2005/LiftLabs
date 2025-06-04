import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { supabase } from './supabaseClient';

export default function RankScreen({ session, isDarkMode = true }) {
  const [profile, setProfile] = useState({ level: 0, exp: 0 });
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [userPercentile, setUserPercentile] = useState(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = session.user.id;
        const { data, error } = await supabase
          .from('profile')
          .select('level, exp')
          .eq('user_id', userId)
          .single();
        if (!error && data) {
          setProfile({ level: data.level || 0, exp: data.exp || 0 });
          await fetchUserRank(data.exp || 0);
        }
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) fetchData();
  }, [session]);

  async function fetchUserRank(userExp) {
    try {
      const { count: higherCount, error: higherError } = await supabase
        .from('profile')
        .select('exp', { count: 'exact', head: true })
        .gt('exp', userExp);
      if (higherError) throw higherError;
      const { count: totalCount, error: totalError } = await supabase
        .from('profile')
        .select('exp', { count: 'exact', head: true });
      if (totalError) throw totalError;
      const rank = (higherCount || 0) + 1;
      setUserRank(rank);
      const percentile = totalCount
        ? (((totalCount - rank) / totalCount) * 100).toFixed(1)
        : 0;
      setUserPercentile(percentile);
    } catch (err) {
      console.error('Error fetching rank:', err);
    }
  }

  const xpNeeded = 1000;
  const progressPct = Math.min(100, Math.floor((profile.exp / xpNeeded) * 100));

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1abc9c" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, !isDarkMode && styles.containerLight]}>
      <View style={{ padding: 20 }}>
        <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Your Rank</Text>
        <View style={[styles.levelCard, !isDarkMode && styles.levelCardLight]}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelNumber}>{profile.level}</Text>
            <Text style={styles.rankText}>
              {profile.level < 5 ? 'Rookie' : profile.level < 10 ? 'Intermediate' : 'Pro'}
            </Text>
          </View>
          <View style={[styles.progressBar, !isDarkMode && styles.progressBarLight]}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, !isDarkMode && styles.progressTextLight]}>
            {profile.exp} / {xpNeeded} XP
          </Text>
          {userRank && (
            <Text style={[styles.rankInfo, !isDarkMode && styles.rankInfoLight]}>Rank #{userRank} • Top {userPercentile}%</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
