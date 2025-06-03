//
// SignUpScreen.js
//
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert,
         Image, KeyboardAvoidingView, Platform, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabaseClient';

const { width, height } = Dimensions.get('window');

export default function SignUpScreen({ onSuccess, switchToSignIn }) {
  const [firstName, setFirstName]             = useState('');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [loading, setLoading]                 = useState(false);

  // We want at least 8 chars, one uppercase, one digit
  const isPasswordStrong = (pwd) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);

  const handleSignUp = async () => {
    // 1) Basic client‐side validation
    if (!firstName.trim()) {
      Alert.alert('Missing Field', 'Please enter your first name');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email');
      return;
    }
    if (!isPasswordStrong(password)) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 8 characters, include a number and a capital letter'
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // 2) Create user in Supabase Auth
      // In Supabase v2, signUp returns { data: { user, session }, error }
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email:    email.trim(),
        password: password,
      });
      if (authError) {
        throw authError;
      }

      // 3) Insert a new row into the "profiles" table
      //    We are assuming your table name is "profiles" (plural).
      //    The RLS policy we created above says "WITH CHECK (id = auth.uid())"
      //    and "USING (id = auth.uid())", so as long as we pass `id: userId`,
      //    the row will be inserted.  Note: supabase.auth.signUp() has just created
      //    the user, so authData.user.id === the newly generated UUID.
      const userId = authData.user.id;

      const { error: profileError } = await supabase
        .from('profile')          // ‒‒‒> MAKE SURE this exactly matches your table name
        .insert([{
          id:         userId,           // “id” column must match auth.uid()
          first_name: firstName.trim(),
          email:      email.trim(),
          level:      0,                // default starting level
          exp:        0,                // default starting exp
          avatar_url: '',               // start blank
        }]);

      if (profileError) {
        throw profileError;
      }

      // 4) Tell the user to check their mailbox for the verification email
      Alert.alert(
        'Account Created',
        'A verification email has been sent. Please check your inbox and click the link. Then sign in.',
        [
          { text: 'OK', onPress: switchToSignIn }
        ]
      );
    } catch (error) {
      console.log('SignUp Error →', error);
      Alert.alert('Sign Up Error', error.message);
    } finally {
      setLoading(false);
    }
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
        {/* Logo at the top */}
        <Image source={require('./images/logo.png')}
               style={styles.logo}
               resizeMode="contain" />

        {/* Card Container */}
        <View style={styles.card}>
          <Text style={styles.heading}>Create Account</Text>

          {/* First Name */}
          <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
            <Ionicons name="person-outline" size={20} color="#637d77" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="#637d77"
              autoCapitalize="words"
              value={firstName}
              onChangeText={setFirstName}
              editable={!loading}
            />
          </View>

          {/* Email */}
          <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
            <Ionicons name="mail-outline" size={20} color="#637d77" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#637d77"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, { marginBottom: 12 }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#637d77" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#637d77"
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPass(v => !v)}
              disabled={loading}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#637d77"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={[styles.inputWrapper, { marginBottom: 24 }]}>
            <Ionicons name="lock-closed-outline" size={20} color="#637d77" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#637d77"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm(v => !v)}
              disabled={loading}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#637d77"
              />
            </TouchableOpacity>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#0a0f0d" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* “Already have an account?” */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={switchToSignIn} disabled={loading}>
              <Text style={styles.footerLink}> Sign In</Text>
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
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0a0f0d',
    fontSize: 16,
    fontWeight: '700',
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
