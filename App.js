import React, { useState, useEffect, useRef } from 'react';
import 'node-libs-react-native/globals';
import 'react-native-url-polyfill/auto';
import StrengthTraining from './StrengthTraining';

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { VideoView as Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

import SignInScreen from './SignInScreen';
import SignUpScreen from './SignUpScreen';
import ProfileScreen from './ProfileScreen';
import BodyFatCalculator from './body-fat';
import CalorieTracker from './CalorieTracker';
import Leaderboard from './leaderboard';

import styles from './styles';      // your existing global styles
import popUpStyles from './popUpStyles';  // new banner styles
import { supabase } from './supabaseClient';

const LIVE_WORKOUT_ENABLED = false;

export default function App() {
  const [session, setSession] = useState(null);
  const [view, setView] = useState('signIn');
  const [loading, setLoading] = useState(true);

  // welcome banner state
  const [showWelcome, setShowWelcome] = useState(false);
  const welcomeAnim = useRef(new Animated.Value(0)).current;

  // keep Supabase auth state in sync
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // trigger welcome banner whenever session becomes non-null
  useEffect(() => {
    if (session) {
      setShowWelcome(true);
      Animated.timing(welcomeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(welcomeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowWelcome(false));
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [session]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return view === 'signIn' ? (
      <SignInScreen
        onSuccess={(sess) => {
          setSession(sess);
        }}
        switchToSignUp={() => setView('signUp')}
      />
    ) : (
      <SignUpScreen
        onSuccess={() => {
          setView('signIn');
        }}
        switchToSignIn={() => setView('signIn')}
      />
    );
  }

  return (
    <MainApp
      session={session}
      setSession={setSession}
      showWelcome={showWelcome}
      setShowWelcome={setShowWelcome}
      welcomeAnim={welcomeAnim}
    />
  );
}

function MainApp({ session, setSession, showWelcome, setShowWelcome, welcomeAnim }) {
  const MAX_VIDEOS = 20;
  const [currentScreen, setCurrentScreen] = useState('home');
  const [videos, setVideos] = useState([]);
  const [detail, setDetail] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lastTab, setLastTab] = useState(null);
  const [videoTab, setVideoTab] = useState('upload');
  const [uploading, setUploading] = useState(false);

  // track streak from calorie_logs
  const [streak, setStreak] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    async function fetchStreak() {
      try {
        const userId = session.user.id;
        let { data: latestLog, error } = await supabase
          .from('calorie_logs')
          .select('streak_days')
          .eq('user_id', userId)
          .order('log_date', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          setStreak(0);
          return;
        }
        if (latestLog) {
          setStreak(latestLog.streak_days || 0);
        } else {
          setStreak(0);
        }
      } catch {
        setStreak(0);
      }
    }

    if (session && session.user) {
      fetchStreak();
    } else {
      setStreak(0);
    }
  }, [session]);

  const selectVideo = async () => {
    if (videos.length >= MAX_VIDEOS) return;

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(asset.uri, {
          time: 0,
        });
        const score = Math.floor(Math.random() * 41) + 60;
        const critique =
          score > 85
            ? 'Great depth & knee tracking!'
            : 'Work on hip depth and keeping knees out.';
        const localID = Date.now().toString();
        setVideos((prev) => [
          ...prev,
          { id: localID, uri: asset.uri, thumb: thumbUri, score, critique },
        ]);

        const userId = session.user.id;
        const fileExt = asset.uri.split('.').pop();
        const fileName = `${userId}/${localID}.${fileExt}`;
        setUploading(true);
        const videoData = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, Buffer.from(videoData, 'base64'), {
            contentType: 'video/mp4',
          });
        if (uploadError) {
          setUploading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('videos').getPublicUrl(fileName);

        await supabase.from('videos').insert([
          {
            user_id: userId,
            storage_url: publicUrl,
            thumb_url: thumbUri,
            exercise: '',
            score,
            critique,
          },
        ]);
        setUploading(false);
      }
    } catch {
      // silent fail
      setUploading(false);
    }
  };

  const pressTab = (tab) => {
    if (tab === 'home') {
      if (currentScreen === 'home' && lastTab === 'home') {
        selectVideo();
      } else {
        setCurrentScreen('home');
      }
    } else {
      setCurrentScreen(tab);
    }
    setLastTab(tab);
  };

  const deleteVideo = (v) => setVideos((prev) => prev.filter((x) => x.id !== v.id));

  const Navbar = () => (
    <View style={[styles.navbar, !isDarkMode && styles.navbarLight]}>
      {[
        ['calculator', 'calories'],
        ['body', 'body'],
        ['add', 'home', true],
        ['barbell', 'strength'],
        ['trophy', 'leaderboard'],
      ].map(([icon, screen, main]) => (
        <TouchableOpacity
          key={screen}
          style={main ? styles.navMainBtn : styles.navItem}
          onPress={() => pressTab(screen)}
        >
          <Ionicons
            name={icon}
            size={main ? 32 : 24}
            color={
              screen === currentScreen
                ? '#1abc9c'
                : isDarkMode
                ? '#666'
                : '#999'
            }
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const Header = () => (
    <View style={[styles.header, !isDarkMode && styles.headerLight]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require('./images/logo.png')}
          style={{ width: 24, height: 24, marginRight: 6, borderRadius: 4 }}
        />
        <Text
          style={[styles.headerTitle, !isDarkMode && styles.headerTitleLight]}
        >
          LiftLabs
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* STREAK DISPLAY */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 20,
          }}
        >
          <Ionicons name="flame" size={20} color="#1abc9c" />
          <Text
            style={{
              color: isDarkMode ? '#fff' : '#1a1a1a',
              marginLeft: 4,
              fontWeight: '600',
            }}
          >
            {streak}-Day
          </Text>
        </View>

        {/* PROFILE BUTTON */}
        <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
          <Ionicons name="person-circle" size={32} color="#1abc9c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const BackBtn = () => (
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => setCurrentScreen('home')}
    >
      <Ionicons name="arrow-back" size={24} color="#1abc9c" />
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
  );

  // ─── Home Screen ───────────────────────────────────────────────────────────────────────────────
  const Home = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      <Header />

      {/* WELCOME BANNER */}
      {showWelcome && (
        <AnimatedGradient
          colors={['#1abc9c', '#16a085']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            popUpStyles.welcomeBanner,
            {
              opacity: welcomeAnim,
              transform: [
                {
                  translateY: welcomeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          {/* rocket icon just for flair */}
          <Ionicons name="rocket" size={24} color="#fff" style={{ marginRight: 8 }} />

          <Text style={popUpStyles.welcomeText}>
            Hey there, {session.user.email.split('@')[0]}! Let’s crush today’s session!
          </Text>

          <TouchableOpacity
            onPress={() => {
              Animated.timing(welcomeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }).start(() => setShowWelcome(false));
            }}
            style={popUpStyles.welcomeClose}
          >
            <Ionicons
              name="close"
              size={20}
              style={popUpStyles.welcomeCloseIcon}
            />
          </TouchableOpacity>
        </AnimatedGradient>
      )}
      <View style={[styles.videoTabs, !isDarkMode && styles.videoTabsLight]}>
        <TouchableOpacity
          style={[styles.videoTabBtn, videoTab === 'upload' && styles.videoTabBtnActive]}
          onPress={() => setVideoTab('upload')}
        >
          <Text style={videoTab === 'upload' ? styles.videoTabTextActive : styles.videoTabText}>
            Upload Video
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.videoTabBtn, videoTab === 'live' && styles.videoTabBtnActive]}
          onPress={() =>
            LIVE_WORKOUT_ENABLED
              ? setVideoTab('live')
              : Alert.alert('Premium Feature', 'Real-time analysis is available for Pro users.')
          }
        >
          <Text style={videoTab === 'live' ? styles.videoTabTextActive : styles.videoTabText}>
            Live Workout
          </Text>
        </TouchableOpacity>
      </View>

      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#1abc9c" />
          <Text style={styles.uploadText}>Uploading...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {videoTab === 'upload' ? (
          videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="videocam-outline"
                size={64}
                color={isDarkMode ? '#666' : '#999'}
              />
              <Text
                style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}
              >
                No videos yet
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  !isDarkMode && styles.emptySubtextLight,
                ]}
              >
                Tap the + button to add your first workout video
              </Text>
            </View>
          ) : (
            <>
              <View
                style={[styles.tipBanner, !isDarkMode && styles.tipBannerLight]}
              >
                <TouchableOpacity
                  style={styles.tipContent}
                  onPress={() => setShowTooltip(true)}
                >
                  <Ionicons name="information-circle" size={16} color="#1abc9c" />
                  <Text
                    style={[styles.tipText, !isDarkMode && styles.tipTextLight]}
                  >
                    Tap videos for options • Need help?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.videoGrid}>
                {videos.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.videoItem, !isDarkMode && styles.videoItemLight]}
                    onPress={() => setDetail(v)}
                  >
                    <Image source={{ uri: v.thumb }} style={styles.videoThumbnail} />
                    <View style={styles.videoOverlay}>
                      <Ionicons
                        name="play-circle"
                        size={32}
                        color="rgba(255,255,255,0.85)"
                      />
                    </View>
                    <View
                      style={[
                        styles.scoreBadge,
                        v.score >= 85
                          ? styles.scoreBadgeExcellent
                          : v.score >= 75
                          ? styles.scoreBadgeGood
                          : styles.scoreBadgeNeedsWork,
                      ]}
                    >
                      <Text style={styles.scoreText}>{v.score}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )
        ) : (
          <View style={styles.liveLocked}>
            <Ionicons name="lock-closed" size={64} color="#1abc9c" />
            <Text
              style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}
            >
              Real-time analysis coming soon
            </Text>
          </View>
        )}
      </ScrollView>
      <Navbar />

      {detail && (
        <Modal
          transparent={false}
          animationType="slide"
          visible
          onRequestClose={() => setDetail(null)}
        >
          <View style={[styles.container, !isDarkMode && styles.containerLight]}>
            <Video
              ref={videoRef}
              source={{ uri: detail.uri }}
              style={{ flex: 1 }}
              resizeMode="contain"
              useNativeControls
            />
            <View
              style={[
                styles.analysisPanel,
                !isDarkMode && styles.analysisPanelLight,
              ]}
            >
              <View style={styles.scoreDisplay}>
                <Text
                  style={[styles.scoreTitle, !isDarkMode && styles.scoreTitleLight]}
                >
                  Form Analysis
                </Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreLarge}>{detail.score}</Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
              </View>
              <Text
                style={[styles.critiqueText, !isDarkMode && styles.critiqueTextLight]}
              >
                {detail.critique}
              </Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.replayBtn]}
                  onPress={() => videoRef.current?.seekTo?.(0)}
                >
                  <Ionicons name="play-back" size={20} color="#1abc9c" />
                  <Text style={styles.actionBtnText}>Replay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.closeBtn]}
                  onPress={() => setDetail(null)}
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

  const Body = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      <Header />
      <BackBtn />
      <BodyFatCalculator isDarkMode={isDarkMode} />
      <Navbar />
    </View>
  );

  const LeaderboardScreen = () => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      <Header />
      <BackBtn />
      <Leaderboard isDarkMode={isDarkMode} />
      <Navbar />
    </View>
  );

  const Placeholder = (icon, title) => (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      <Header />
      <BackBtn />
      <View style={styles.center}>
        <Ionicons name={icon} size={64} color="#1abc9c" />
        <Text style={[styles.screenTitle, !isDarkMode && styles.screenTitleLight]}>
          {title}
        </Text>
        <Text
          style={[styles.screenSubtitle, !isDarkMode && styles.screenSubtitleLight]}
        >
          Coming Soon
        </Text>
      </View>
      <Navbar />
    </View>
  );

  switch (currentScreen) {
    case 'home':
      return <Home />;

    case 'body':
      return <Body />;

    case 'calories':
      return (
        <View style={[styles.container, !isDarkMode && styles.containerLight]}>
          <Header />
          <View style={{ flex: 1 }}>
            <CalorieTracker isDarkMode={isDarkMode} />
          </View>
          <Navbar />
        </View>
      );

    case 'strength':
      return (
        <View style={[styles.container, !isDarkMode && styles.containerLight]}>
          <Header />
          <StrengthTraining
            setCurrentScreen={setCurrentScreen}
            isDarkMode={isDarkMode}
          />
          <Navbar />
        </View>
      );

    case 'leaderboard':
      return <LeaderboardScreen />;

    case 'profile':
      return (
        <ProfileScreen
          session={session}
          dark={isDarkMode}
          toggleDark={() => setIsDarkMode((prev) => !prev)}
          goBack={() => setCurrentScreen('home')}
          onLogout={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
        />
      );

    default:
      return <Home />;
  }
}
