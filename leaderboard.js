import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabaseClient';

const Leaderboard = ({ isDarkMode = true }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [userRank, setUserRank] = useState(null);
  const [userPercentile, setUserPercentile] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const { data, count, error } = await supabase
        .from('profile')
        .select('user_id, first_name, exp, level', { count: 'exact' })
        .order('exp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        setError('Failed to load leaderboard');
        return;
      }

      // Add rank to each user
      const rankedData = data.map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

      setLeaders(rankedData);
      setTotalParticipants(count || rankedData.length);
      await fetchUserStats(count || rankedData.length);
      setError(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Something went wrong');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserStats = async (participantCount) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('exp')
        .eq('user_id', user.id)
        .single();
      if (profileError) throw profileError;

      const userExp = profile?.exp || 0;

      const { count: higherCount, error: higherError } = await supabase
        .from('profile')
        .select('exp', { count: 'exact', head: true })
        .gt('exp', userExp);
      if (higherError) throw higherError;

      const rank = (higherCount || 0) + 1;
      setUserRank(rank);

      const total = participantCount || totalParticipants || rank;
      const percentile = total ? (((total - rank) / total) * 100).toFixed(1) : 0;
      setUserPercentile(percentile);
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🏆';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return isDarkMode ? '#666' : '#999';
    }
  };

  const getExpBarWidth = (exp, maxExp) => {
    return Math.min((exp / maxExp) * 100, 100);
  };

  const LeaderboardRow = ({ user, index }) => (
    <View
      key={user.user_id || index}
      style={[
        styles.tableRow,
        !isDarkMode && styles.tableRowLight,
        index === 0 && styles.firstPlaceRow,
        index === 1 && styles.secondPlaceRow,
        index === 2 && styles.thirdPlaceRow,
      ]}
    >
      <View style={styles.rankColumn}>
        <Text
          style={[
            styles.rankText,
            !isDarkMode && styles.rankTextLight,
            { color: getRankColor(user.rank) },
          ]}
        >
          {getRankIcon(user.rank) || `#${user.rank}`}
        </Text>
      </View>

      <View style={styles.userColumn}>
        <Text style={[styles.userName, !isDarkMode && styles.userNameLight]}>
          {user.first_name || 'Anonymous'}
        </Text>
        <Text style={[styles.userLevel, !isDarkMode && styles.userLevelLight]}>
          Level {user.level || 1}
        </Text>
      </View>

      <View style={styles.xpColumn}>
        <Text style={[styles.xpText, !isDarkMode && styles.xpTextLight]}>
          {user.exp.toLocaleString()} XP
        </Text>
        <View style={[styles.xpBar, !isDarkMode && styles.xpBarLight]}>
          <View
            style={[
              styles.xpFill,
              { width: `${getExpBarWidth(user.exp, maxExp)}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );

  const maxExp = leaders.length > 0 ? leaders[0].exp : 1;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1abc9c" />
        <Text style={[styles.loadingText, !isDarkMode && styles.loadingTextLight]}>
          Loading leaderboard...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#e74c3c" />
        <Text style={[styles.errorText, !isDarkMode && styles.errorTextLight]}>
          {error}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLeaderboard}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, !isDarkMode && styles.containerLight]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1abc9c']}
          tintColor="#1abc9c"
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, !isDarkMode && styles.headerLight]}>
        <View style={styles.headerContent}>
          <Ionicons name="trophy" size={28} color="#1abc9c" />
          <Text style={[styles.headerTitle, !isDarkMode && styles.headerTitleLight]}>
            Top Performers
          </Text>
        </View>
        <Text style={[styles.headerSubtitle, !isDarkMode && styles.headerSubtitleLight]}>
          {totalParticipants} Lifters Competing
        </Text>
      </View>

      {userRank && (
        <View style={[styles.userStats, !isDarkMode && styles.userStatsLight]}>
          <Text style={[styles.userStatsText, !isDarkMode && styles.userStatsTextLight]}>
            Rank #{userRank} • Top {userPercentile}%
          </Text>
        </View>
      )}

      {/* Top 3 Podium */}
      {leaders.length >= 3 && (
        <View style={[styles.podium, !isDarkMode && styles.podiumLight]}>
          {/* Second Place */}
          <View style={[styles.podiumItem, styles.secondPlace]}>
            <View style={[styles.podiumRank, styles.silverRank]}>
              <Text style={styles.podiumRankText}>2</Text>
            </View>
            <Text style={[styles.podiumName, !isDarkMode && styles.podiumNameLight]}>
              {leaders[1].first_name || 'Anonymous'}
            </Text>
            <Text style={styles.podiumExp}>{leaders[1].exp.toLocaleString()} XP</Text>
            <Text style={[styles.podiumLevel, !isDarkMode && styles.podiumLevelLight]}>
              Level {leaders[1].level || 1}
            </Text>
          </View>

          {/* First Place */}
          <View style={[styles.podiumItem, styles.firstPlace]}>
            <View style={[styles.crownContainer]}>
              <Text style={styles.crown}>👑</Text>
            </View>
            <View style={[styles.podiumRank, styles.goldRank]}>
              <Text style={styles.podiumRankText}>1</Text>
            </View>
            <Text style={[styles.podiumName, styles.championName, !isDarkMode && styles.podiumNameLight]}>
              {leaders[0].first_name || 'Anonymous'}
            </Text>
            <Text style={[styles.podiumExp, styles.championExp]}>{leaders[0].exp.toLocaleString()} XP</Text>
            <Text style={[styles.podiumLevel, !isDarkMode && styles.podiumLevelLight]}>
              Level {leaders[0].level || 1}
            </Text>
          </View>

          {/* Third Place */}
          <View style={[styles.podiumItem, styles.thirdPlace]}>
            <View style={[styles.podiumRank, styles.bronzeRank]}>
              <Text style={styles.podiumRankText}>3</Text>
            </View>
            <Text style={[styles.podiumName, !isDarkMode && styles.podiumNameLight]}>
              {leaders[2].first_name || 'Anonymous'}
            </Text>
            <Text style={styles.podiumExp}>{leaders[2].exp.toLocaleString()} XP</Text>
            <Text style={[styles.podiumLevel, !isDarkMode && styles.podiumLevelLight]}>
              Level {leaders[2].level || 1}
            </Text>
          </View>
        </View>
      )}

      {/* Full Leaderboard Table */}
      <View style={[styles.tableContainer, !isDarkMode && styles.tableContainerLight]}>
        <View style={[styles.tableHeader, !isDarkMode && styles.tableHeaderLight]}>
          <Text style={[styles.tableHeaderText, !isDarkMode && styles.tableHeaderTextLight]}>
            Full Rankings
          </Text>
        </View>

        {leaders.map((user, index) => (
          <LeaderboardRow key={user.user_id || index} user={user} index={index} />
        ))}
      </View>

      {/* Footer Info */}
      <View style={[styles.footer, !isDarkMode && styles.footerLight]}>
        <Text style={[styles.footerText, !isDarkMode && styles.footerTextLight]}>
          Rankings update in real-time • Pull to refresh
        </Text>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerLight: {
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  loadingTextLight: {
    color: '#1a1a1a',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorTextLight: {
    color: '#dc3545',
  },
  retryButton: {
    backgroundColor: '#1abc9c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Header
  header: {
    backgroundColor: '#111',
    padding: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  headerLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  headerTitleLight: {
    color: '#1a1a1a',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 14,
    marginLeft: 40,
  },
  headerSubtitleLight: {
    color: '#6c757d',
  },

  userStats: {
    backgroundColor: '#111',
    marginHorizontal: 15,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  userStatsLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  userStatsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userStatsTextLight: {
    color: '#1a1a1a',
  },

  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    backgroundColor: '#111',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  podiumLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 15,
  },
  firstPlace: {
    transform: [{ scale: 1.1 }],
    zIndex: 3,
  },
  secondPlace: {
    marginTop: 20,
    zIndex: 2,
  },
  thirdPlace: {
    marginTop: 30,
    zIndex: 1,
  },
  crownContainer: {
    position: 'absolute',
    top: -25,
    zIndex: 4,
  },
  crown: {
    fontSize: 24,
  },
  podiumRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  goldRank: {
    backgroundColor: '#FFD700',
  },
  silverRank: {
    backgroundColor: '#C0C0C0',
  },
  bronzeRank: {
    backgroundColor: '#CD7F32',
  },
  podiumRankText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  podiumName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumNameLight: {
    color: '#1a1a1a',
  },
  championName: {
    fontSize: 18,
    color: '#FFD700',
  },
  podiumExp: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  championExp: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  podiumLevel: {
    color: '#666',
    fontSize: 12,
  },
  podiumLevelLight: {
    color: '#6c757d',
  },

  // Table
  tableContainer: {
    backgroundColor: '#111',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tableContainerLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  tableHeader: {
    backgroundColor: '#1abc9c',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tableHeaderLight: {
    backgroundColor: '#1abc9c',
  },
  tableHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tableHeaderTextLight: {
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tableRowLight: {
    borderBottomColor: '#e9ecef',
  },
  firstPlaceRow: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  secondPlaceRow: {
    backgroundColor: 'rgba(192, 192, 192, 0.1)',
  },
  thirdPlaceRow: {
    backgroundColor: 'rgba(205, 127, 50, 0.1)',
  },
  rankColumn: {
    width: 50,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rankTextLight: {
    color: '#1a1a1a',
  },
  userColumn: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  userNameLight: {
    color: '#1a1a1a',
  },
  userLevel: {
    color: '#666',
    fontSize: 12,
  },
  userLevelLight: {
    color: '#6c757d',
  },
  xpColumn: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  xpText: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  xpTextLight: {
    color: '#17a2b8',
  },
  xpBar: {
    width: 80,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  xpBarLight: {
    backgroundColor: '#e9ecef',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#1abc9c',
    borderRadius: 2,
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerLight: {
    backgroundColor: 'transparent',
  },
  footerText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  footerTextLight: {
    color: '#6c757d',
  },
});

export default Leaderboard;
