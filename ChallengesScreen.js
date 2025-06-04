import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';

const challenges = [
  { title: 'Complete 5 Workouts this Week', progress: 3, total: 5 },
  { title: 'Upload 3 Form Videos', progress: 1, total: 3 },
  { title: 'Earn 1500 XP', progress: 800, total: 1500 },
];

export default function ChallengesScreen({ isDarkMode = true }) {
  return (
    <ScrollView style={[styles.container, !isDarkMode && styles.containerLight]}>
      <View style={{ padding: 20 }}>
        <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Challenges</Text>
        {challenges.map((c, idx) => {
          const pct = Math.min(100, Math.round((c.progress / c.total) * 100));
          return (
            <View
              key={idx}
              style={[styles.levelCard, !isDarkMode && styles.levelCardLight, { marginBottom: 20 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="checkmark-circle" size={24} color="#1abc9c" style={{ marginRight: 12 }} />
                <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>{c.title}</Text>
              </View>
              <View style={[styles.progressBar, !isDarkMode && styles.progressBarLight]}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={[styles.progressText, !isDarkMode && styles.progressTextLight]}>
                {c.progress} / {c.total}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}
