import React from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function TopBar({ title, streak, onProfilePress, dark }) {
  const gradientColors = dark
    ? ['#0a0f0d', '#142723', '#0a0f0d']
    : ['#ffffff', '#f0f0f0', '#ffffff'];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.container, !dark && styles.containerLight]}
      >
        <View style={styles.titleRow}>
          <Image source={require('../images/logo.png')} style={styles.logo} />
          <Text style={[styles.title, !dark && styles.titleLight]}>{title}</Text>
        </View>
        <View style={styles.rightRow}>
          {typeof streak === 'number' && (
            <View style={styles.streakRow}>
              <Ionicons name="flame" size={20} color="#1abc9c" />
              <Text style={[styles.streakText, !dark && styles.streakTextLight]}>{streak}-Day</Text>
            </View>
          )}
          <TouchableOpacity onPress={onProfilePress} hitSlop={10}>
            <Ionicons name="person-circle" size={32} color="#1abc9c" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerLight: {
    borderBottomColor: '#e0e0e0',
    shadowOpacity: 0.05,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 6,
    borderRadius: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleLight: {
    color: '#1a1a1a',
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  streakText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  streakTextLight: {
    color: '#1a1a1a',
  },
});
