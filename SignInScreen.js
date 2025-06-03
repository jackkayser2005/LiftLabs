import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { supabase } from './supabaseClient';
import { Ionicons } from '@expo/vector-icons';

export default function SignInScreen({ onSuccess, switchToSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); // inline error

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Fill in both email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
      if (authError) throw authError;

      const { session, user } = authData;

      // try to fetch/create profile quietly
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        await supabase.from('profile').upsert(
          {
            user_id: user.id,
            email: user.email,
          },
          {
            onConflict: 'user_id',
          }
        );
      }

      onSuccess(session);
    } catch (error) {
      setErrorMsg(error.message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setGuestLoading(true);
    setTimeout(() => {
      setGuestLoading(false);
      onSuccess({ user: { app_metadata: { guest: true } } });
    }, 800);
  };

  const handleForgotPassword = () => {
    setErrorMsg('Password reset coming soon');
  };

  return (
    <LinearGradient
      colors={['#0a0f0d', '#142723', '#0a0f0d']}
      style={styles.background}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        {/* Logo */}
        <Image
          source={require('./images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Sign In</Text>

          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : null}

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#637d77"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#637d77"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={(txt) => {
                setEmail(txt);
                if (errorMsg) setErrorMsg('');
              }}
              editable={!loading && !guestLoading}
            />
          </View>

          {/* Password Input */}
          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Ionicons
              name="key-outline"
              size={20}
              color="#637d77"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#637d77"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={(txt) => {
                setPassword(txt);
                if (errorMsg) setErrorMsg('');
              }}
              editable={!loading && !guestLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              disabled={loading || guestLoading}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#637d77"
              />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (loading || guestLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={loading || guestLoading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0f0d" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Continue as Guest */}
          <TouchableOpacity
            style={[
              styles.guestButton,
              (loading || guestLoading) && styles.buttonDisabled,
            ]}
            onPress={handleGuestLogin}
            disabled={loading || guestLoading}
          >
            {guestLoading ? (
              <ActivityIndicator color="#1abc9c" />
            ) : (
              <Text style={styles.guestText}>Continue as Guest</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={loading || guestLoading}
            style={{ marginTop: 12 }}
          >
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Switch to Sign Up */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Need an account?</Text>
            <TouchableOpacity
              onPress={switchToSignUp}
              disabled={loading || guestLoading}
            >
              <Text style={styles.footerLink}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1abc9c',
    backgroundColor: '#142723',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(18, 27, 24, 0.9)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2821',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#1abc9c',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0f0d',
    fontSize: 16,
    fontWeight: '700',
  },
  guestButton: {
    borderWidth: 1.5,
    borderColor: '#1abc9c',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  guestText: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: '600',
  },
  forgotText: {
    color: '#8bb5ad',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#7a9590',
    fontSize: 14,
  },
  footerLink: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: '600',
  },
});
