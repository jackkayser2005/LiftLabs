// CalorieTracker.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from './supabaseClient';
import { updateDailyStreak } from './lib/streak';
import styles from './styles';

const { width } = Dimensions.get('window');

export default function CalorieTracker({ isDarkMode }) {
  // ── 1) User & Session State ───────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // ── 2) Profile: Goals & Streak State ───────────────────────────────────────────────
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState(null);
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goalType, setGoalType] = useState('maintain');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goalRowId, setGoalRowId] = useState(null);
  const [isFirstGoal, setIsFirstGoal] = useState(false);

  const [dailyCalories, setDailyCalories] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);

  // ── 3) Today’s Log State ────────────────────────────────────────────────────────────
  const [todayEntry, setTodayEntry] = useState(null);
  const [streakDays, setStreakDays] = useState(0);
  const [streakToday, setStreakToday] = useState(false);

  // ── 4) Logging Inputs & UI Flags ───────────────────────────────────────────────────
  const [proteinIn, setProteinIn] = useState('');
  const [carbsIn, setCarbsIn] = useState('');
  const [fatIn, setFatIn] = useState('');
  const [foodSearch, setFoodSearch] = useState('');
  const [matchedFood, setMatchedFood] = useState(null);
  const [newFoodName, setNewFoodName] = useState('');
  const [newServingSize, setNewServingSize] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');
  const [activeLogTab, setActiveLogTab] = useState('macros');

  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(true);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [submittingNewFood, setSubmittingNewFood] = useState(false);
  const [logSectionVisible, setLogSectionVisible] = useState(false);

  // ── 5) Progress Bar Animation ──────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ─────────────────────────────────────────────────────────────────
  // ON MOUNT → fetch session, then body-fat, goals, today’s logs, streak
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        await fetchBodyFatAndHeight(data.session.user.id);
        await fetchUserGoals(data.session.user.id);
        await fetchTodayLogs(data.session.user.id);
        await fetchStreakInfo(data.session.user.id);
      }
      setLoading(false);
    });
  }, []);

  //────────────────────────────────────────────────────────────────
  async function fetchBodyFatAndHeight(uid) {
    try {
      let { data, error } = await supabase
        .from('body_fat_entries')
        .select('height, unit')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching body_fat:', error.message);
        setHeightCm(null);
        return;
      }

      if (data) {
        let h = parseFloat(data.height);
        if (data.unit === 'imperial') {
          h = h * 2.54; // inches → cm
        }
        setHeightCm(h);
      } else {
        setHeightCm(null);
      }
    } catch (e) {
      console.warn('Exception in fetchBodyFatAndHeight:', e.message);
      setHeightCm(null);
    }
  }

  //────────────────────────────────────────────────────────────────
  async function fetchUserGoals(uid) {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching user_goals:', error.message);
        return;
      }

      if (data) {
        setGoalRowId(data.id);
        setAge(data.age.toString());
        setGender(data.gender);
        setHeightCm(data.height_cm);
        setCurrentWeight(data.current_weight.toString());
        setTargetWeight(data.target_weight.toString());
        setActivityLevel(data.activity_level);
        setGoalType(data.goal_type);
        setDailyCalories(data.daily_calories);
        setProteinGoal(data.protein_goal);
        setCarbGoal(data.carb_goal);
        setFatGoal(data.fat_goal);
        setShowQuiz(false);
        setIsFirstGoal(false);
      } else {
        setIsFirstGoal(true);
      }
    } catch (e) {
      console.warn('Exception in fetchUserGoals:', e.message);
    }
  }

  //────────────────────────────────────────────────────────────────
  async function fetchTodayLogs(uid) {
    try {
      const today = new Date().toISOString().split('T')[0];
      let { data, error } = await supabase
        .from('calorie_logs')
        .select('*')
        .eq('user_id', uid)
        .eq('log_date', today)
        .single();

      setStreakToday(false);

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching today logs:', error.message);
        setTodayEntry(null);
      } else if (data) {
        setTodayEntry({
          id: data.id,
          total_calories: data.total_calories,
          protein: data.protein_consumed,
          carbs: data.carb_consumed,
          fat: data.fat_consumed,
          protein_goal: data.protein_goal,
          carb_goal: data.carb_goal,
          fat_goal: data.fat_goal,
        });
      } else {
        setTodayEntry(null);
      }
    } catch (e) {
      console.warn('Exception in fetchTodayLogs:', e.message);
      setTodayEntry(null);
    }
  }

  //────────────────────────────────────────────────────────────────
  async function fetchStreakInfo(uid) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('calorie_logs')
        .select('log_date, streak_days')
        .eq('user_id', uid)
        .order('log_date', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setStreakDays(data.streak_days || 0);
        if (data.log_date === today) setStreakToday(true);
      }
    } catch (e) {
      console.warn('Exception in fetchStreakInfo:', e.message);
    }
  }

  //────────────────────────────────────────────────────────────────
  // 3) SUBMIT or UPDATE QUIZ → upsert user_goals + upsert calorie_logs
  //────────────────────────────────────────────────────────────────
  async function handleSubmitQuiz() {
    if (!user) {
      Alert.alert('Not signed in');
      return;
    }

    // rate-limit: no more than 25 changes/hour
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('user_goal_changes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('changed_at', oneHourAgo);

      if (countError) {
        console.warn('Error counting goal changes:', countError.message);
      }

      if (count >= 25) {
        Alert.alert(
          'Rate Limit Exceeded',
          'You changed goals too many times. Chill for a bit.'
        );
        return;
      }
    } catch (e) {
      console.warn('Exception checking rate limit:', e.message);
    }

    // validate fields
    const quizValid =
      heightCm != null &&
      age.trim() &&
      gender &&
      currentWeight.trim() &&
      targetWeight.trim() &&
      activityLevel;

    if (!quizValid) {
      Alert.alert('Please complete all quiz fields.');
      return;
    }

    setSubmittingQuiz(true);

    try {
      // calculate macros
      const {
        dailyCalories: calcCalories,
        protein,
        carbs,
        fat,
      } = calculateMacros(
        parseFloat(currentWeight),
        parseFloat(heightCm),
        parseInt(age, 10),
        gender,
        goalType,
        activityLevel
      );

      if (goalRowId) {
        // UPDATE existing row
        const { error: updateError } = await supabase
          .from('user_goals')
          .update({
            age: parseInt(age, 10),
            gender,
            height_cm: heightCm,
            current_weight: parseFloat(currentWeight),
            target_weight: parseFloat(targetWeight),
            daily_calories: calcCalories,
            protein_goal: protein,
            carb_goal: carbs,
            fat_goal: fat,
            activity_level: activityLevel,
            goal_type: goalType,
          })
          .eq('id', goalRowId);

        if (updateError) {
          console.warn('Error updating user_goals:', updateError.message);
          Alert.alert('Error updating goals:', updateError.message);
        } else {
          setDailyCalories(calcCalories);
          setProteinGoal(protein);
          setCarbGoal(carbs);
          setFatGoal(fat);
        }
      } else {
        // INSERT new row
        const { data: insertedGoal, error: insertError } = await supabase
          .from('user_goals')
          .insert([
            {
              user_id: user.id,
              age: parseInt(age, 10),
              gender,
              height_cm: heightCm,
              current_weight: parseFloat(currentWeight),
              target_weight: parseFloat(targetWeight),
              daily_calories: calcCalories,
              protein_goal: protein,
              carb_goal: carbs,
              fat_goal: fat,
              activity_level: activityLevel,
              goal_type: goalType,
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.warn('Error inserting user_goals:', insertError.message);
          Alert.alert('Error saving goals:', insertError.message);
          setSubmittingQuiz(false);
          return;
        }

        setGoalRowId(insertedGoal.id);
        setDailyCalories(calcCalories);
        setProteinGoal(protein);
        setCarbGoal(carbs);
        setFatGoal(fat);

        if (isFirstGoal) {
          Alert.alert('🎉 You earned 250 XP for setting your goals!');
          setIsFirstGoal(false);
        }
      }

      // log change
      try {
        await supabase.from('user_goal_changes').insert([{ user_id: user.id }]);
      } catch (e) {
        console.warn('Failed to log goal change:', e.message);
      }

      // upsert today’s calorie_log with the new goals
      const today = new Date().toISOString().split('T')[0];
      let { data: existingLog, error: fetchLogError } = await supabase
        .from('calorie_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (fetchLogError && fetchLogError.code !== 'PGRST116') {
        console.warn('Error fetching today calorie_log:', fetchLogError.message);
      }

      if (!existingLog) {
        // insert new today row
        const { data: insertedLog, error: insertLogError } = await supabase
          .from('calorie_logs')
          .insert([
            {
              user_id: user.id,
              log_date: today,
              total_calories: calcCalories, // initial remaining calories = TDEE
              protein_goal: protein,
              carb_goal: carbs,
              fat_goal: fat,
              protein_consumed: 0,
              carb_consumed: 0,
              fat_consumed: 0,
              streak_days: 0,
            },
          ])
          .single();

        if (insertLogError) {
          console.warn('Error inserting calorie_log:', insertLogError.message);
        } else {
          setTodayEntry({
            id: insertedLog.id,
            total_calories: insertedLog.total_calories,
            protein: insertedLog.protein_consumed,
            carbs: insertedLog.carb_consumed,
            fat: insertedLog.fat_consumed,
            protein_goal: insertedLog.protein_goal,
            carb_goal: insertedLog.carb_goal,
            fat_goal: insertedLog.fat_goal,
          });
        }
      } else {
        // update goals on existing row (recalculate remaining)
        const consumedCals =
          (existingLog.protein_consumed || 0) * 4 +
          (existingLog.carb_consumed || 0) * 4 +
          (existingLog.fat_consumed || 0) * 9;
        const newRemaining = Math.max(calcCalories - consumedCals, 0);

        const { error: updateLogError } = await supabase
          .from('calorie_logs')
          .update({
            protein_goal: protein,
            carb_goal: carbs,
            fat_goal: fat,
            total_calories: newRemaining,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingLog.id);

        if (updateLogError) {
          console.warn('Error updating today calorie_log:', updateLogError.message);
        } else {
          setTodayEntry({
            id: existingLog.id,
            total_calories: newRemaining,
            protein: existingLog.protein_consumed,
            carbs: existingLog.carb_consumed,
            fat: existingLog.fat_consumed,
            protein_goal: protein,
            carb_goal: carbs,
            fat_goal: fat,
          });
        }
      }

      setShowQuiz(false);
    } catch (e) {
      console.warn('Exception in handleSubmitQuiz:', e.message);
    }

    setSubmittingQuiz(false);
  }

  //────────────────────────────────────────────────────────────────
  function calculateMacros(
    weightLbs,
    heightCmVal,
    ageVal,
    genderVal,
    goalTypeVal,
    activityLvl
  ) {
    const weightKg = weightLbs * 0.453592;
    let bmr = 0;
    if (genderVal === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCmVal - 5 * ageVal + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCmVal - 5 * ageVal - 161;
    }
    bmr = Math.round(bmr);

    let activityFactor = 1.2;
    switch (activityLvl) {
      case 'light':
        activityFactor = 1.375;
        break;
      case 'moderate':
        activityFactor = 1.55;
        break;
      case 'active':
        activityFactor = 1.725;
        break;
      case 'very_active':
        activityFactor = 1.9;
        break;
      default:
        activityFactor = 1.2;
    }

    let tdee = Math.round(bmr * activityFactor);
    if (goalTypeVal === 'cut') {
      tdee -= 500;
    } else if (goalTypeVal === 'bulk') {
      tdee += 500;
    }

    const protein_g = Math.round(weightLbs * 1.0);
    const fat_g = Math.round((tdee * 0.25) / 9);
    const remainingCals = tdee - protein_g * 4 - fat_g * 9;
    const carbs_g = Math.round(remainingCals / 4);

    return {
      dailyCalories: tdee,
      protein: protein_g,
      carbs: carbs_g,
      fat: fat_g,
    };
  }

  //────────────────────────────────────────────────────────────────
  // 5a) Manual food logging (by macros)
  //────────────────────────────────────────────────────────────────
  async function handleSubmitFoodLog_ByMacros() {
    if (!user) {
      Alert.alert('Not signed in');
      return;
    }

    if (!proteinIn.trim() || !carbsIn.trim() || !fatIn.trim()) {
      Alert.alert('Please fill in protein, carbs, and fat.');
      return;
    }

    const protVal = parseFloat(proteinIn);
    const carbVal = parseFloat(carbsIn);
    const fatVal = parseFloat(fatIn);
    if (isNaN(protVal) || isNaN(carbVal) || isNaN(fatVal)) {
      Alert.alert('Macros must be valid numbers.');
      return;
    }

    if (dailyCalories <= 0) {
      await fetchUserGoals(user.id);
      if (dailyCalories <= 0) {
        Alert.alert('Set your goals before logging food.');
        return;
      }
    }

    setSubmittingLog(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      let { data: existingLog, error: fetchError } = await supabase
        .from('calorie_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error fetching today log:', fetchError.message);
        setSubmittingLog(false);
        return;
      }

      if (!existingLog) {
        // pull latest goals
        const { data: ug, error: ugError } = await supabase
          .from('user_goals')
          .select('daily_calories, protein_goal, carb_goal, fat_goal')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (ugError) {
          console.warn('Error fetching goals:', ugError.message);
          setSubmittingLog(false);
          return;
        }

        const insertPayload = {
          user_id: user.id,
          log_date: today,
          total_calories: ug.daily_calories,
          protein_goal: ug.protein_goal,
          carb_goal: ug.carb_goal,
          fat_goal: ug.fat_goal,
          protein_consumed: 0,
          carb_consumed: 0,
          fat_consumed: 0,
          streak_days: 0,
        };

        let { data: insertedLog, error: insertError } = await supabase
          .from('calorie_logs')
          .insert([insertPayload])
          .single();

        if (insertError) {
          console.warn('Error inserting today log:', insertError.message);
          setSubmittingLog(false);
          return;
        }
        existingLog = insertedLog;
      }

      // compute new totals
      const newProtein = (existingLog.protein_consumed || 0) + protVal;
      const newCarbs = (existingLog.carb_consumed || 0) + carbVal;
      const newFat = (existingLog.fat_consumed || 0) + fatVal;
      const consumedCals = newProtein * 4 + newCarbs * 4 + newFat * 9;
      const newRemaining = Math.max(dailyCalories - consumedCals, 0);

      const updatedTotals = {
        total_calories: newRemaining,
        protein_consumed: newProtein,
        carb_consumed: newCarbs,
        fat_consumed: newFat,
        updated_at: new Date().toISOString(),
      };

      const { data: updatedLog, error: updateError } = await supabase
        .from('calorie_logs')
        .update(updatedTotals)
        .eq('id', existingLog.id)
        .single();

      if (updateError) {
        console.warn('Error updating today log:', updateError.message);
      } else if (updatedLog) {
        setTodayEntry({
          id: updatedLog.id,
          total_calories: updatedLog.total_calories,
          protein: updatedLog.protein_consumed,
          carbs: updatedLog.carb_consumed,
          fat: updatedLog.fat_consumed,
          protein_goal: updatedLog.protein_goal,
          carb_goal: updatedLog.carb_goal,
          fat_goal: updatedLog.fat_goal,
        });
      }

      // re-fetch so UI is always fresh
      await fetchTodayLogs(user.id);

      // reset inputs & animate
      setProteinIn('');
      setCarbsIn('');
      setFatIn('');
      animateProgress();

      if (!streakToday) {
        const newStreak = await updateDailyStreak(user.id);
        if (newStreak !== null) {
          setStreakDays(newStreak);
          Alert.alert('✅ Congrats!', `Streak is now ${newStreak} days.`);
          setStreakToday(true);
        }
      }
    } catch (e) {
      console.warn('Exception in handleSubmitFoodLog_ByMacros:', e.message);
    }

    setSubmittingLog(false);
  }

  //────────────────────────────────────────────────────────────────
  // 5b) Lookup food by name
  //────────────────────────────────────────────────────────────────
  async function handleFoodLookup() {
    if (!user) {
      Alert.alert('Not signed in');
      return;
    }
    if (!foodSearch.trim()) {
      Alert.alert('Enter a food name to search.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('foods')
        .select('name, protein, carbs, fat')
        .ilike('name', `%${foodSearch.trim()}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        Alert.alert('Not found', 'That food is not in your database.');
        setMatchedFood(null);
        return;
      }

      setMatchedFood(data);
      setProteinIn(data.protein.toString());
      setCarbsIn(data.carbs.toString());
      setFatIn(data.fat.toString());
      setActiveLogTab('macros');
    } catch (e) {
      console.warn('Exception in handleFoodLookup:', e.message);
    }
  }

  //────────────────────────────────────────────────────────────────
  // 5c) Add new food (rate-limit 5/hour)
  //────────────────────────────────────────────────────────────────
  async function handleAddNewFood() {
    if (!user) {
      Alert.alert('Not signed in');
      return;
    }
    if (
      !newFoodName.trim() ||
      !newServingSize.trim() ||
      !newProtein.trim() ||
      !newCarbs.trim() ||
      !newFat.trim()
    ) {
      Alert.alert('Please fill in all food fields.');
      return;
    }

    const protVal = parseFloat(newProtein);
    const carbVal = parseFloat(newCarbs);
    const fatVal = parseFloat(newFat);
    if (isNaN(protVal) || isNaN(carbVal) || isNaN(fatVal)) {
      Alert.alert('Protein, carbs, and fat must be valid numbers.');
      return;
    }

    setSubmittingNewFood(true);

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await supabase
        .from('foods')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo);

      if (countError) {
        console.warn('Error counting recent foods:', countError.message);
      }

      if (count >= 5) {
        Alert.alert(
          'Rate Limit Exceeded',
          'You added 5 foods in the last hour. Chill for a bit.'
        );
        setSubmittingNewFood(false);
        return;
      }

      const { error: insertError } = await supabase
        .from('foods')
        .insert([
          {
            user_id: user.id,
            name: newFoodName.trim(),
            serving_size: newServingSize.trim(),
            protein: protVal,
            carbs: carbVal,
            fat: fatVal,
          },
        ]);

      if (insertError) {
        console.warn('Error inserting new food:', insertError.message);
        Alert.alert('Error adding food:', insertError.message);
      } else {
        Alert.alert('Success!', `${newFoodName.trim()} added.`);
        setNewFoodName('');
        setNewServingSize('');
        setNewProtein('');
        setNewCarbs('');
        setNewFat('');
        setActiveLogTab('byName');
        setMatchedFood(null);
      }
    } catch (e) {
      console.warn('Exception in handleAddNewFood:', e.message);
    }

    setSubmittingNewFood(false);
  }

  //────────────────────────────────────────────────────────────────
  // Animate progress bar
  //────────────────────────────────────────────────────────────────
  function animateProgress() {
    if (!todayEntry || dailyCalories <= 0) {
      progressAnim.setValue(0);
      return;
    }
    const remaining = todayEntry.total_calories;
    const consumed = dailyCalories - remaining;
    const ratio = Math.max(0, Math.min(consumed / dailyCalories, 1));

    Animated.timing(progressAnim, {
      toValue: ratio,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }

  useEffect(() => {
    if (!showQuiz) {
      animateProgress();
    }
  }, [todayEntry, dailyCalories, showQuiz]);

  //────────────────────────────────────────────────────────────────
  // RENDER QUIZ (goal‐setting)
  //────────────────────────────────────────────────────────────────
  function renderQuizSection() {
    const quizValid =
      heightCm != null &&
      age.trim() &&
      gender &&
      currentWeight.trim() &&
      targetWeight.trim() &&
      activityLevel;

    return (
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: 15,
        }}
      >
        <View
          style={[
            styles.goalSection,
            isDarkMode ? {} : styles.goalSectionLight,
          ]}
        >
          <Text
            style={[
              styles.goalTitle,
              isDarkMode ? {} : styles.goalTitleLight,
            ]}
          >
            Tell Us About Yourself
          </Text>

          {heightCm == null ? (
            <Text
              style={[
                styles.calorieSubtext,
                isDarkMode ? {} : styles.calorieSubtextLight,
              ]}
            >
              ⚠️ We don’t have your height on file. Calculate body fat first.
            </Text>
          ) : (
            <Text
              style={[
                styles.calorieSubtext,
                isDarkMode ? {} : styles.calorieSubtextLight,
              ]}
            >
              Your Height: {heightCm.toFixed(0)} cm
            </Text>
          )}

          {/* AGE */}
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.inputLabel,
                isDarkMode ? {} : styles.inputLabelLight,
              ]}
            >
              Age
            </Text>
            <TextInput
              style={[styles.input, isDarkMode ? {} : styles.inputLight]}
              placeholder="e.g. 28"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
              editable={heightCm != null}
            />
          </View>

          {/* GENDER */}
          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <Text
              style={[
                styles.inputLabel,
                isDarkMode ? {} : styles.inputLabelLight,
              ]}
            >
              Gender
            </Text>
            <View style={styles.genderButtons}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    isDarkMode ? {} : styles.genderBtnLight,
                    gender === g && styles.genderBtnActive,
                    heightCm == null && { opacity: 0.3 },
                  ]}
                  onPress={() => {
                    if (heightCm != null) setGender(g);
                  }}
                  activeOpacity={heightCm != null ? 0.7 : 1}
                >
                  <Text
                    style={[
                      styles.genderText,
                      isDarkMode ? {} : styles.genderTextLight,
                      gender === g && styles.genderTextActive,
                    ]}
                  >
                    {g === 'male' ? 'Male' : 'Female'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* CURRENT WEIGHT */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text
              style={[
                styles.inputLabel,
                isDarkMode ? {} : styles.inputLabelLight,
              ]}
            >
              Current Weight (lbs)
            </Text>
            <TextInput
              style={[styles.input, isDarkMode ? {} : styles.inputLight]}
              placeholder="e.g. 175"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              keyboardType="numeric"
              value={currentWeight}
              onChangeText={setCurrentWeight}
              editable={heightCm != null}
            />
          </View>

          {/* TARGET WEIGHT */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text
              style={[
                styles.inputLabel,
                isDarkMode ? {} : styles.inputLabelLight,
              ]}
            >
              Target Weight (lbs)
            </Text>
            <TextInput
              style={[styles.input, isDarkMode ? {} : styles.inputLight]}
              placeholder="e.g. 180"
              placeholderTextColor={isDarkMode ? '#666' : '#999'}
              keyboardType="numeric"
              value={targetWeight}
              onChangeText={setTargetWeight}
              editable={heightCm != null}
            />
          </View>

          {/* ACTIVITY LEVEL */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text
              style={[
                styles.inputLabel,
                isDarkMode ? {} : styles.inputLabelLight,
              ]}
            >
              Activity Level
            </Text>
            <View style={styles.unitButtons}>
              {[
                { key: 'sedentary', label: 'None' },
                { key: 'light', label: 'Light' },
                { key: 'moderate', label: 'Avg.' },
                { key: 'active', label: 'Active' },
                { key: 'very_active', label: 'Very' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.unitBtn,
                    isDarkMode ? {} : styles.unitBtnLight,
                    activityLevel === opt.key && styles.unitBtnActive,
                  ]}
                  onPress={() => setActivityLevel(opt.key)}
                >
                  <Text
                    style={[
                      styles.unitText,
                      isDarkMode ? {} : styles.unitTextLight,
                      activityLevel === opt.key && styles.unitTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* GOAL TYPE */}
          <View style={[styles.goalTypeContainer, { marginTop: 20 }]}>
            {[
              { type: 'cut', label: 'Cut' },
              { type: 'maintain', label: 'Maintain' },
              { type: 'bulk', label: 'Bulk' },
            ].map((g) => (
              <TouchableOpacity
                key={g.type}
                style={[
                  styles.goalTypeBtn,
                  isDarkMode ? {} : styles.goalTypeBtnLight,
                  goalType === g.type && styles.goalTypeBtnActive,
                  heightCm == null && { opacity: 0.3 },
                ]}
                onPress={() => {
                  if (heightCm != null) setGoalType(g.type);
                }}
                activeOpacity={heightCm != null ? 0.7 : 1}
              >
                <Text
                  style={[
                    styles.goalTypeText,
                    isDarkMode ? {} : styles.goalTypeTextLight,
                    goalType === g.type && styles.goalTypeTextActive,
                  ]}
                >
                  {g.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SAVE GOALS BUTTON */}
          <TouchableOpacity
            style={[
              styles.setGoalBtn,
              {
                marginTop: 20,
                backgroundColor: quizValid ? '#1abc9c' : '#555',
                paddingVertical: 18,
                paddingHorizontal: 30,
              },
            ]}
            onPress={handleSubmitQuiz}
            disabled={!quizValid || submittingQuiz}
          >
            {submittingQuiz ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.setGoalBtnText}>Save My Goals</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  //────────────────────────────────────────────────────────────────
  // RENDER TRACKER (after quiz)
  //────────────────────────────────────────────────────────────────
  function renderTrackerUI() {
    const remainingCals = todayEntry?.total_calories ?? 0;
    const consumedCals = dailyCalories > 0 ? dailyCalories - remainingCals : 0;
    const consumedProt = todayEntry?.protein ?? 0;
    const consumedCarb = todayEntry?.carbs ?? 0;
    const consumedFat = todayEntry?.fat ?? 0;

    const derivedCalories =
      parseInt(proteinIn || '0', 10) * 4 +
      parseInt(carbsIn || '0', 10) * 4 +
      parseInt(fatIn || '0', 10) * 9;

    // ratio for progress bar
    const ratio =
      todayEntry && dailyCalories > 0
        ? Math.max(0, Math.min((dailyCalories - remainingCals) / dailyCalories, 1))
        : 0;

    const barColor = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#1abc9c', '#e74c3c'],
    });

    return (
      <View style={{ flex: 1 }}>
        {/* HEADER ROW */}
        <View style={trackerStyles.headerRow}>
          <Text
            style={[
              trackerStyles.pageTitle,
              isDarkMode ? {} : trackerStyles.pageTitleLight,
            ]}
          >
            Today’s Tracker
          </Text>

          <TouchableOpacity
            style={[
              trackerStyles.editGoalsBtn,
              isDarkMode ? {} : trackerStyles.editGoalsBtnLight,
              { paddingVertical: 8, paddingHorizontal: 10 },
            ]}
            onPress={() => setShowQuiz(true)}
          >
            <Ionicons
              name="create-outline"
              size={20}
              color={isDarkMode ? '#fff' : '#000'}
            />
            <Text
              style={[
                trackerStyles.editGoalsText,
                isDarkMode ? {} : trackerStyles.editGoalsTextLight,
              ]}
            >
              Edit Goals
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* CALORIES OVERVIEW */}
          <View
            style={[
              styles.calorieOverview,
              isDarkMode ? {} : styles.calorieOverviewLight,
              { marginHorizontal: 20, marginTop: 10, paddingBottom: 16 },
            ]}
          >
            <View style={styles.calorieHeader}>
              <View>
                <Text
                  style={[
                    styles.calorieLabel,
                    isDarkMode ? {} : styles.calorieLabelLight,
                  ]}
                >
                  Remaining Calories
                </Text>
                <Text
                  style={[
                    styles.calorieSubtext,
                    isDarkMode ? {} : styles.calorieSubtextLight,
                    { marginTop: 4 },
                  ]}
                >
                  {remainingCals} / {dailyCalories}
                </Text>
              </View>
            </View>

            {/* PERCENTAGE TEXT */}
            <Text
              style={[
                styles.calorieSubtext,
                isDarkMode ? {} : styles.calorieSubtextLight,
                { marginTop: 8 },
              ]}
            >
              {`${Math.round(ratio * 100)}% eaten`}
            </Text>

            {/* PROGRESS BAR */}
            <View style={styles.progressBarContainer}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, width - 40], // 40 = left/right margin
                    }),
                    backgroundColor: barColor,
                  },
                ]}
              />
              <Animated.Text
                style={[
                  styles.progressPercentageLabel,
                  isDarkMode ? {} : styles.progressPercentageLabelLight,
                  {
                    left: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, width - 84], // keep label inside
                    }),
                  },
                ]}
              >
                {`${Math.round(ratio * 100)}%`}
              </Animated.Text>
            </View>

            {/* MACROS SUMMARY */}
            <View style={[styles.macroSection, { marginTop: 16 }]}>
              <View style={[styles.macroItem, isDarkMode ? {} : styles.macroItemLight]}>
                <Text style={[styles.macroName, isDarkMode ? {} : styles.macroNameLight]}>
                  PROTEIN
                </Text>
                <Text style={[styles.macroValue, isDarkMode ? {} : styles.macroValueLight]}>
                  {consumedProt}g
                </Text>
                <Text style={[styles.macroGoal, isDarkMode ? {} : styles.macroGoalLight]}>
                  / {proteinGoal}g
                </Text>
              </View>
              <View style={[styles.macroItem, isDarkMode ? {} : styles.macroItemLight]}>
                <Text style={[styles.macroName, isDarkMode ? {} : styles.macroNameLight]}>
                  CARBS
                </Text>
                <Text style={[styles.macroValue, isDarkMode ? {} : styles.macroValueLight]}>
                  {consumedCarb}g
                </Text>
                <Text style={[styles.macroGoal, isDarkMode ? {} : styles.macroGoalLight]}>
                  / {carbGoal}g
                </Text>
              </View>
              <View style={[styles.macroItem, isDarkMode ? {} : styles.macroItemLight]}>
                <Text style={[styles.macroName, isDarkMode ? {} : styles.macroNameLight]}>
                  FAT
                </Text>
                <Text style={[styles.macroValue, isDarkMode ? {} : styles.macroValueLight]}>
                  {consumedFat}g
                </Text>
                <Text style={[styles.macroGoal, isDarkMode ? {} : styles.macroGoalLight]}>
                  / {fatGoal}g
                </Text>
              </View>
            </View>

            {/* MICRONUTRIENT TOGGLE */}
            <TouchableOpacity
              style={[
                { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginLeft: 4 },
              ]}
              onPress={() => {}}
            >
              <Ionicons
                name="chevron-up-circle"
                size={20}
                color={isDarkMode ? '#fff' : '#000'}
              />
              <Text
                style={{
                  marginLeft: 6,
                  fontSize: 14,
                  fontWeight: '500',
                  color: isDarkMode ? '#fff' : '#000',
                }}
              >
                View Micronutrients
              </Text>
            </TouchableOpacity>

            {/* (Leave micronutrients as placeholders for now) */}
            <View style={{ marginTop: 8, marginLeft: 28 }}>
              <Text style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}>
                Iron: — mg
              </Text>
              <Text style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}>
                Calcium: — mg
              </Text>
              <Text style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}>
                Vitamin C: — mg
              </Text>
            </View>
          </View>

          {/* “Log Food” Toggle */}
          <TouchableOpacity
            style={[
              trackerStyles.accordionToggle,
              isDarkMode ? {} : trackerStyles.accordionToggleLight,
              { marginHorizontal: 20, marginTop: 16 },
            ]}
            onPress={() => setLogSectionVisible((prev) => !prev)}
          >
            <Ionicons
              name={logSectionVisible ? 'remove-circle-outline' : 'add-circle-outline'}
              size={20}
              color={isDarkMode ? '#fff' : '#000'}
            />
            <Text
              style={[
                trackerStyles.accordionText,
                isDarkMode ? {} : trackerStyles.accordionTextLight,
              ]}
            >
              {logSectionVisible ? 'Hide Log Food' : 'Log Food'}
            </Text>
          </TouchableOpacity>

          {/* LOG FOOD AREA */}
          {logSectionVisible && (
            <View style={{ marginTop: 12 }}>
              {/* LOG TABS */}
              <View
                style={[
                  trackerStyles.logTabsContainer,
                  isDarkMode ? {} : trackerStyles.logTabsContainerLight,
                ]}
              >
                <TouchableOpacity
                  style={[
                    trackerStyles.logTab,
                    activeLogTab === 'macros' && trackerStyles.logTabActive,
                  ]}
                  onPress={() => setActiveLogTab('macros')}
                >
                  <Text
                    style={[
                      trackerStyles.logTabText,
                      isDarkMode ? {} : trackerStyles.logTabTextLight,
                      activeLogTab === 'macros' && trackerStyles.logTabTextActive,
                    ]}
                  >
                    By Macros
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    trackerStyles.logTab,
                    activeLogTab === 'byName' && trackerStyles.logTabActive,
                  ]}
                  onPress={() => setActiveLogTab('byName')}
                >
                  <Text
                    style={[
                      trackerStyles.logTabText,
                      isDarkMode ? {} : trackerStyles.logTabTextLight,
                      activeLogTab === 'byName' && trackerStyles.logTabTextActive,
                    ]}
                  >
                    By Food Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    trackerStyles.logTab,
                    activeLogTab === 'addFood' && trackerStyles.logTabActive,
                  ]}
                  onPress={() => setActiveLogTab('addFood')}
                >
                  <Text
                    style={[
                      trackerStyles.logTabText,
                      isDarkMode ? {} : trackerStyles.logTabTextLight,
                      activeLogTab === 'addFood' && trackerStyles.logTabTextActive,
                    ]}
                  >
                    Add Food
                  </Text>
                </TouchableOpacity>
              </View>

              {/* LOG BY MACROS */}
              {activeLogTab === 'macros' && (
                <View
                  style={[
                    styles.foodSection,
                    isDarkMode ? {} : styles.foodSectionLight,
                    { marginHorizontal: 20, marginTop: 8 },
                  ]}
                >
                  {/* HEADER */}
                  <View style={trackerStyles.accordionHeader}>
                    <Text
                      style={[styles.foodSectionTitle, isDarkMode ? {} : styles.foodSectionTitleLight]}
                    >
                      Manual Food Log
                    </Text>
                  </View>

                  {/* PROTEIN */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Protein (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 20"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={proteinIn}
                      onChangeText={setProteinIn}
                    />
                  </View>

                  {/* CARBS */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Carbs (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 30"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={carbsIn}
                      onChangeText={setCarbsIn}
                    />
                  </View>

                  {/* FAT */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Fat (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 10"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={fatIn}
                      onChangeText={setFatIn}
                    />
                  </View>

                  {/* DERIVED CALORIES */}
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[styles.calorieLabel, isDarkMode ? {} : styles.calorieLabelLight]}
                    >
                      Calories (auto‐calculated)
                    </Text>
                    <Text
                      style={[
                        styles.calorieSubtext,
                        isDarkMode ? {} : styles.calorieSubtextLight,
                        { marginTop: 4, fontSize: 16 },
                      ]}
                    >
                      {derivedCalories} kcal
                    </Text>
                  </View>

                  {/* SUBMIT BUTTON */}
                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      {
                        marginTop: 20,
                        backgroundColor: '#1abc9c',
                        alignSelf: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={handleSubmitFoodLog_ByMacros}
                    disabled={submittingLog}
                  >
                    {submittingLog ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.setGoalBtnText}>Log This Meal</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      {
                        marginTop: 12,
                        backgroundColor: '#444',
                        alignSelf: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={() => setActiveLogTab('byName')}
                  >
                    <Text style={styles.setGoalBtnText}>Search My Foods</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* LOG BY FOOD NAME */}
              {activeLogTab === 'byName' && (
                <View
                  style={[
                    styles.foodSection,
                    isDarkMode ? {} : styles.foodSectionLight,
                    { marginHorizontal: 20, marginTop: 8 },
                  ]}
                >
                  <View style={trackerStyles.accordionHeader}>
                    <Text
                      style={[styles.foodSectionTitle, isDarkMode ? {} : styles.foodSectionTitleLight]}
                    >
                      Search Food
                    </Text>
                  </View>

                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Food Name
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. Banana"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={foodSearch}
                      onChangeText={setFoodSearch}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      { marginTop: 12, backgroundColor: '#1abc9c', alignSelf: 'center' },
                    ]}
                    onPress={handleFoodLookup}
                  >
                    <Text style={styles.setGoalBtnText}>Lookup</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      {
                        marginTop: 12,
                        backgroundColor: '#444',
                        alignSelf: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={() => setActiveLogTab('addFood')}
                  >
                    <Text style={styles.setGoalBtnText}>Add New Food</Text>
                  </TouchableOpacity>

                  {matchedFood && (
                    <View style={{ marginTop: 16 }}>
                      <Text
                        style={[styles.calorieLabel, isDarkMode ? {} : styles.calorieLabelLight]}
                      >
                        {matchedFood.name}:
                      </Text>
                      <Text
                        style={[
                          styles.calorieSubtext,
                          isDarkMode ? {} : styles.calorieSubtextLight,
                          { marginVertical: 6 },
                        ]}
                      >
                        P: {matchedFood.protein}g • C: {matchedFood.carbs}g • F: {matchedFood.fat}g
                      </Text>
                      <TouchableOpacity
                        style={[styles.setGoalBtn, { backgroundColor: '#1abc9c', alignSelf: 'center' }]}
                        onPress={handleSubmitFoodLog_ByMacros}
                        disabled={submittingLog}
                      >
                        {submittingLog ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.setGoalBtnText}>Log {matchedFood.name}</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* ADD NEW FOOD */}
              {activeLogTab === 'addFood' && (
                <View
                  style={[
                    styles.foodSection,
                    isDarkMode ? {} : styles.foodSectionLight,
                    { marginHorizontal: 20, marginTop: 8 },
                  ]}
                >
                  <View style={trackerStyles.accordionHeader}>
                    <Text
                      style={[styles.foodSectionTitle, isDarkMode ? {} : styles.foodSectionTitleLight]}
                    >
                      Add New Food
                    </Text>
                  </View>

                  {/* FOOD NAME */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Food Name
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. Oatmeal"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={newFoodName}
                      onChangeText={setNewFoodName}
                    />
                  </View>

                  {/* SERVING SIZE */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Serving Size (e.g. 1 cup)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 1 cup"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      value={newServingSize}
                      onChangeText={setNewServingSize}
                    />
                  </View>

                  {/* PROTEIN */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Protein (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 5"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={newProtein}
                      onChangeText={setNewProtein}
                    />
                  </View>

                  {/* CARBS */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Carbs (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 20"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={newCarbs}
                      onChangeText={setNewCarbs}
                    />
                  </View>

                  {/* FAT */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text
                      style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                    >
                      Fat (g)
                    </Text>
                    <TextInput
                      style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                      placeholder="e.g. 2"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      value={newFat}
                      onChangeText={setNewFat}
                    />
                  </View>

                  {/* SUBMIT BUTTON */}
                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      {
                        marginTop: 20,
                        backgroundColor: '#1abc9c',
                        alignSelf: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={handleAddNewFood}
                    disabled={submittingNewFood}
                  >
                    {submittingNewFood ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.setGoalBtnText}>Add New Food</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.setGoalBtn,
                      {
                        marginTop: 12,
                        backgroundColor: '#444',
                        alignSelf: 'center',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                      },
                    ]}
                    onPress={() => setActiveLogTab('byName')}
                  >
                    <Text style={styles.setGoalBtnText}>Back to Search</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* TODAY’S LOG SUMMARY */}
          {todayEntry && (
            <View style={{ marginTop: 24, marginHorizontal: 20 }}>
              <Text
                style={[styles.foodSectionTitle, isDarkMode ? {} : styles.foodSectionTitleLight]}
              >
                Today’s Totals
              </Text>
              <View
                style={[
                  styles.loggedFoodItem,
                  isDarkMode ? {} : styles.loggedFoodItemLight,
                  { justifyContent: 'space-between', padding: 14 },
                ]}
              >
                <View>
                  <Text
                    style={[styles.loggedFoodName, isDarkMode ? {} : styles.loggedFoodNameLight]}
                  >
                    Remaining Calories: {todayEntry.total_calories.toFixed(0)}
                  </Text>
                  <Text
                    style={[styles.loggedFoodMacros, isDarkMode ? {} : styles.loggedFoodMacrosLight]}
                  >
                    P: {todayEntry.protein.toFixed(0)}g • C: {todayEntry.carbs.toFixed(0)}g • F: {todayEntry.fat.toFixed(0)}g
                  </Text>
                  <Text
                    style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}
                  >
                    Goals → P: {todayEntry.protein_goal}g, C: {todayEntry.carb_goal}g, F: {todayEntry.fat_goal}g
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* bottom padding */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={internalStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#1abc9c" />
      </View>
    );
  }

  return <View style={{ flex: 1 }}>{showQuiz ? renderQuizSection() : renderTrackerUI()}</View>;
}

const internalStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
});

const trackerStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1abc9c',
  },
  pageTitleLight: {
    color: '#1abc9c',
  },
  editGoalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  editGoalsBtnLight: {
    backgroundColor: '#ddd',
    shadowColor: '#aaa',
    shadowOpacity: 0.2,
  },
  editGoalsText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  editGoalsTextLight: {
    color: '#000',
  },
  logTabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  logTabsContainerLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#ccc',
  },
  logTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logTabActive: {
    backgroundColor: '#1abc9c',
  },
  logTabText: {
    color: '#aaa',
    fontSize: 16,
  },
  logTabTextLight: {
    color: '#555',
  },
  logTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  accordionToggleLight: {
    backgroundColor: '#eee',
  },
  accordionText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  accordionTextLight: {
    color: '#000',
    marginLeft: 6,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
});
