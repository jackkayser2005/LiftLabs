import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { updateDailyStreak } from './lib/streak';
import { addExp } from './lib/profile';
import { supabase } from './supabaseClient';

const dailySets = [
  [
    { id: 'w1', title: 'Complete a Workout', total: 1 },
    { id: 'v1', title: 'Upload a Form Video', total: 1 },
    { id: 'xp1', title: 'Earn 500 XP', total: 1 },
  ],
  [
    { id: 'r1', title: 'Run 2 Miles', total: 1 },
    { id: 's1', title: 'Do 10 Minutes Stretching', total: 1 },
    { id: 'f1', title: 'Log Your Meals', total: 1 },
  ],
];

const premiumSet = [
  { id: 'p1', title: 'Try a Live Workout', total: 1 },
  { id: 'p2', title: 'Share a PR Video', total: 1 },
  { id: 'p3', title: 'Request Form Feedback', total: 1 },
];

export default function ChallengesScreen({ session, isPremium = false, onStreakUpdate, isDarkMode = true }) {
  const [challenges, setChallenges] = useState([]);
  const [premiumChallenges, setPremiumChallenges] = useState([]);
  const [rewarded, setRewarded] = useState(false);
  const [premiumRewarded, setPremiumRewarded] = useState(false);

  useEffect(() => {
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    const idx = dayOfYear % dailySets.length;
    setChallenges(dailySets[idx].map((c) => ({ ...c, progress: 0 })));
    setPremiumChallenges(premiumSet.map((c) => ({ ...c, progress: 0 })));
  }, []);

  const handleComplete = async (id, premium = false) => {
    const list = premium ? premiumChallenges : challenges;
    const updated = list.map((c) => (c.id === id ? { ...c, progress: c.total } : c));
    premium ? setPremiumChallenges(updated) : setChallenges(updated);

    const userId = session?.user?.id;
    if (userId) {
      const newStreak = await updateDailyStreak(userId);
      if (typeof newStreak === 'number' && onStreakUpdate) onStreakUpdate(newStreak);
    }

    const allDone = updated.every((c) => c.progress >= c.total);
    const alreadyRewarded = premium ? premiumRewarded : rewarded;
    if (allDone && !alreadyRewarded) {
      premium ? setPremiumRewarded(true) : setRewarded(true);
      if (userId) await addExp(userId, 1000);
      Alert.alert('Great Job!', `You earned 1000 XP for completing ${premium ? 'premium ' : ''}challenges!`);
    }
  };

  const renderChallenge = (c, premium = false) => {
    const pct = Math.min(100, Math.round((c.progress / c.total) * 100));
    const done = c.progress >= c.total;
    return (
      <View key={c.id} style={[styles.levelCard, !isDarkMode && styles.levelCardLight, { marginBottom: 20 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons
            name={done ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={done ? '#1abc9c' : '#999'}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>{c.title}</Text>
        </View>
        <View style={[styles.progressBar, !isDarkMode && styles.progressBarLight]}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
        <Text style={[styles.progressText, !isDarkMode && styles.progressTextLight]}>
          {done ? 'Done' : `${c.progress} / ${c.total}`}
        </Text>
        {!done && (
          <TouchableOpacity onPress={() => handleComplete(c.id, premium)} style={{ marginTop: 8 }}>
            <Text style={{ color: '#1abc9c', textAlign: 'center' }}>Mark Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, !isDarkMode && styles.containerLight]}>
      <View style={{ padding: 20 }}>
        <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Daily Challenges</Text>
        {challenges.map((c) => renderChallenge(c))}
        <Text style={[styles.sectionTitle, { marginTop: 20 }, !isDarkMode && styles.sectionTitleLight]}>
          Premium Challenges
        </Text>
        {isPremium
          ? premiumChallenges.map((c) => renderChallenge(c, true))
          : (
            <View style={[styles.levelCard, !isDarkMode && styles.levelCardLight]}>
              <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>Premium challenges locked</Text>
            </View>
          )}
      </View>
    </ScrollView>
  );
}
