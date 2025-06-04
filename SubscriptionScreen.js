import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionScreen({ isPro, onSubscribe, onClose }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onClose} style={styles.close}>
        <Ionicons name="close" size={28} color="#1abc9c" />
      </TouchableOpacity>
      <Text style={styles.title}>LiftLabs Premium</Text>
      <Text style={styles.description}>Unlock all features for $9.99 per month.</Text>
      {isPro ? (
        <Text style={styles.subscribed}>You are subscribed!</Text>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onSubscribe}>
          <Text style={styles.btnText}>Subscribe $9.99 / month</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0f0d',
  },
  close: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  subscribed: {
    color: '#1abc9c',
    fontSize: 18,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#1abc9c',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  btnText: {
    color: '#0a0f0d',
    fontWeight: '700',
    fontSize: 16,
  },
});
