import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function RealTimeVideo({ goBack }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [analysis, setAnalysis] = useState({ strengths: [], weaknesses: [] });
  const cameraRef = useRef(null);

  // Request camera permission on mount
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Poll frames while capturing
  useEffect(() => {
    let timer;
    if (capturing) {
      timer = setInterval(analyzeFrame, 2000);
    }
    return () => timer && clearInterval(timer);
  }, [capturing]);

  async function analyzeFrame() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
      // TODO: Replace placeholder with OpenCV + form-checker pose detection
      // Example: const result = await formChecker.analyze(photo.uri);
      // setAnalysis(result);
      setAnalysis({
        strengths: ['Back alignment'],
        weaknesses: ['Knee valgus'],
      });
    } catch {
      // ignore errors
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.center}><Text>Requesting camera permission...</Text></View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <TouchableOpacity style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} ref={cameraRef} type={Camera.Constants.Type.front} />
      <View style={styles.overlay} pointerEvents="none">
        <Text style={styles.label}>Strengths:</Text>
        {analysis.strengths.map((s, i) => (
          <Text key={`s-${i}`} style={styles.text}>{s}</Text>
        ))}
        <Text style={[styles.label, { marginTop: 8 }]}>Weak Points:</Text>
        {analysis.weaknesses.map((w, i) => (
          <Text key={`w-${i}`} style={styles.text}>{w}</Text>
        ))}
      </View>
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.captureBtn}
          onPress={() => setCapturing((v) => !v)}
        >
          <Ionicons name={capturing ? 'pause' : 'play'} size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={goBack}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
  },
  label: {
    color: '#fff',
    fontWeight: '600',
  },
  text: {
    color: '#fff',
    marginLeft: 4,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  captureBtn: {
    backgroundColor: '#1abc9c',
    padding: 16,
    borderRadius: 30,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 30,
  },
  backBtn: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1abc9c',
  },
  backText: {
    color: '#fff',
  },
});

