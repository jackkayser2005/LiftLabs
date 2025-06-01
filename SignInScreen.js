import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from './supabaseClient';
import { fetchMyProfile } from './lib/profile';

const { width, height } = Dimensions.get('window');

export default function SignInScreen({ onSuccess, switchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

 const handleSignIn = async () => {
  if (!email || !password)
    return Alert.alert('Missing info', 'Fill both fields');

  setLoading(true);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  setLoading(false);

  if (error) return Alert.alert('Login error', error.message);

  try {
    const profile = await fetchMyProfile();
    // Optionally: stash this in context/state
    console.log('👤 profile', profile);
  } catch (err) {
    console.warn('profile fetch failed', err.message);
  }
  onSuccess();   // bubble up to <App />
};

  return (
    <KeyboardAvoidingView
      style={s.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={s.centerer}>
        {/* Logo + Glow */}
        <View style={s.logoGlowWrap}>
          <View style={s.logoGlow} />
          <Image
            source={require('/images/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.title}>Welcome Back</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Email</Text>
            <TextInput
              placeholder="you@email.com"
              placeholderTextColor="#91afaa"
              style={[
                s.input,
                focusedInput === 'email' && s.inputFocused,
              ]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
              textContentType="emailAddress"
            />
          </View>
          <View style={s.inputGroup}>
            <Text style={s.inputLabel}>Password</Text>
            <View style={s.inputPassWrap}>
              <TextInput
                placeholder="Your password"
                placeholderTextColor="#91afaa"
                style={[
                  s.input,
                  s.inputPass,
                  focusedInput === 'password' && s.inputFocused,
                ]}
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry={!showPass}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                textContentType="password"
              />
              <TouchableOpacity
                style={s.eyeBtn}
                onPress={() => setShowPass((v) => !v)}
                hitSlop={8}
              >
                <Text style={{ color: '#1abc9c', fontSize: 17 }}>
                  {showPass ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.82}
          >
            {loading ? (
              <ActivityIndicator color="#0a0e0d" />
            ) : (
              <Text style={s.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={s.footer}>
            <TouchableOpacity onPress={switchToSignUp} activeOpacity={0.7}>
              <Text style={s.linkText}>
                Don&apos;t have an account? <Text style={s.linkBold}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#091511',
  },
  centerer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: height * 0.95,
    paddingVertical: 16,
  },
  logoGlowWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#1abc9c55',
    shadowColor: '#1abc9c',
    shadowOpacity: 0.8,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    opacity: 0.90,
  },
  logo: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2,
    borderColor: '#1abc9c44',
    zIndex: 2,
  },
  card: {
    width: width * 0.9,
    maxWidth: 420,
    paddingHorizontal: 26,
    paddingVertical: 32,
    backgroundColor: 'rgba(10,14,13,0.96)',
    borderRadius: 32,
    shadowColor: '#1abc9c',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15.5,
    color: '#7fe0d4',
    marginBottom: 26,
    textAlign: 'center',
    fontWeight: '400',
  },
  inputGroup: {
    marginBottom: 22,
  },
  inputLabel: {
    color: '#a6cfc8',
    marginBottom: 7,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.22,
    marginLeft: 3,
  },
  input: {
    height: 50,
    backgroundColor: '#17312a',
    borderWidth: 1.2,
    borderColor: '#133124',
    borderRadius: 12,
    paddingHorizontal: 18,
    color: '#fff',
    fontWeight: '500',
    fontSize: 16.3,
    shadowColor: '#1abc9c',
    shadowOpacity: 0.10,
    shadowOffset: { width: 0, height: 2 },
    marginBottom: 0,
  },
  inputFocused: {
    borderColor: '#1abc9c',
    backgroundColor: '#152d27',
    shadowOpacity: 0.20,
    shadowRadius: 8,
  },
  inputPassWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputPass: {
    flex: 1,
    paddingRight: 36,
  },
  eyeBtn: {
    position: 'absolute',
    right: 11,
    top: 0,
    height: 50,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#1abc9c',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 3,
    shadowColor: '#1abc9c',
    shadowOpacity: 0.23,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.68,
  },
  buttonText: {
    color: '#091511',
    fontWeight: '800',
    fontSize: 16.5,
    letterSpacing: 0.32,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    color: '#91afaa',
    textAlign: 'center',
  },
  linkBold: {
    color: '#1abc9c',
    fontWeight: '700',
  },
});
