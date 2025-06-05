// UploadVideo.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { VideoView as Video } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';
import { supabase } from './supabaseClient'; // adjust path if needed

import styles from './styles';
import popUpStyles from './popUpStyles';

const MAX_VIDEOS = 20;

export default function UploadVideo({ session, isDarkMode, navigateToLive }) {
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [videoTab, setVideoTab] = useState('upload');
  const videoRef = useRef(null);

  // indicator animation (if you want to keep a little fancy dot or something)
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // ─── Load existing videos ─────────────────────────────────────────
  useEffect(() => {
    async function loadVideos() {
      try {
        setLoadingVideos(true);
        const { data, error } = await supabase
          .from('videos')
          .select('id, storage_url, thumb_url, score, critique')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(MAX_VIDEOS);

        if (!error && data) {
          const mapped = data.map((v) => ({
            id: v.id.toString(),
            uri: v.storage_url,
            thumb: v.thumb_url,
            score: v.score,
            critique: v.critique,
          }));
          setVideos(mapped);
        }
      } finally {
        setLoadingVideos(false);
      }
    }

    if (session?.user) {
      loadVideos();
    }
  }, [session]);

  // ─── Select & upload a video ──────────────────────────────────────
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

        const fileData = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { error: uploadError } = await supabase.storage
          .from('videos')
          .upload(fileName, Buffer.from(fileData, 'base64'), {
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
      setUploading(false);
    }
  };

  const deleteVideo = (v) => {
    setVideos((prev) => prev.filter((x) => x.id !== v.id));
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <View style={[styles.container, !isDarkMode && styles.containerLight]}>
      {/* Tab Buttons */}
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
          onPress={() => {
            if (navigateToLive) {
              setVideoTab('live');
              navigateToLive(); // parent can switch screen to 'realtime'
            } else {
              Alert.alert('Premium Feature', 'Real-time analysis is available for Pro users.');
            }
          }}
        >
          <Text style={videoTab === 'live' ? styles.videoTabTextActive : styles.videoTabText}>
            Live Workout
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading / Upload Overlay */}
      {(uploading || loadingVideos) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#1abc9c" />
          <Text style={styles.uploadText}>
            {uploading ? 'Uploading...' : 'Loading...'}
          </Text>
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
              <Text style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}>
                No videos yet
              </Text>
              <Text style={[styles.emptySubtext, !isDarkMode && styles.emptySubtextLight]}>
                Tap the + button to add your first workout video
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.tipBanner, !isDarkMode && styles.tipBannerLight]}>
                <TouchableOpacity style={styles.tipContent} onPress={() => Alert.alert('Tip', 'Tap videos for options • Need help?')}>
                  <Ionicons name="information-circle" size={16} color="#1abc9c" />
                  <Text style={[styles.tipText, !isDarkMode && styles.tipTextLight]}>
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
          )
        ) : (
          <View style={styles.liveLocked}>
            <Ionicons name="lock-closed" size={64} color="#1abc9c" />
            <Text style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}>
              Real-time analysis coming soon
            </Text>
          </View>
        )}
      </ScrollView>

      {/* + Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={selectVideo}
        disabled={uploading || videos.length >= MAX_VIDEOS}
      >
        <Ionicons name="add-circle" size={56} color="#1abc9c" />
      </TouchableOpacity>

      {/* Detailed Video Modal */}
      {detail && (
        <Modal transparent={false} animationType="slide" visible onRequestClose={() => setDetail(null)}>
          <View style={[styles.container, !isDarkMode && styles.containerLight]}>
            <Video
              ref={videoRef}
              source={{ uri: detail.uri }}
              style={{ flex: 1 }}
              resizeMode="contain"
              useNativeControls
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
                  onPress={() => videoRef.current?.seekTo?.(0)}
                >
                  <Ionicons name="play-back" size={20} color="#1abc9c" />
                  <Text style={styles.actionBtnText}>Replay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.liveBtn]}
                  onPress={() => {
                    setDetail(null);
                    if (navigateToLive) navigateToLive();
                  }}
                >
                  <Ionicons name="videocam" size={20} color="#1abc9c" />
                  <Text style={styles.actionBtnText}>Live</Text>
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
}
