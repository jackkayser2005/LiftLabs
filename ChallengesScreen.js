import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import popUpStyles from './popUpStyles';
import { updateDailyStreak } from './lib/streak';
import { addExp } from './lib/profile';
import { supabase } from './supabaseClient';

const dailySets = [
  [
    { id: 'w1', title: 'Complete a Workout', total: 1 },
    { id: 'wt1', title: "Log Today's Weight", total: 1, requiresWeightLog: true, dbTracked: true },
    { id: 'xp1', title: 'Earn 500 XP', total: 1, dbTracked: true },
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
  const [showReward, setShowReward] = useState(false);
  const [levelUp, setLevelUp] = useState(false);
  const rewardAnim = useRef(new Animated.Value(0)).current;
  const levelAnim = useRef(new Animated.Value(0)).current;
  const premiumLocked = true;

  // Date string used for storage key
  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    (async () => {
      const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const idx = dayOfYear % dailySets.length;

      let todays = dailySets[idx].map((c) => ({ ...c, progress: 0 }));
      const userId = session?.user?.id;
      if (userId) {
        const key = `challenges_${userId}_${todayStr}`;
        const stored = await AsyncStorage.getItem(key);
        const completed = stored ? JSON.parse(stored) : [];
        todays = todays.filter((c) => !completed.includes(c.id));
      }
      setChallenges(todays);
      setPremiumChallenges(premiumSet.map((c) => ({ ...c, progress: 0 })));
    })();
  }, [session]);

  useEffect(() => {
    if (showReward) {
      rewardAnim.setValue(0);
      Animated.sequence([
        Animated.timing(rewardAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(rewardAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setShowReward(false);
        setLevelUp(false);
      });

      if (levelUp) {
        levelAnim.setValue(0);
        Animated.spring(levelAnim, { toValue: 1, useNativeDriver: true }).start();
      }
    }
  }, [showReward]);

  const checkWeightLogged = async () => {
    const userId = session?.user?.id;
    if (!userId) return false;
    const { data, error } = await supabase
      .from('weight_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('log_date', todayStr)
      .maybeSingle();
    if (error) {
      console.warn('checkWeightLogged error:', error.message);
    }
    return !!data;
  };

  const handleComplete = async (id, premium = false) => {
    const list = premium ? premiumChallenges : challenges;
    const challenge = list.find((c) => c.id === id);
    if (!challenge) return;

    if (challenge.dbTracked) {
      Alert.alert('Auto Tracked', 'This challenge is completed automatically.');
      return;
    }

    if (challenge.requiresWeightLog) {
      const logged = await checkWeightLogged();
      if (!logged) {
        Alert.alert('Hold Up', "Log today's weight before completing this challenge.");
        return;
      }
    }

    const updated = list.filter((c) => c.id !== id);
    premium ? setPremiumChallenges(updated) : setChallenges(updated);

    const userId = session?.user?.id;
    if (!premium && userId) {
      const key = `challenges_${userId}_${todayStr}`;
      const stored = await AsyncStorage.getItem(key);
      const completed = stored ? JSON.parse(stored) : [];
      if (!completed.includes(id)) {
        completed.push(id);
        await AsyncStorage.setItem(key, JSON.stringify(completed));
      }
    }

    if (userId) {
      const newStreak = await updateDailyStreak(userId);
      if (typeof newStreak === 'number' && onStreakUpdate) onStreakUpdate(newStreak);
    }

    const allDone = updated.length === 0;
    const alreadyRewarded = premium ? premiumRewarded : rewarded;
    if (allDone && !alreadyRewarded) {
      premium ? setPremiumRewarded(true) : setRewarded(true);
      if (userId) {
        const result = await addExp(userId, 1000);
        setLevelUp(result?.levelUp || false);
      }
      setShowReward(true);
    }
  };

  const renderChallenge = (c, premium = false, locked = false) => {
    return (
      <View
        key={c.id}
        style={[
          styles.levelCard,
          !isDarkMode && styles.levelCardLight,
          { marginBottom: 20, opacity: locked ? 0.5 : 1 },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons
            name={locked ? 'lock-closed' : 'ellipse-outline'}
            size={24}
            color={'#999'}
            style={{ marginRight: 12 }}
          />
          <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>{c.title}</Text>
        </View>
        {!locked && !c.dbTracked && (
          <TouchableOpacity onPress={() => handleComplete(c.id, premium)} style={{ marginTop: 8 }}>
            <Text style={{ color: '#1abc9c', textAlign: 'center' }}>Mark Complete</Text>
          </TouchableOpacity>
        )}
        {c.dbTracked && !locked && (
          <Text style={{ color: '#6c757d', textAlign: 'center', marginTop: 8 }}>Auto-tracked</Text>
        )}
        {locked && (
          <Text style={{ color: '#6c757d', textAlign: 'center', marginTop: 8 }}>Pro Only</Text>
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
        {premiumChallenges.map((c) => renderChallenge(c, true, true))}
      </View>
    </ScrollView>
    {showReward && (
      <Animated.View
        style={[
          popUpStyles.expBanner,
          {
            transform: [
              {
                translateY: rewardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [80, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="trophy" size={24} color="#fff" style={{ marginRight: 8 }} />
        <Text style={popUpStyles.expText}>+1000 XP</Text>
        {levelUp && (
          <Animated.Text
            style={[popUpStyles.levelUpText, { transform: [{ scale: levelAnim }] }]}
          >
            Level Up!
          </Animated.Text>
        )}
      </Animated.View>
    )}
  );
}
