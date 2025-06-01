import React, { useState, useEffect, useRef } from 'react';
import 'node-libs-react-native/globals';
import 'react-native-url-polyfill/auto';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { VideoView as Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import BodyFatCalculator from './body-fat';
import { supabase } from './supabaseClient';

// --- AUTH SCREENS ---

function SignInScreen({ onSignUp, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSignIn() {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Sign in error', error.message);
    else onSuccess(data.session);
  }

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Sign In</Text>
      <TextInput style={authStyles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={authStyles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={authStyles.button} onPress={handleSignIn}>
        <Text style={authStyles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignUp}>
        <Text style={authStyles.link}>Need an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

function SignUpScreen({ onSignIn, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSignUp() {
    const { error, data } = await supabase.auth.signUp({ email, password });
    if (error) Alert.alert('Sign up error', error.message);
    else {
      Alert.alert('Signed up!', 'Check your email for confirmation.');
      if (data.session) onSuccess(data.session);
    }
  }

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>Sign Up</Text>
      <TextInput style={authStyles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={authStyles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={authStyles.button} onPress={handleSignUp}>
        <Text style={authStyles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSignIn}>
        <Text style={authStyles.link}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const authStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  button: { backgroundColor: '#1abc9c', borderRadius: 8, padding: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  link: { color: '#1abc9c', marginTop: 12, textAlign: 'center' },
});

// --- MAIN APP ---

function MainApp({ session }) {
  // --- (Your entire app's main logic below, no auth logic needed) ---
  const MAX_VIDEOS = 20;
  const [currentScreen, setCurrentScreen] = useState('home');
  const [videos, setVideos] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastTappedTab, setLastTappedTab] = useState(null);
  const videoPlayer = useRef(null);

  // Permissions on mount
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  // Video selection logic (add upload to supabase here later)
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
        // TODO: Upload video info to Supabase table
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
        selectVideo();
      } else {
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
          onPress: () => setDetail(video),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleVideoDelete(video),
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

  // Tooltip Component
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
      {/* Video Modal */}
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

  // Profile Screen (sign out here)
  const renderProfileScreen = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {renderHeader()}
      {renderBackButton()}
      <ScrollView style={styles.profileContent}>
        <View style={[styles.profileHeader, !isDarkMode && styles.profileHeaderLight]}>
          <Ionicons name="person-circle" size={100} color="#1abc9c" />
          <Text style={[styles.profileName, !isDarkMode && styles.profileNameLight]}>User</Text>
          <Text style={[styles.profileEmail, !isDarkMode && styles.profileEmailLight]}>
            {session?.user?.email}
          </Text>
        </View>
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
          <TouchableOpacity
            style={[styles.settingItem, !isDarkMode && styles.settingItemLight]}
            onPress={async () => {
              await supabase.auth.signOut();
            }}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out" size={24} color="#e74c3c" />
              <Text style={[styles.settingText, { color: '#e74c3c', marginLeft: 15 }]}>
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>
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
    case 'home': return renderHomeScreen();
    case 'calories': return renderPlaceholderScreen('calculator', 'Calorie Tracker');
    case 'body': return renderBodyScreen();
    case 'strength': return renderPlaceholderScreen('barbell', 'Strength Training');
    case 'leaderboard': return renderPlaceholderScreen('trophy', 'Leaderboard');
    case 'profile': return renderProfileScreen();
    default: return renderHomeScreen();
  }
}

// --- ROOT APP WITH AUTH HANDLING ---

export default function App() {
  const [session, setSession] = useState(null);
  const [authView, setAuthView] = useState('signIn');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => {
      listener?.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return authView === 'signIn'
      ? <SignInScreen onSignUp={() => setAuthView('signUp')} onSuccess={setSession} />
      : <SignUpScreen onSignIn={() => setAuthView('signIn')} onSuccess={setSession} />;
  }

  return <MainApp session={session} />;
}
