// MainApp.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import { VideoView as Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import ProfileScreen         from './ProfileScreen';
import BodyFatCalculator    from './body-fat';
import styles               from './styles';
import { supabase }         from './supabaseClient';

export default function MainApp({ session, dark, toggleDark }) {
  const MAX_VIDEOS = 20;
  const [currentScreen, setCurrentScreen] = useState('home');
  const [videos, setVideos]               = useState([]);
  const [detail, setDetail]               = useState(null);
  const [showTooltip, setShowTooltip]     = useState(false);
  const [lastTab, setLastTab]             = useState(null);
  const [avatarUrl, setAvatarUrl]         = useState('');

  const videoRef = useRef(null);

  useEffect(() => {
    async function fetchAvatar() {
      try {
        const { data, error } = await supabase
          .from('profile')
          .select('avatar_url')
          .eq('id', session.user.id)
          .single();
        if (!error && data) {
          setAvatarUrl(data.avatar_url || '');
        }
      } catch {
        // ignore
      }
    }

    if (session && session.user) {
      fetchAvatar();
    } else {
      setAvatarUrl('');
    }
  }, [session]);

  // Helper: pick a video, upload storage → insert row into `videos`
  const selectVideo = async () => {
    if (videos.length >= MAX_VIDEOS) {
      return Alert.alert(
        'Limit reached',
        `You can only keep ${MAX_VIDEOS} videos right now. Delete one first.`
      );
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        return Alert.alert(
          'Permission needed',
          'We need camera-roll permission to pick a video!'
        );
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        aspect: [16, 9],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        // 1) thumbnail
        const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 0 });
        // 2) random score & critique
        const score = Math.floor(Math.random() * 41) + 60;
        const critique = score > 85
          ? 'Great depth & knee tracking!'
          : 'Work on hip depth and keeping knees out.';
        // 3) optimistic UI update
        const localID = Date.now().toString();
        setVideos((prev) => [
          ...prev,
          { id: localID, uri: asset.uri, thumb: thumbUri, score, critique },
        ]);

        // 4) upload video to Supabase Storage
        const userId = session.user.id;
        const fileExt = asset.uri.split('.').pop();
        const fileName = `${userId}/${localID}.${fileExt}`;
        const videoData = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, Buffer.from(videoData, 'base64'), {
            contentType: 'video/mp4',
          });
        if (uploadError) {
          console.warn('Storage upload error:', uploadError);
          Alert.alert('Upload failed', 'Could not upload video to storage.');
          return;
        }

        // 5) public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from('videos').getPublicUrl(fileName);

        // 6) insert into `videos` table
        const { error: dbError } = await supabase
          .from('videos')
          .insert([
            {
              user_id: userId,
              video_url: publicUrl,
              thumb_url: thumbUri,
              score,
              critique,
            },
          ]);
        if (dbError) {
          console.warn('DB insert error:', dbError);
          Alert.alert('Upload failed', 'Could not insert video record.');
        }
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to select video');
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

  const deleteVideo = (v) =>
    setVideos((prev) => prev.filter((x) => x.id !== v.id));

  const Navbar = () => (
    <View style={[styles.navbar, !dark && styles.navbarLight]}>
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
                : dark ? '#666' : '#999'
            }
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const Header = () => (
    <View style={[styles.header, !dark && styles.headerLight]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={require('./images/logo.png')}
          style={{ width: 24, height: 24, marginRight: 6, borderRadius: 4 }}
        />
        <Text style={[styles.headerTitle, !dark && styles.headerTitleLight]}>
          LiftLabs
        </Text>
      </View>
      <TouchableOpacity onPress={() => setCurrentScreen('profile')}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        ) : (
          <Ionicons name="person-circle" size={32} color="#1abc9c" />
        )}
      </TouchableOpacity>
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

  const Home = () => (
    <View style={[styles.container, !dark && styles.containerLight]}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {videos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="videocam-outline"
              size={64}
              color={dark ? '#666' : '#999'}
            />
            <Text style={[styles.emptyText, !dark && styles.emptyTextLight]}>
              No videos yet
            </Text>
            <Text style={[styles.emptySubtext, !dark && styles.emptySubtextLight]}>
              Tap the + button to add your first workout video
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.tipBanner, !dark && styles.tipBannerLight]}>
              <TouchableOpacity
                style={styles.tipContent}
                onPress={() => setShowTooltip(true)}
              >
                <Ionicons name="information-circle" size={16} color="#1abc9c" />
                <Text style={[styles.tipText, !dark && styles.tipTextLight]}>
                  Tap videos for options • Need help?
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.videoGrid}>
              {videos.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.videoItem, !dark && styles.videoItemLight]}
                  onPress={() =>
                    Alert.alert('Video Options', 'What would you like to do?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Analyze & Watch', onPress: () => setDetail(v) },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteVideo(v) },
                    ])
                  }
                >
                  <Image source={{ uri: v.thumb }} style={styles.videoThumbnail} />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={32} color="rgba(255,255,255,0.85)" />
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
          <View style={[styles.container, !dark && styles.containerLight]}>
            <Video
              ref={videoRef}
              source={{ uri: detail.uri }}
              style={{ flex: 1 }}
              resizeMode="contain"
              useNativeControls
            />
            <View style={[styles.analysisPanel, !dark && styles.analysisPanelLight]}>
              <View style={styles.scoreDisplay}>
                <Text style={[styles.scoreTitle, !dark && styles.scoreTitleLight]}>
                  Form Analysis
                </Text>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreLarge}>{detail.score}</Text>
                  <Text style={styles.scoreOutOf}>/100</Text>
                </View>
              </View>
              <Text style={[styles.critiqueText, !dark && styles.critiqueTextLight]}>
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
    <View style={[styles.container, !dark && styles.containerLight]}>
      <Header />
      <BackBtn />
      <BodyFatCalculator isDarkMode={dark} />
      <Navbar />
    </View>
  );

  const Placeholder = (icon, title) => (
    <View style={[styles.container, !dark && styles.containerLight]}>
      <Header />
      <BackBtn />
      <View style={styles.center}>
        <Ionicons name={icon} size={64} color="#1abc9c" />
        <Text style={[styles.screenTitle, !dark && styles.screenTitleLight]}>{title}</Text>
        <Text style={[styles.screenSubtitle, !dark && styles.screenSubtitleLight]}>
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
      return Placeholder('calculator', 'Calorie Tracker');
    case 'strength':
      return Placeholder('barbell', 'Strength Training');
    case 'leaderboard':
      return Placeholder('trophy', 'Leaderboard');
    case 'profile':
      return (
        <ProfileScreen
          session={session}
          dark={dark}
          toggleDark={toggleDark}
          goBack={() => setCurrentScreen('home')}
          onLogout={async () => {
            await supabase.auth.signOut();
          }}
          onAvatarUpdate={setAvatarUrl}
        />
      );
    default:
      return <Home />;
  }
}
