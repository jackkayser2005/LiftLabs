import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { VideoView as Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import BodyFatCalculator from './body-fat';

const MAX_VIDEOS = 20;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [videos, setVideos] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastTappedTab, setLastTappedTab] = useState(null);
  const videoPlayer = useRef(null);

  // Permissions on mount
  React.useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  // Select/upload video
  const selectVideo = async () => {
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert('Limit reached', `You can only keep ${MAX_VIDEOS} videos right now. Delete one first.`);
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera-roll permission to pick a video!');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
        const score = Math.floor(Math.random() * 41) + 60;
        const critique = score > 85 ? 'Great depth & knee tracking!' : 'Work on hip depth and keeping knees out.';
        setVideos(prev => [
          ...prev,
          { id: Date.now().toString(), uri: asset.uri, thumb: thumbUri, score, critique },
        ]);
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  // Enhanced tab navigation
  const handleTabPress = (screen) => {
    if (screen === 'home') {
      if (currentScreen === 'home' && lastTappedTab === 'home') {
        // Second tap on home - trigger video selection
        selectVideo();
      } else {
        // First tap on home - just navigate
        setCurrentScreen('home');
        setLastTappedTab('home');
      }
    } else {
      setCurrentScreen(screen);
      setLastTappedTab(screen);
    }
  };

  // Video tap/hold handlers with enhanced options
  const handleVideoPress = (video) => {
    Alert.alert(
      'Video Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Analyze & Watch', 
          onPress: () => setDetail(video)
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => handleVideoDelete(video)
        },
      ]
    );
  };

  const handleVideoDelete = (video) => {
    Alert.alert('Delete video?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setVideos(prev => prev.filter((v) => v.id !== video.id)),
      },
    ]);
  };

  const closeDetail = () => setDetail(null);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // NAVBAR
  const renderNavbar = () => (
    <View style={[styles.navbar, !isDarkMode && styles.navbarLight]}>
      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('calories')}>
        <Ionicons name="calculator" size={24} color={currentScreen === 'calories' ? '#1abc9c' : (isDarkMode ? '#666' : '#999')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('body')}>
        <Ionicons name="body" size={24} color={currentScreen === 'body' ? '#1abc9c' : (isDarkMode ? '#666' : '#999')} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navMainBtn}
        onPress={() => handleTabPress('home')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('strength')}>
        <Ionicons name="barbell" size={24} color={currentScreen === 'strength' ? '#1abc9c' : (isDarkMode ? '#666' : '#999')} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem} onPress={() => handleTabPress('leaderboard')}>
        <Ionicons name="trophy" size={24} color={currentScreen === 'leaderboard' ? '#1abc9c' : (isDarkMode ? '#666' : '#999')} />
      </TouchableOpacity>
    </View>
  );

  // HEADER
  const renderHeader = () => (
    <View style={[styles.header, !isDarkMode && styles.headerLight]}>
      <Text style={[styles.headerTitle, !isDarkMode && styles.headerTitleLight]}>LiftLabs</Text>
      <TouchableOpacity style={styles.userBtn} onPress={() => setCurrentScreen('profile')}>
        <Ionicons name="person-circle" size={32} color="#1abc9c" />
      </TouchableOpacity>
    </View>
  );

  const renderBackButton = () => (
    <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('home')}>
      <Ionicons name="arrow-back" size={24} color="#1abc9c" />
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
  );

  // Enhanced Tooltip Component
  const renderTooltip = () => (
    showTooltip && (
      <Modal transparent animationType="fade" visible onRequestClose={() => setShowTooltip(false)}>
        <TouchableOpacity 
          style={styles.tooltipOverlay} 
          activeOpacity={1} 
          onPress={() => setShowTooltip(false)}
        >
          <View style={[styles.tooltipContainer, !isDarkMode && styles.tooltipContainerLight]}>
            <View style={styles.tooltipHeader}>
              <Ionicons name="information-circle" size={24} color="#1abc9c" />
              <Text style={[styles.tooltipTitle, !isDarkMode && styles.tooltipTitleLight]}>
                Video Analysis Guide
              </Text>
            </View>
            <Text style={[styles.tooltipText, !isDarkMode && styles.tooltipTextLight]}>
              📱 <Text style={styles.tooltipBold}>Tap a video</Text> to see analysis options
            </Text>
            <Text style={[styles.tooltipText, !isDarkMode && styles.tooltipTextLight]}>
              🎯 <Text style={styles.tooltipBold}>AI Analysis</Text> scores your form out of 100
            </Text>
            <Text style={[styles.tooltipText, !isDarkMode && styles.tooltipTextLight]}>
              📊 <Text style={styles.tooltipBold}>Green scores (85+)</Text> = Excellent form
            </Text>
            <Text style={[styles.tooltipText, !isDarkMode && styles.tooltipTextLight]}>
              🔄 <Text style={styles.tooltipBold}>Replay feature</Text> helps you study technique
            </Text>
            <Text style={[styles.tooltipText, !isDarkMode && styles.tooltipTextLight]}>
              🗑️ <Text style={styles.tooltipBold}>Delete option</Text> removes unwanted videos
            </Text>
            <TouchableOpacity 
              style={styles.tooltipCloseBtn} 
              onPress={() => setShowTooltip(false)}
            >
              <Text style={styles.tooltipCloseText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    )
  );

  // HOME
  const renderHomeScreen = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {renderHeader()}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {videos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color={isDarkMode ? '#666' : '#999'} />
            <Text style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}>No videos yet</Text>
            <Text style={[styles.emptySubtext, !isDarkMode && styles.emptySubtextLight]}>
              Tap the + button to add your first workout video
            </Text>
            <TouchableOpacity 
              style={styles.getStartedBtn} 
              onPress={() => setShowTooltip(true)}
            >
              <Ionicons name="help-circle-outline" size={20} color="#1abc9c" />
              <Text style={styles.getStartedText}>How it works</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={[styles.tipBanner, !isDarkMode && styles.tipBannerLight]}>
              <TouchableOpacity 
                style={styles.tipContent}
                onPress={() => setShowTooltip(true)}
              >
                <Ionicons name="information-circle" size={16} color="#1abc9c" />
                <Text style={[styles.tipText, !isDarkMode && styles.tipTextLight]}>
                  Tap videos for options • Need help?
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.videoGrid}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={[styles.videoItem, !isDarkMode && styles.videoItemLight]}
                  onPress={() => handleVideoPress(video)}
                >
                  <Image source={{ uri: video.thumb }} style={styles.videoThumbnail} resizeMode="cover" />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.85)" />
                  </View>
                  <View style={[
                    styles.scoreBadge, 
                    video.score >= 85 ? styles.scoreBadgeExcellent : 
                    video.score >= 75 ? styles.scoreBadgeGood : styles.scoreBadgeNeedsWork
                  ]}>
                    <Text style={styles.scoreText}>{video.score}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      {renderNavbar()}
      {renderTooltip()}

      {/* Enhanced Video Modal */}
      {detail && (
        <Modal animationType="slide" transparent={false} visible onRequestClose={closeDetail}>
          <View style={[styles.container, !isDarkMode && styles.containerLight]}>
            <Video
              ref={videoPlayer}
              source={{ uri: detail.uri }}
              style={{ flex: 1 }}
              resizeMode="contain"
              useNativeControls
              onPlaybackStatusUpdate={async (status) => {
                if (status.isLoaded === false && status.error) {
                  const local = `${FileSystem.cacheDirectory}${detail.id}.mp4`;
                  await FileSystem.copyAsync({ from: detail.uri, to: local });
                  if (videoPlayer.current) {
                    videoPlayer.current.setSource({ uri: local });
                  }
                }
              }}
            />
            <View style={[styles.analysisPanel, !isDarkMode && styles.analysisPanelLight]}>
              <View style={styles.scoreDisplay}>
                <Text style={[styles.scoreTitle, !isDarkMode && styles.scoreTitleLight]}>
                  Form Analysis
                </Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreLarge}>{detail.score}</Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
              </View>
              <Text style={[styles.critiqueText, !isDarkMode && styles.critiqueTextLight]}>
                {detail.critique}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.replayBtn]}
                  onPress={async () => {
                    if (videoPlayer.current) {
                      try {
                        await videoPlayer.current.seekTo(0, { toleranceMillis: 100 });
                      } catch (e) {
                        console.log('Replay failed', e);
                      }
                    }
                  }}
                >
                  <Ionicons name="play-back" size={20} color="#1abc9c" />
                  <Text style={styles.actionBtnText}>Replay</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, styles.closeBtn]} 
                  onPress={closeDetail}
                >
                  <Text style={styles.actionBtnTextWhite}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );

  // Enhanced Profile Screen with Settings
  const renderProfileScreen = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {renderHeader()}
      {renderBackButton()}
      <ScrollView style={styles.profileContent}>
        <View style={[styles.profileHeader, !isDarkMode && styles.profileHeaderLight]}>
          <Ionicons name="person-circle" size={100} color="#1abc9c" />
          <Text style={[styles.profileName, !isDarkMode && styles.profileNameLight]}>John Doe</Text>
          <Text style={[styles.profileEmail, !isDarkMode && styles.profileEmailLight]}>john.doe@email.com</Text>
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Settings</Text>
          <TouchableOpacity 
            style={[styles.settingItem, !isDarkMode && styles.settingItemLight]}
            onPress={toggleTheme}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isDarkMode ? "moon" : "sunny"} 
                size={24} 
                color="#1abc9c" 
              />
              <Text style={[styles.settingText, !isDarkMode && styles.settingTextLight]}>
                {isDarkMode ? 'Dark Mode' : 'Light Mode'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={isDarkMode ? '#666' : '#999'} />
          </TouchableOpacity>
        </View>

        {/* Level Section */}
        <View style={styles.levelSection}>
          <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Level & Rank</Text>
          <View style={[styles.levelCard, !isDarkMode && styles.levelCardLight]}>
            <View style={styles.levelInfo}>
              <Text style={styles.levelNumber}>Level 12</Text>
              <Text style={styles.rankText}>Gold Tier</Text>
            </View>
            <View style={[styles.progressBar, !isDarkMode && styles.progressBarLight]}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
            <Text style={[styles.progressText, !isDarkMode && styles.progressTextLight]}>650 / 1000 XP</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>Stats</Text>
          <View style={[styles.statRow, !isDarkMode && styles.statRowLight]}>
            <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>Workouts Completed:</Text>
            <Text style={styles.statValue}>47</Text>
          </View>
          <View style={[styles.statRow, !isDarkMode && styles.statRowLight]}>
            <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>Total Videos:</Text>
            <Text style={styles.statValue}>{videos.length}</Text>
          </View>
          <View style={[styles.statRow, !isDarkMode && styles.statRowLight]}>
            <Text style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}>Streak:</Text>
            <Text style={styles.statValue}>5 days</Text>
          </View>
        </View>
      </ScrollView>
      {renderNavbar()}
    </View>
  );

  // Body Fat Calculator Screen
  const renderBodyScreen = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {renderHeader()}
      {renderBackButton()}
      <BodyFatCalculator isDarkMode={isDarkMode} />
      {renderNavbar()}
    </View>
  );

  // Placeholder screens with improved styling
  const renderPlaceholderScreen = (icon, title) => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {renderHeader()}
      {renderBackButton()}
      <View style={styles.center}>
        <Ionicons name={icon} size={64} color="#1abc9c" />
        <Text style={[styles.screenTitle, !isDarkMode && styles.screenTitleLight]}>{title}</Text>
        <Text style={[styles.screenSubtitle, !isDarkMode && styles.screenSubtitleLight]}>Coming Soon</Text>
      </View>
      {renderNavbar()}
    </View>
  );

  // Router
  switch (currentScreen) {
    case 'home':
      return renderHomeScreen();
    case 'calories':
      return renderPlaceholderScreen('calculator', 'Calorie Tracker');
    case 'body':
      return renderBodyScreen();
    case 'strength':
      return renderPlaceholderScreen('barbell', 'Strength Training');
    case 'leaderboard':
      return renderPlaceholderScreen('trophy', 'Leaderboard');
    case 'profile':
      return renderProfileScreen();
    default:
      return renderHomeScreen();
  }
}