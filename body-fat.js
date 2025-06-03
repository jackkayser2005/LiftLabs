// body-fat.js
import 'node-libs-react-native/globals';
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabaseClient';

const BodyFatCalculator = ({ isDarkMode }) => {
  // ─────── Local state ───────
  const [method, setMethod] = useState('navy'); // "navy", "army", or "bmi"
  const [gender, setGender] = useState('male');  // "male" / "female"
  const [unit, setUnit] = useState('imperial');  // "imperial" or "metric"
  const [measurements, setMeasurements] = useState({
    height: '', // in inches or cm
    weight: '', // in lbs or kg
    waist: '',  // in inches or cm
    neck: '',   // in inches or cm
    hip: '',    // in inches or cm (only used for female)
    age: '',    // in years
  });
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  // Holds all previously saved entries from Supabase
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Generate dynamic styles based on dark mode
  const styles = createStyles(isDarkMode);

  // When component mounts, fetch all saved entries for the current user
  useEffect(() => {
    fetchHistory();
  }, []);

  // ─────── Helper: Fetch all saved body‐fat entries from Supabase ───────
  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);

      // 1) Get currently logged‐in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('fetchHistory: no user →', userError);
        setLoadingHistory(false);
        return;
      }
      const userId = user.id;

      // 2) Query body_fat_entries where user_id = userId
      const { data: entries, error: entriesError } = await supabase
        .from('body_fat_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (entriesError) {
        console.error('fetchHistory supabase error →', entriesError);
        setLoadingHistory(false);
        return;
      }

      // 3) Save to local state
      setHistory(entries || []);
    } catch (err) {
      console.error('fetchHistory unexpected error →', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ─────── Calculation routines ───────
  const calculateNavyBodyFat = () => {
    const { height, waist, neck, hip } = measurements;
    if (!height || !waist || !neck || (gender === 'female' && !hip)) {
      Alert.alert('Missing Measurements', 'Please fill in all required measurements.');
      return null;
    }
    const h = parseFloat(height);
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const hips = parseFloat(hip) || 0;
    let bf;
    if (gender === 'male') {
      // Men: 495 ÷ [1.0324 – 0.19077×log10(waist – neck) + 0.15456×log10(height)] – 450
      bf =
        495 /
          (1.0324 -
            0.19077 * Math.log10(w - n) +
            0.15456 * Math.log10(h)) -
        450;
    } else {
      // Women: 495 ÷ [1.29579 – 0.35004×log10(waist + hip – neck) + 0.22100×log10(height)] – 450
      bf =
        495 /
          (1.29579 -
            0.35004 * Math.log10(w + hips - n) +
            0.22100 * Math.log10(h)) -
        450;
    }
    // Round to one decimal, clamp ≥ 0
    return Math.max(0, Math.round(bf * 10) / 10);
  };

  const calculateArmyBodyFat = () => {
    const { height, waist, neck, hip } = measurements;
    if (!height || !waist || !neck || (gender === 'female' && !hip)) {
      Alert.alert('Missing Measurements', 'Please fill in all required measurements.');
      return null;
    }
    const h = parseFloat(height);
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const hips = parseFloat(hip) || 0;
    let bf;
    if (gender === 'male') {
      // Army formula for men
      bf = 86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76;
    } else {
      // Army formula for women
      bf =
        163.205 * Math.log10(w + hips - n) -
        97.684 * Math.log10(h) -
        78.387;
    }
    return Math.max(0, Math.round(bf * 10) / 10);
  };

  const calculateBMIBodyFat = () => {
    const { height, weight, age } = measurements;
    if (!height || !weight || !age) {
      Alert.alert('Missing Information', 'Please fill in height, weight, and age.');
      return null;
    }
    let h = parseFloat(height);
    const w = parseFloat(weight);
    const a = parseFloat(age);

    if (unit === 'imperial') {
      // Convert inches → feet
      h = h / 12;
      // BMI (imperial) = (weight / (height)^2) × 703
      const bmi = (w / (h * h)) * 703;
      const gf = gender === 'male' ? 1 : 0;
      const bf = 1.2 * bmi + 0.23 * a - 10.8 * gf - 5.4;
      return Math.max(0, Math.round(bf * 10) / 10);
    } else {
      // Convert cm → m
      h = h / 100;
      // BMI (metric) = weight / (height)^2
      const bmi = w / (h * h);
      const gf = gender === 'male' ? 1 : 0;
      const bf = 1.2 * bmi + 0.23 * a - 10.8 * gf - 5.4;
      return Math.max(0, Math.round(bf * 10) / 10);
    }
  };

  // ─────── Save a single entry to Supabase ───────
  // Now takes category & advice as explicit args so we don’t rely on React state timing.
  const handleSaveBodyFatEntry = async (
    calculatedBfp,
    currentMethod,
    currentGender,
    currentMeasurements,
    currentUnit,
    category,
    advice
  ) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error fetching user or no user logged in →', userError);
        Alert.alert('Error', 'You must be logged in to save data.');
        return false;
      }
      const userId = user.id;

      // Build the object exactly matching your table columns:
      const entryData = {
        user_id: userId,
        method: currentMethod,
        gender: currentGender,
        unit: currentUnit,
        height: currentMeasurements.height
          ? parseFloat(currentMeasurements.height)
          : null,
        weight: currentMeasurements.weight
          ? parseFloat(currentMeasurements.weight)
          : null,
        waist: currentMeasurements.waist
          ? parseFloat(currentMeasurements.waist)
          : null,
        neck: currentMeasurements.neck
          ? parseFloat(currentMeasurements.neck)
          : null,
        hip: currentMeasurements.hip
          ? parseFloat(currentMeasurements.hip)
          : null,
        age: currentMeasurements.age
          ? parseInt(currentMeasurements.age, 10)
          : null,
        category: category,
        advice: advice,
        body_fat_percentage: calculatedBfp,
      };

      const { error: insertError } = await supabase
        .from('body_fat_entries')
        .insert([entryData]);

      if (insertError) {
        console.error('Supabase insert error →', insertError);
        Alert.alert('Save Error', 'Could not save data: ' + insertError.message);
        return false;
      } else {
        Alert.alert('Success', 'Body fat data saved!');
        // Refresh the saved‐entries list:
        fetchHistory();
        return true;
      }
    } catch (error) {
      console.error('Error saving body fat entry →', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred while saving data.'
      );
      return false;
    }
  };

  // ─────── Main “Calculate Body Fat” handler ───────
  const calculateBodyFat = async () => {
    let bodyFat = null;
    if (method === 'navy') bodyFat = calculateNavyBodyFat();
    else if (method === 'army') bodyFat = calculateArmyBodyFat();
    else if (method === 'bmi') bodyFat = calculateBMIBodyFat();

    if (bodyFat === null) return; // missing inputs → user already alerted

    // Compute category & advice locally:
    let category = '';
    let color = '';
    let advice = '';

    if (gender === 'male') {
      if (bodyFat < 6) {
        category = 'Essential Fat';
        color = '#e74c3c';
        advice = 'Too low – may be unhealthy';
      } else if (bodyFat < 14) {
        category = 'Athletic';
        color = '#27ae60';
        advice = 'Excellent fitness level';
      } else if (bodyFat < 18) {
        category = 'Fitness';
        color = '#2ecc71';
        advice = 'Good fitness level';
      } else if (bodyFat < 25) {
        category = 'Average';
        color = '#f39c12';
        advice = 'Acceptable range';
      } else {
        category = 'Above Average';
        color = '#e74c3c';
        advice = 'Consider improving diet & exercise';
      }
    } else {
      if (bodyFat < 16) {
        category = 'Essential Fat';
        color = '#e74c3c';
        advice = 'Too low – may be unhealthy';
      } else if (bodyFat < 21) {
        category = 'Athletic';
        color = '#27ae60';
        advice = 'Excellent fitness level';
      } else if (bodyFat < 25) {
        category = 'Fitness';
        color = '#2ecc71';
        advice = 'Good fitness level';
      } else if (bodyFat < 32) {
        category = 'Average';
        color = '#f39c12';
        advice = 'Acceptable range';
      } else {
        category = 'Above Average';
        color = '#e74c3c';
        advice = 'Consider improving diet & exercise';
      }
    }

    // Update the UI with the result
    setResult({ bodyFat, category, color, advice });

    // Save to Supabase (and then refresh history)
    await handleSaveBodyFatEntry(
      bodyFat,
      method,
      gender,
      measurements,
      unit,
      category,
      advice
    );
  };

  // ─────── Render selectors, input fields, result, modal, and “history” ───────
  const renderMethodSelector = () => (
    <View style={styles.methodSelector}>
      <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>
        Calculation Method
      </Text>
      <View style={styles.methodButtons}>
        {[
          { key: 'navy', label: 'Navy Method', accuracy: 'Most Accurate' },
          { key: 'army', label: 'Army Method', accuracy: 'Very Accurate' },
          { key: 'bmi', label: 'BMI Based', accuracy: 'Estimate Only' },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[
              styles.methodBtn,
              method === m.key && styles.methodBtnActive,
              !isDarkMode && styles.methodBtnLight,
            ]}
            onPress={() => setMethod(m.key)}
          >
            <Text
              style={[
                styles.methodText,
                method === m.key && styles.methodTextActive,
                !isDarkMode && styles.methodTextLight,
              ]}
            >
              {m.label}
            </Text>
            <Text
              style={[styles.accuracyText, !isDarkMode && styles.accuracyTextLight]}
            >
              {m.accuracy}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGenderSelector = () => (
    <View style={styles.genderSelector}>
      <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
        Gender
      </Text>
      <View style={styles.genderButtons}>
        <TouchableOpacity
          style={[
            styles.genderBtn,
            gender === 'male' && styles.genderBtnActive,
            !isDarkMode && styles.genderBtnLight,
          ]}
          onPress={() => setGender('male')}
        >
          <Ionicons
            name="man"
            size={24}
            color={
              gender === 'male'
                ? '#fff'
                : isDarkMode
                ? '#1abc9c'
                : '#666'
            }
          />
          <Text
            style={[
              styles.genderText,
              gender === 'male' && styles.genderTextActive,
              !isDarkMode && styles.genderTextLight,
            ]}
          >
            Male
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.genderBtn,
            gender === 'female' && styles.genderBtnActive,
            !isDarkMode && styles.genderBtnLight,
          ]}
          onPress={() => setGender('female')}
        >
          <Ionicons
            name="woman"
            size={24}
            color={
              gender === 'female'
                ? '#fff'
                : isDarkMode
                ? '#1abc9c'
                : '#666'
            }
          />
          <Text
            style={[
              styles.genderText,
              gender === 'female' && styles.genderTextActive,
              !isDarkMode && styles.genderTextLight,
            ]}
          >
            Female
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUnitSelector = () => (
    <View style={styles.unitSelector}>
      <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
        Units
      </Text>
      <View style={styles.unitButtons}>
        {['imperial', 'metric'].map((u) => (
          <TouchableOpacity
            key={u}
            style={[
              styles.unitBtn,
              unit === u && styles.unitBtnActive,
              !isDarkMode && styles.unitBtnLight,
            ]}
            onPress={() => setUnit(u)}
          >
            <Text
              style={[
                styles.unitText,
                unit === u && styles.unitTextActive,
                !isDarkMode && styles.unitTextLight,
              ]}
            >
              {u === 'imperial' ? 'Imperial' : 'Metric'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMeasurementInputs = () => {
    const getPlaceholder = (field) => {
      const unitText = unit === 'imperial' ? 'inches' : 'cm';
      const weightText = unit === 'imperial' ? 'lbs' : 'kg';
      switch (field) {
        case 'height':
          return `Height (${unitText})`;
        case 'weight':
          return `Weight (${weightText})`;
        case 'waist':
          return `Waist (${unitText})`;
        case 'neck':
          return `Neck (${unitText})`;
        case 'hip':
          return `Hip (${unitText})`;
        case 'age':
          return 'Age (years)';
        default:
          return '';
      }
    };

    // Determine which fields are required:
    const requiredFields = ['height', 'waist', 'neck'];
    if (gender === 'female' && (method === 'navy' || method === 'army')) {
      requiredFields.push('hip');
    }
    if (method === 'bmi') {
      requiredFields.push('weight', 'age');
    }

    return (
      <View style={styles.inputSection}>
        <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>
          Measurements
        </Text>

        {requiredFields.map((field) => (
          <View key={field} style={styles.inputGroup}>
            <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
              {getPlaceholder(field)} *
            </Text>
            <TextInput
              style={[styles.input, !isDarkMode && styles.inputLight]}
              placeholder={getPlaceholder(field)}
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              value={measurements[field]}
              onChangeText={(text) =>
                setMeasurements((prev) => ({
                  ...prev,
                  [field]: text,
                }))
              }
              keyboardType="numeric"
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.infoBtn}
          onPress={() => setShowInfo(true)}
        >
          <Ionicons name="help-circle-outline" size={20} color="#1abc9c" />
          <Text style={styles.infoBtnText}>
            How to measure correctly
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    return (
      <View style={[styles.resultContainer, !isDarkMode && styles.resultContainerLight]}>
        <Text style={[styles.resultTitle, !isDarkMode && styles.resultTitleLight]}>
          Your Body Fat Percentage
        </Text>

        <View style={styles.resultDisplay}>
          <Text style={[styles.resultNumber, { color: result.color }]}>
            {result.bodyFat}%
          </Text>
          <Text style={[styles.resultCategory, { color: result.color }]}>
            {result.category}
          </Text>
        </View>

        <Text style={[styles.resultAdvice, !isDarkMode && styles.resultAdviceLight]}>
          {result.advice}
        </Text>

        <View style={styles.disclaimerBox}>
          <Ionicons name="information-circle-outline" size={16} color="#f39c12" />
          <Text style={[styles.disclaimerText, !isDarkMode && styles.disclaimerTextLight]}>
            These calculations are estimates. Consult a healthcare professional for accurate analysis.
          </Text>
        </View>
      </View>
    );
  };

  const renderInfoModal = () => (
    <Modal
      transparent
      animationType="slide"
      visible={showInfo}
      onRequestClose={() => setShowInfo(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, !isDarkMode && styles.modalContainerLight]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, !isDarkMode && styles.modalTitleLight]}>
              Measurement Guide
            </Text>
            <TouchableOpacity onPress={() => setShowInfo(false)}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.measurementGuide}>
              <Text style={[styles.guideTitle, !isDarkMode && styles.guideTitleLight]}>
                📏 How to Measure:
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                <Text style={styles.guideBold}>Waist:</Text> Measure at the narrowest point—usually just above the belly button. Keep tape parallel to floor.
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                <Text style={styles.guideBold}>Neck:</Text> Measure just below the Adam’s apple. Keep tape snug but not tight.
              </Text>
              {gender === 'female' && (
                <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                  <Text style={styles.guideBold}>Hip:</Text> Measure at the widest part of your hips—around the hip bones.
                </Text>
              )}
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                <Text style={styles.guideBold}>Height:</Text> Stand straight against a wall without shoes.
              </Text>
              <Text style={[styles.guideTitle, !isDarkMode && styles.guideTitleLight]}>
                💡 Tips for Accuracy:
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                • Measure in the morning before eating
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                • Use a flexible measuring tape
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                • Take measurements 2–3 times and average them
              </Text>
              <Text style={[styles.guideItem, !isDarkMode && styles.guideItemLight]}>
                • Keep tape level and snug, not tight
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ─────── Main render ───────
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="body" size={32} color="#1abc9c" />
        <Text style={[styles.headerTitle, !isDarkMode && styles.headerTitleLight]}>
          Body Fat Calculator
        </Text>
      </View>

      {renderMethodSelector()}
      {renderGenderSelector()}
      {renderUnitSelector()}
      {renderMeasurementInputs()}

      <TouchableOpacity style={styles.calculateBtn} onPress={calculateBodyFat}>
        <Ionicons name="calculator" size={20} color="#fff" />
        <Text style={styles.calculateBtnText}>Calculate Body Fat</Text>
      </TouchableOpacity>

      {renderResult()}
      {renderInfoModal()}

      {/* ─── Display “history” (past entries) ─── */}
      <View style={{ marginTop: 30 }}>
        <Text style={[styles.sectionTitle, !isDarkMode && styles.sectionTitleLight]}>
          Past Entries
        </Text>

        {loadingHistory ? (
          <ActivityIndicator size="small" color="#1abc9c" />
        ) : history.length === 0 ? (
          <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 14 }}>
            No saved entries yet.
          </Text>
        ) : (
          history.map((entry) => (
            <View
              key={entry.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: isDarkMode ? '#333' : '#e0e0e0',
              }}
            >
              <Text style={{ color: isDarkMode ? '#fff' : '#000', fontSize: 14 }}>
                {new Date(entry.created_at).toLocaleDateString()}:
              </Text>
              <Text style={{ color: isDarkMode ? '#1abc9c' : '#1abc9c', fontSize: 14, fontWeight: '600' }}>
                {entry.body_fat_percentage}% ({entry.method})
              </Text>
            </View>
          ))
        )}
      </View>
      {/* ──────────────────────────────────── */}
    </ScrollView>
  );
};

const createStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? '#000' : '#f8f9fa',
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e0e0e0',
      marginBottom: 20,
    },
    headerTitle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 8,
    },
    headerTitleLight: {
      color: '#000',
    },

    // Method Selector
    methodSelector: {
      marginBottom: 25,
    },
    methodButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    methodBtn: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111' : '#fff',
      borderRadius: 12,
      padding: 15,
      marginHorizontal: 3,
      borderWidth: 2,
      borderColor: isDarkMode ? '#333' : '#e0e0e0',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    methodBtnLight: {
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
    },
    methodBtnActive: {
      borderColor: '#1abc9c',
      backgroundColor: isDarkMode ? '#1abc9c15' : '#1abc9c10',
      shadowColor: '#1abc9c',
      shadowOpacity: 0.3,
      elevation: 6,
    },
    methodText: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 14,
      fontWeight: 'bold',
      marginBottom: 4,
      textAlign: 'center',
    },
    methodTextLight: {
      color: '#000',
    },
    methodTextActive: {
      color: '#1abc9c',
    },
    accuracyText: {
      color: isDarkMode ? '#999' : '#666',
      fontSize: 11,
      textAlign: 'center',
    },
    accuracyTextLight: {
      color: '#666',
    },

    // Gender Selector
    genderSelector: {
      marginBottom: 25,
    },
    genderButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    genderBtn: {
      flex: 1,
      backgroundColor: isDarkMode ? '#111' : '#fff',
      borderRadius: 12,
      padding: 20,
      marginHorizontal: 5,
      borderWidth: 2,
      borderColor: isDarkMode ? '#333' : '#e0e0e0',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    genderBtnLight: {
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
    },
    genderBtnActive: {
      borderColor: '#1abc9c',
      backgroundColor: '#1abc9c',
      shadowColor: '#1abc9c',
      shadowOpacity: 0.3,
      elevation: 6,
    },
    genderText: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    genderTextLight: {
      color: '#000',
    },
    genderTextActive: {
      color: '#fff',
    },

    // Unit Selector
    unitSelector: {
      marginBottom: 25,
    },
    unitButtons: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#111' : '#f0f0f0',
      borderRadius: 12,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    unitBtn: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    unitBtnLight: {
      backgroundColor: 'transparent',
    },
    unitBtnActive: {
      backgroundColor: '#1abc9c',
      shadowColor: '#1abc9c',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    unitText: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
    },
    unitTextLight: {
      color: '#000',
    },
    unitTextActive: {
      color: '#fff',
    },

    // Input Section
    inputSection: {
      marginBottom: 25,
    },
    inputGroup: {
      marginBottom: 15,
    },
    inputLabel: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    inputLabelLight: {
      color: '#000',
    },
    input: {
      backgroundColor: isDarkMode ? '#111' : '#fff',
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      color: isDarkMode ? '#fff' : '#000',
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    inputLight: {
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
      color: '#000',
    },

    infoBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
      padding: 10,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#111' : '#f8f9fa',
    },
    infoBtnText: {
      color: '#1abc9c',
      fontSize: 14,
      marginLeft: 5,
      fontWeight: '500',
    },

    // Calculate Button
    calculateBtn: {
      backgroundColor: '#1abc9c',
      borderRadius: 12,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 25,
      shadowColor: '#1abc9c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    calculateBtnText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },

    // Result
    resultContainer: {
      backgroundColor: isDarkMode ? '#111' : '#fff',
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: isDarkMode ? '#333' : '#e0e0e0',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    resultContainerLight: {
      backgroundColor: '#fff',
      borderColor: '#e0e0e0',
    },
    resultTitle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
    },
    resultTitleLight: {
      color: '#000',
    },
    resultDisplay: {
      alignItems: 'center',
      marginBottom: 15,
    },
    resultNumber: {
      fontSize: 48,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0,0,0,0.1)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    resultCategory: {
      fontSize: 18,
      fontWeight: '600',
      marginTop: 5,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    resultAdvice: {
      color: isDarkMode ? '#ccc' : '#666',
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 15,
      lineHeight: 22,
    },
    resultAdviceLight: {
      color: '#666',
    },
    disclaimerBox: {
      flexDirection: 'row',
      backgroundColor: isDarkMode ? '#2c1810' : '#fff3cd',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#f39c12',
    },
    disclaimerText: {
      color: isDarkMode ? '#f39c12' : '#856404',
      fontSize: 12,
      flex: 1,
      marginLeft: 8,
      lineHeight: 16,
    },
    disclaimerTextLight: {
      color: '#856404',
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? '#111' : '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    modalContainerLight: {
      backgroundColor: '#fff',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#333' : '#e0e0e0',
    },
    modalTitle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalTitleLight: {
      color: '#000',
    },
    modalContent: {
      padding: 20,
    },
    measurementGuide: {
      paddingBottom: 20,
    },
    guideTitle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 10,
    },
    guideTitleLight: {
      color: '#000',
    },
    guideItem: {
      color: isDarkMode ? '#ccc' : '#666',
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    guideItemLight: {
      color: '#666',
    },
    guideBold: {
      fontWeight: 'bold',
      color: '#1abc9c',
    },

    // Section Titles
    sectionTitle: {
      color: isDarkMode ? '#fff' : '#000',
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
    },
    sectionTitleLight: {
      color: '#000',
    },
  });

export default BodyFatCalculator;
