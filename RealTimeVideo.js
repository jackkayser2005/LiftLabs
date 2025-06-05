// RealTimeVideo.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function RealTimeVideo({ goBack }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // If the user denies camera permissions, show an alert and go back.
  useEffect(() => {
    if (hasPermission === false) {
      Alert.alert(
        'Camera Permission',
        'We need access to your camera to show the live feed.',
        [
          {
            text: 'OK',
            onPress: () => {
              goBack();
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [hasPermission]);

  if (hasPermission === null) {
    // Still asking for permission
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1abc9c" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    // Permission denied (we already show an Alert and called goBack(), but in case)
    return null;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        type={Camera.Constants.Type.front}
        onCameraReady={() => setIsReady(true)}
      />
      {!isReady && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1abc9c" />
          <Text style={styles.loadingText}>Starting camera...</Text>
        </View>
      )}

      {/* Overlay UI */}
      <View style={styles.overlay}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>Live Analysis</Text>
        </View>
        {/* If you want to overlay other UI (e.g. real-time feedback), you can add it here */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#fff',
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 24,
  },
  labelContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  labelText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
