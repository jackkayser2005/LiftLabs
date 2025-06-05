// RankScreen.js

import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,         // ← for showing a quick placeholder when tapping "Achievements"
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from './supabaseClient'

// Map each tier key to its PNG in ./images/
const tierImages = {
  iron: require('./images/iron.png'),
  bronze: require('./images/bronze.png'),
  gold: require('./images/gold.png'),
  // platinum: require('./images/platinum.png'),
  // emerald: require('./images/emerald.png'),
  // diamond: require('./images/diamond.png'),
  // liftingLegend: require('./images/highestRank.png'),
}

export default function RankScreen({ session, isDarkMode = true }) {
  const [streakDays, setStreakDays] = useState(0)
  const [strongestLift, setStrongestLift] = useState(null) // { exercise, weight }
  const [loading, setLoading] = useState(true)
  const [currentTier, setCurrentTier] = useState(null)
  const [nextThreshold, setNextThreshold] = useState(null)
  const [showAllTiers, setShowAllTiers] = useState(false)
  const [expandedTiers, setExpandedTiers] = useState([])

  // RANK TIERS: define by minimum lift (lbs) & minimum streak (days)
  const RANK_TIERS = [
    { name: 'Iron',    key: 'iron',  minLift: 0,   minStreak: 0 },
    { name: 'Bronze',  key: 'bronze',minLift: 100, minStreak: 7 },
    { name: 'Gold',    key: 'gold',  minLift: 200, minStreak: 14 },
    // { name: 'Platinum',  key: 'platinum',   minLift: 300, minStreak: 21 },
    // { name: 'Emerald',   key: 'emerald',    minLift: 400, minStreak: 28 },
    // { name: 'Diamond',   key: 'diamond',    minLift: 500, minStreak: 35 },
    // { name: 'Legendary', key: 'liftingLegend', minLift: 600, minStreak: 50 },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        const userId = session.user.id

        // 1) Fetch streak_days from profile table
        const { data: profData, error: profError } = await supabase
          .from('profile')
          .select('streak_days')
          .eq('user_id', userId)
          .single()
        if (profError) {
          console.warn('Error fetching profile.streak_days:', profError.message)
        } else {
          setStreakDays(profData?.streak_days || 0)
        }

        // 2) Fetch the single highest rep_max from strength_logs
        const { data: topLift, error: liftError } = await supabase
          .from('strength_logs')
          .select('exercise, rep_max')
          .eq('user_id', userId)
          .in('exercise', ['squat', 'bench', 'deadlift'])
          .order('rep_max', { ascending: false })
          .limit(1)
          .single()

        if (liftError) {
          console.warn('Error fetching strength_logs:', liftError.message)
          setStrongestLift(null)
        } else if (topLift) {
          setStrongestLift({
            exercise: topLift.exercise,
            weight: topLift.rep_max,
          })
        }

        // Now that we have streakDays & (potentially) strongestLift.weight, determine tier:
        const maxLiftVal = topLift?.rep_max || 0
        const streakVal = profData?.streak_days || 0
        determineRank(maxLiftVal, streakVal)
      } catch (err) {
        console.error('Error in fetchData:', err)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user) fetchData()
  }, [session])

  function determineRank(maxLift, streakDays) {
    let current = RANK_TIERS[0]
    for (let i = 0; i < RANK_TIERS.length; i++) {
      const tier = RANK_TIERS[i]
      if (maxLift >= tier.minLift && streakDays >= tier.minStreak) {
        current = tier
      } else {
        break
      }
    }
    setCurrentTier(current)

    const idx = RANK_TIERS.findIndex((t) => t.key === current.key)
    if (idx < RANK_TIERS.length - 1) {
      setNextThreshold(RANK_TIERS[idx + 1])
    } else {
      setNextThreshold(null)
    }
  }

  function toggleExpandTier(key) {
    setExpandedTiers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1abc9c" />
      </View>
    )
  }

  // If strongestLift is null, maxLiftVal will be 0, so default tier = Iron
  const tier = currentTier || RANK_TIERS[0]

  return (
    <ScrollView
      style={[
        styles.container,
        isDarkMode ? styles.darkBackground : styles.lightBackground,
      ]}
      contentContainerStyle={styles.contentWrapper}
    >
      <Text style={[styles.title, isDarkMode ? styles.darkText : styles.lightText]}>
        Your Tier
      </Text>

      <View style={[styles.card, isDarkMode ? styles.darkCard : styles.lightCard]}>
        {/* Show the badge image for this tier */}
        <Image source={tierImages[tier.key]} style={styles.tierImage} />

        <Text style={[styles.tierText, isDarkMode ? styles.darkText : styles.lightText]}>
          {tier.name}
        </Text>

        {/* Display the max lift (from strength_logs) */}
        <View style={styles.detailRow}>
          <Ionicons name="barbell-outline" size={20} color="#1abc9c" />
          <Text style={[styles.detailText, isDarkMode ? styles.darkText : styles.lightText]}>
            Max Lift:{' '}
            <Text style={styles.highlight}>
              {strongestLift ? strongestLift.weight : 0} lbs
            </Text>
          </Text>
        </View>

        {/* Display streak (from profile) */}
        <View style={styles.detailRow}>
          <Ionicons name="flame-outline" size={20} color="#e74c3c" />
          <Text style={[styles.detailText, isDarkMode ? styles.darkText : styles.lightText]}>
            Streak: <Text style={styles.highlight}>{streakDays} days</Text>
          </Text>
        </View>

        {/* Display which lift is the strongest, if available */}
        {strongestLift && (
          <View style={styles.detailRow}>
            <Ionicons name="flash-outline" size={20} color="#f1c40f" />
            <Text style={[styles.detailText, isDarkMode ? styles.darkText : styles.lightText]}>
              Strongest:{' '}
              <Text style={styles.highlight}>
                {strongestLift.exercise.charAt(0).toUpperCase() +
                  strongestLift.exercise.slice(1)}{' '}
                – {strongestLift.weight} lbs
              </Text>
            </Text>
          </View>
        )}

        {/* Show the “Next Rank” requirements if not already at top */}
        {nextThreshold ? (
          <View style={styles.nextWrapper}>
            <Text style={[styles.nextText, isDarkMode ? styles.darkText : styles.lightText]}>
              Next Rank: {nextThreshold.name}
            </Text>
            <Text style={[styles.nextDetail, isDarkMode ? styles.darkText : styles.lightText]}>
              🚀 Lift ≥ {nextThreshold.minLift} lbs & {nextThreshold.minStreak}-day streak
            </Text>
          </View>
        ) : (
          <View style={styles.currentChampion}>
            <Ionicons name="ribbon-outline" size={28} color="#ffd700" />
            <Text style={[styles.champText, isDarkMode ? styles.darkText : styles.lightText]}>
              You’re at the top!
            </Text>
          </View>
        )}
      </View>

      {/* Icon Row for other info */}
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="heart-outline" size={24} color="#e74c3c" />
          <Text style={styles.iconLabel}>Streaks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="flame-outline" size={24} color="#f39c12" />
          <Text style={styles.iconLabel}>Lifts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() =>
            Alert.alert('Achievements', '✨ Achievements feature coming soon! ✨')
          }
        >
          <Ionicons name="star-outline" size={24} color="#f1c40f" />
          <Text style={styles.iconLabel}>Achievements</Text>
        </TouchableOpacity>
      </View>

      {/* Toggle to show/hide all tiers */}
      <TouchableOpacity
        style={[styles.toggleButton, isDarkMode ? styles.darkButton : styles.lightButton]}
        onPress={() => setShowAllTiers((v) => !v)}
      >
        <Text style={[styles.toggleText, isDarkMode ? styles.darkText : styles.lightText]}>
          {showAllTiers ? 'Hide All Tiers ▲' : 'Show All Tiers ▼'}
        </Text>
      </TouchableOpacity>

      {showAllTiers && (
        <View style={styles.tiersContainer}>
          {RANK_TIERS.map((t, idx) => (
            <View key={t.key}>
              <TouchableOpacity
                style={[
                  styles.tierRow,
                  isDarkMode ? styles.darkRow : styles.lightRow,
                  t.key === tier.key && styles.currentRow,
                ]}
                onPress={() => toggleExpandTier(t.key)}
              >
                {/* Tier Icon */}
                <Image
                  source={tierImages[t.key]}
                  style={styles.tierIcon}
                />

                {/* Tier Name */}
                <Text style={[styles.tierName, isDarkMode ? styles.darkText : styles.lightText]}>
                  {idx + 1}. {t.name}
                </Text>

                <Ionicons
                  name={expandedTiers.includes(t.key) ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={isDarkMode ? '#fff' : '#333'}
                />
              </TouchableOpacity>

              {expandedTiers.includes(t.key) && (
                <View style={styles.requirementContainer}>
                  <Text
                    style={[
                      styles.requirementText,
                      isDarkMode ? styles.darkText : styles.lightText,
                    ]}
                  >
                    • Lift ≥ {t.minLift} lbs{'\n'}• Streak ≥ {t.minStreak} days
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentWrapper: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 100,            // ← extra bottom padding so nothing gets cut off
  },
  darkBackground: {
    backgroundColor: '#121212',
  },
  lightBackground: {
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  darkText: {
    color: '#ffffff',
  },
  lightText: {
    color: '#333333',
  },
  card: {
    width: '100%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  lightCard: {
    backgroundColor: '#ffffff',
  },
  tierImage: {
    width: 80,
    height: 80,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  tierText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 8,
  },
  highlight: {
    fontWeight: '700',
    color: '#1abc9c',
  },
  nextWrapper: {
    marginTop: 16,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 4,
  },
  nextDetail: {
    fontSize: 14,
    fontWeight: '300',
    textAlign: 'center',
  },
  currentChampion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  champText: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  toggleButton: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkButton: {
    backgroundColor: '#272727',
  },
  lightButton: {
    backgroundColor: '#ececec',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tiersContainer: {
    width: '100%',
  },
  tierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
  },
  darkRow: {
    backgroundColor: '#1f1f1f',
  },
  lightRow: {
    backgroundColor: '#ffffff',
  },
  currentRow: {
    borderWidth: 2,
    borderColor: '#1abc9c',
  },
  tierIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    resizeMode: 'contain',
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1, // so text and icon don’t overlap
  },
  requirementContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
