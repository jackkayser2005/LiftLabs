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
import styles from './styles';

const { width } = Dimensions.get('window');

export default function CalorieTracker({ isDarkMode }) {
  // ───────── QUIZ (GOAL-SETTING) STATE ─────────
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [heightCm, setHeightCm] = useState(null);
  const [bodyFatPercentage, setBodyFatPercentage] = useState(null);

  const [currentWeight, setCurrentWeight] = useState(''); // lbs
  const [targetWeight, setTargetWeight] = useState(''); // lbs
  const [goalType, setGoalType] = useState('maintain');
  const [activityLevel, setActivityLevel] = useState('sedentary');

  // Track existing user_goals row (so we know whether to INSERT vs UPDATE)
  const [goalRowId, setGoalRowId] = useState(null);
  // Whether this is truly the “first time” they set a goal (for 250 XP)
  const [isFirstGoal, setIsFirstGoal] = useState(false);

  // ───────── MACRO GOALS ─────────
  const [dailyCalories, setDailyCalories] = useState(0);
  const [proteinGoal, setProteinGoal] = useState(0);
  const [carbGoal, setCarbGoal] = useState(0);
  const [fatGoal, setFatGoal] = useState(0);

  // ───────── TODAY’S FOOD LOG (“remaining” & “consumed”) ─────────
  const [proteinIn, setProteinIn] = useState('');
  const [carbsIn, setCarbsIn] = useState('');
  const [fatIn, setFatIn] = useState('');

  // todayEntry structure: { id, total_calories, protein, carbs, fat }
  const [todayEntry, setTodayEntry] = useState(null);

  // ───────── UI STATE ─────────
  const [loading, setLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(true);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [submittingLog, setSubmittingLog] = useState(false);

  // “Log Food” area visibility (hidden on login, expands when user taps “Log Food”)
  const [logSectionVisible, setLogSectionVisible] = useState(false);

  // Which “Log Food” tab is active: 'macros', 'byName', 'addFood'
  const [activeLogTab, setActiveLogTab] = useState('macros');

  // Micronutrient toggle (under “By Macros”)
  const [showMicros, setShowMicros] = useState(false);
  const [microIron, setMicroIron] = useState('');
  const [microCalcium, setMicroCalcium] = useState('');
  const [microVitC, setMicroVitC] = useState('');

  // Simple “streak” and experience points logic
  const [streakDays, setStreakDays] = useState(0);
  const [expPoints, setExpPoints] = useState(0);
  // Prevent awarding 500 XP more than once per day
  const [streakToday, setStreakToday] = useState(false);

  // ───────── ADD NEW FOOD STATE ─────────
  const [newFoodName, setNewFoodName] = useState('');
  const [newServingSize, setNewServingSize] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');
  const [submittingNewFood, setSubmittingNewFood] = useState(false);

  // ───────── PROGRESS BAR ANIMATION ─────────
  const progressAnim = useRef(new Animated.Value(0)).current;

  //────────────────────────────────────────────────────────────────
  // ON MOUNT → fetch body‐fat & height, then user_goals (skip quiz if exists),
  // then today’s calorie_logs & initialize progress. Finally hide loading spinner.
  //────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      await fetchBodyFatAndHeight();
      await fetchUserGoals();
      await fetchTodayLogs();
      setLoading(false);
    })();
  }, []);

  //────────────────────────────────────────────────────────────────
  // 1) FETCH BODY‐FAT & HEIGHT
  //────────────────────────────────────────────────────────────────
  async function fetchBodyFatAndHeight() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setHeightCm(null);
        setBodyFatPercentage(null);
        return;
      }

      let { data, error } = await supabase
        .from('body_fat_entries')
        .select('height, unit, body_fat_percentage, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Error fetching body_fat_entries:', error.message);
        setHeightCm(null);
        setBodyFatPercentage(null);
        return;
      }

      if (data && data.length > 0) {
        const entry = data[0];
        let hCm =
          entry.unit === 'imperial'
            ? parseFloat(entry.height) * 2.54
            : parseFloat(entry.height);

        setHeightCm(hCm);
        setBodyFatPercentage(entry.body_fat_percentage);
      } else {
        setHeightCm(null);
        setBodyFatPercentage(null);
      }
    } catch (e) {
      console.warn('Exception in fetchBodyFatAndHeight:', e.message);
      setHeightCm(null);
      setBodyFatPercentage(null);
    }
  }

  //────────────────────────────────────────────────────────────────
  // 2a) FETCH MOST RECENT user_goals → prepopulate quiz + skip it
  //────────────────────────────────────────────────────────────────
  async function fetchUserGoals() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      let { data, error } = await supabase
        .from('user_goals')
        .select(`
          id,
          age,
          gender,
          height_cm,
          current_weight,
          target_weight,
          activity_level,
          goal_type,
          daily_calories,
          protein_goal,
          carb_goal,
          fat_goal,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching user_goals:', error.message);
        return;
      }

      if (data) {
        // Pre‐fill all quiz fields from the most recent row
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
        // No existing goals → next save is “first time”
        setIsFirstGoal(true);
      }
    } catch (e) {
      console.warn('Exception in fetchUserGoals:', e.message);
    }
  }

  //────────────────────────────────────────────────────────────────
  // 2b) FETCH TODAY’S calorie_logs (and reset streakToday if date changed)
  //────────────────────────────────────────────────────────────────
  async function fetchTodayLogs() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setTodayEntry(null);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      let { data: todayLog, error: logError } = await supabase
        .from('calorie_logs')
        .select(`
          id,
          total_calories,
          protein_consumed,
          carb_consumed,
          fat_consumed
        `)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      // Reset our “streakToday” flag whenever we load fresh data for a new day.
      setStreakToday(false);

      if (logError && logError.code !== 'PGRST116') {
        console.warn('Error fetching today calorie_logs:', logError.message);
      }

      if (todayLog) {
        setTodayEntry({
          id: todayLog.id,
          total_calories: todayLog.total_calories,
          protein: todayLog.protein_consumed,
          carbs: todayLog.carb_consumed,
          fat: todayLog.fat_consumed,
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
  // 3) SUBMIT or UPDATE QUIZ → upsert user_goals + upsert calorie_logs
  //    (Grant 250 XP on first-time goal set)
  //────────────────────────────────────────────────────────────────
  async function handleSubmitQuiz() {
    // 3a) Rate-limit guard (no more than 25 changes in the last hour)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        return;
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      let { data: recentChanges, error: countError } = await supabase
        .from('user_goal_changes')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('changed_at', oneHourAgo);

      if (countError) {
        console.warn('Error counting recent goal changes:', countError.message);
      }
      const changeCount = recentChanges ? recentChanges.length : 0;
      if (changeCount >= 25) {
        Alert.alert(
          'Rate Limit Exceeded',
          'You have changed your goals 25 times in the last hour. Please wait before updating again.'
        );
        return;
      }
    } catch (e) {
      console.warn('Exception checking rate limit:', e.message);
      // Fail open → let user proceed
    }

    // 3b) Validate quiz fields
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        setSubmittingQuiz(false);
        return;
      }

      // 3c) Calculate macros via Mifflin–St Jeor + activity + goal
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

      // 3d) Upsert user_goals
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
        // INSERT a brand-new row: first-time goal set
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

        // Grant 250 XP on first goal set:
        if (isFirstGoal) {
          setExpPoints((prev) => prev + 250);
          Alert.alert('🎉 You earned 250 XP for setting your goals!');
          setIsFirstGoal(false);
        }
      }

      // 3e) Log this change for rate-limit purposes (ignore any error)
      try {
        await supabase.from('user_goal_changes').insert([{ user_id: user.id }]);
      } catch (logError) {
        console.warn('Failed to log goal change:', logError.message);
      }

      // 3f) Upsert “today” calorie_logs row (remaining calories = daily goal if new)
      const today = new Date().toISOString().split('T')[0];
      let { data: existingLog, error: fetchError } = await supabase
        .from('calorie_logs')
        .select('id, total_calories, protein_goal, carb_goal, fat_goal')
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error fetching today calorie_log:', fetchError.message);
      }

      if (!existingLog) {
        // INSERT new “today” log with macros from the newly set goal
        const { data: insertedLog, error: insertLogError } = await supabase
          .from('calorie_logs')
          .insert([
            {
              user_id: user.id,
              log_date: today,
              total_calories: calcCalories, // start “remaining” = daily goal
              protein_goal: protein,
              carb_goal: carbs,
              fat_goal: fat,
              protein_consumed: 0,
              carb_consumed: 0,
              fat_consumed: 0,
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
          });
        }
      } else {
        // UPDATE the goals fields (but do NOT touch total_calories, which is “remaining”)
        const { error: updateLogError } = await supabase
          .from('calorie_logs')
          .update({
            protein_goal: protein,
            carb_goal: carbs,
            fat_goal: fat,
          })
          .eq('id', existingLog.id);

        if (updateLogError) {
          console.warn('Error updating today calorie_log goals:', updateLogError.message);
        }

        // Refresh local state (including “remaining”)
        let { data: updatedLog, error: updatedFetchError } = await supabase
          .from('calorie_logs')
          .select('id, total_calories, protein_consumed, carb_consumed, fat_consumed')
          .eq('id', existingLog.id)
          .single();

        if (!updatedFetchError && updatedLog) {
          setTodayEntry({
            id: updatedLog.id,
            total_calories: updatedLog.total_calories,
            protein: updatedLog.protein_consumed,
            carbs: updatedLog.carb_consumed,
            fat: updatedLog.fat_consumed,
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
  // 4) CALCULATE MACROS (Mifflin–St Jeor + activity + goal adjustment)
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
  // 5a) MANUAL FOOD LOGGING (By Macros) → SUBTRACT from total_calories
  //     (Also handles streak & 500 XP awarding)
  //────────────────────────────────────────────────────────────────
  async function handleSubmitFoodLog_ByMacros() {
    if (!proteinIn.trim() || !carbsIn.trim() || !fatIn.trim()) {
      Alert.alert('Please fill in protein, carbs, and fat.');
      return;
    }
    setSubmittingLog(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        setSubmittingLog(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      // Derive calories from macros: 4 kcal/g (protein & carbs), 9 kcal/g (fat)
      const protVal = parseInt(proteinIn, 10);
      const carbVal = parseInt(carbsIn, 10);
      const fatVal = parseInt(fatIn, 10);
      const calsVal = protVal * 4 + carbVal * 4 + fatVal * 9;

      // 5a.i) Fetch (or create) “today’s” row
      let { data: existingLog, error: fetchError } = await supabase
        .from('calorie_logs')
        .select(`
          id,
          total_calories,
          protein_consumed,
          carb_consumed,
          fat_consumed
        `)
        .eq('user_id', user.id)
        .eq('log_date', today)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.warn('Error fetching today’s calorie_log:', fetchError.message);
        setSubmittingLog(false);
        return;
      }

      if (!existingLog) {
        // No “today” row yet → create it with current goal’s macros
        const { data: ug, error: ugError } = await supabase
          .from('user_goals')
          .select('daily_calories, protein_goal, carb_goal, fat_goal')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (ugError) {
          console.warn('Error fetching user_goals for new log:', ugError.message);
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
        };
        let { data: insertedLog, error: insertLogError } = await supabase
          .from('calorie_logs')
          .insert([insertPayload])
          .single();

        if (insertLogError) {
          console.warn('Error inserting today calorie_log:', insertLogError.message);
          setSubmittingLog(false);
          return;
        }
        existingLog = insertedLog;
      }

      // 5a.ii) Subtract derived calories from “remaining”
      let newRemaining = (existingLog.total_calories || 0) - calsVal;
      if (newRemaining < 0) newRemaining = 0; // Clamp at zero

      const updatedTotals = {
        total_calories: newRemaining,
        protein_consumed: (existingLog.protein_consumed || 0) + protVal,
        carb_consumed: (existingLog.carb_consumed || 0) + carbVal,
        fat_consumed: (existingLog.fat_consumed || 0) + fatVal,
      };

      const { error: updateError } = await supabase
        .from('calorie_logs')
        .update(updatedTotals)
        .eq('id', existingLog.id);

      if (updateError) {
        console.warn('Error updating today calorie_log:', updateError.message);
      } else {
        // 5a.iii) Update local state so UI immediately shows new remaining
        setTodayEntry({
          id: existingLog.id,
          total_calories: updatedTotals.total_calories,
          protein: updatedTotals.protein_consumed,
          carbs: updatedTotals.carb_consumed,
          fat: updatedTotals.fat_consumed,
        });

        // Refresh full log from DB to ensure data consistency
        await fetchTodayLogs();
      }

      // 5a.iv) Clear the macro inputs & collapse micros
      setProteinIn('');
      setCarbsIn('');
      setFatIn('');
      setShowMicros(false);

      // 5a.v) Animate the progress bar
      animateProgress();

      // 5a.vi) If remaining calories ≤ 0 and we haven't awarded streak/XP today:
      if (updatedTotals.total_calories <= 0 && !streakToday) {
        setStreakDays((prev) => prev + 1);
        setExpPoints((prev) => prev + 500);
        Alert.alert(
          '✅ Congratulations!',
          'You’ve consumed 100% of your calories. +500 XP, streak started!'
        );
        setStreakToday(true);
      }
    } catch (e) {
      console.warn('Exception in handleSubmitFoodLog_ByMacros:', e.message);
    }
    setSubmittingLog(false);
  }

  //────────────────────────────────────────────────────────────────
  // 5b) LOG FOOD BY NAME → simple lookup from a demo “foods” array
  //      → autofill macros and subtract just like ByMacros
  //────────────────────────────────────────────────────────────────

  // Fetch food items from the logged in user’s "foods" table
  const [foodSearch, setFoodSearch] = useState('');
  const [matchedFood, setMatchedFood] = useState(null);

  async function handleFoodLookup() {
    if (!foodSearch.trim()) {
      Alert.alert('Enter a food name to search.');
      return;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        return;
      }

      const { data, error } = await supabase
        .from('foods')
        .select('name, protein, carbs, fat')
        .ilike('name', foodSearch.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        Alert.alert('Not found', 'That food is not in your database.');
        setMatchedFood(null);
        return;
      }

      setMatchedFood(data);

      // Auto-fill macros so user can immediately log this food
      setProteinIn(data.protein.toString());
      setCarbsIn(data.carbs.toString());
      setFatIn(data.fat.toString());
    } catch (e) {
      console.warn('Exception in handleFoodLookup:', e.message);
    }
  }

  //────────────────────────────────────────────────────────────────
  // 5c) ADD NEW FOOD TO DATABASE WITH RATE LIMIT (5 per hour)
  //────────────────────────────────────────────────────────────────
  async function handleAddNewFood() {
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

    // Validate numeric fields
    const protVal = parseFloat(newProtein);
    const carbVal = parseFloat(newCarbs);
    const fatVal = parseFloat(newFat);
    if (isNaN(protVal) || isNaN(carbVal) || isNaN(fatVal)) {
      Alert.alert('Protein, carbs, and fat must be valid numbers.');
      return;
    }

    setSubmittingNewFood(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Not signed in');
        setSubmittingNewFood(false);
        return;
      }

      // Rate-limit: no more than 5 foods added in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      let { data: recentFoods, error: countError } = await supabase
        .from('foods')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', oneHourAgo);

      if (countError) {
        console.warn('Error counting recent foods:', countError.message);
      }
      const foodCount = recentFoods ? recentFoods.length : 0;
      if (foodCount >= 5) {
        Alert.alert(
          'Rate Limit Exceeded',
          'You have added 5 foods in the last hour. Please wait before adding more.'
        );
        setSubmittingNewFood(false);
        return;
      }

      // Insert new food
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
        Alert.alert('Success', `${newFoodName.trim()} added to your foods!`);
        // Clear form
        setNewFoodName('');
        setNewServingSize('');
        setNewProtein('');
        setNewCarbs('');
        setNewFat('');
      }
    } catch (e) {
      console.warn('Exception in handleAddNewFood:', e.message);
    }
    setSubmittingNewFood(false);
  }

  //────────────────────────────────────────────────────────────────
  // 6) ANIMATE PROGRESS BAR
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

  // Re-run animation whenever todayEntry or dailyCalories changes
  useEffect(() => {
    if (!showQuiz) {
      animateProgress();
    }
  }, [todayEntry, dailyCalories]);

  //────────────────────────────────────────────────────────────────
  // RENDER QUIZ SECTION (Goal-Setting)
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
        <View style={[styles.goalSection, isDarkMode ? {} : styles.goalSectionLight]}>
          <Text style={[styles.goalTitle, isDarkMode ? {} : styles.goalTitleLight]}>
            Tell Us About Yourself
          </Text>

          {heightCm == null ? (
            <Text style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}>
              ⚠️ We don’t have your height on file. Please calculate your Body-Fat first in the
              Body screen.
            </Text>
          ) : (
            <Text style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}>
              Your Height: {heightCm.toFixed(0)} cm
            </Text>
          )}

          {/* AGE */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
            <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
            <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
            <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
            <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
  // RENDER TRACKER (AFTER QUIZ)
  // Separating “Remaining Calories” and “Log Food” into two distinct sections.
  //────────────────────────────────────────────────────────────────
  function renderTrackerUI() {
    const remainingCals = todayEntry?.total_calories ?? 0;
    const consumedCals = dailyCalories > 0 ? dailyCalories - remainingCals : 0;
    const consumedProt = todayEntry?.protein ?? 0;
    const consumedCarb = todayEntry?.carbs ?? 0;
    const consumedFat = todayEntry?.fat ?? 0;

    // Derived calories (for autocomplete in “By Food Name”)
    const derivedCalories =
      (parseInt(proteinIn || '0', 10) * 4) +
      (parseInt(carbsIn || '0', 10) * 4) +
      (parseInt(fatIn || '0', 10) * 9);

    // Ratio for progress bar
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
        {/* ─── HEADER ROW ─── */}
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
          {/* ─── CALORIES OVERVIEW (BOX) ─── */}
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
                  style={[styles.calorieLabel, isDarkMode ? {} : styles.calorieLabelLight]}
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

            {/* ── MICRONUTRIENT TOGGLE ── */}
            <TouchableOpacity
              style={[
                { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginLeft: 4 },
              ]}
              onPress={() => setShowMicros((prev) => !prev)}
            >
              <Ionicons
                name={showMicros ? 'chevron-down-circle' : 'chevron-up-circle'}
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
                {showMicros ? 'Hide Micronutrients' : 'View Micronutrients'}
              </Text>
            </TouchableOpacity>

            {showMicros && (
              <View style={{ marginTop: 8, marginLeft: 28 }}>
                {/* Placeholder values: replace “—” with real data once DB is ready */}
                <Text
                  style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}
                >
                  Iron: — mg
                </Text>
                <Text
                  style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}
                >
                  Calcium: — mg
                </Text>
                <Text
                  style={[styles.calorieSubtext, isDarkMode ? {} : styles.calorieSubtextLight]}
                >
                  Vitamin C: — mg
                </Text>
              </View>
            )}
          </View>

          {/* ─── “Log Food” Toggle Button (Outside of the Calories Box) ─── */}
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

          {/* ─── LOG FOOD AREA (Hidden if logSectionVisible=false) ─── */}
          {logSectionVisible && (
            <View style={{ marginTop: 12 }}>
              {/* ─── LOG TABS ─── */}
              <View style={trackerStyles.logTabsContainer}>
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
                      activeLogTab === 'addFood' && trackerStyles.logTabTextActive,
                    ]}
                  >
                    Add Food
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ─── LOG BY MACROS ─── */}
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
                      style={[
                        styles.foodSectionTitle,
                        isDarkMode ? {} : styles.foodSectionTitleLight,
                      ]}
                    >
                      Manual Food Log
                    </Text>
                  </View>

                  {/* PROTEIN */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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

                  {/* DERIVED CALORIES (read-only) */}
                  <View style={{ marginTop: 12 }}>
                    <Text
                      style={[styles.calorieLabel, isDarkMode ? {} : styles.calorieLabelLight]}
                    >
                      Calories (auto-calculated)
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

                  {/* MICRONUTRIENT TOGGLE */}
                  <TouchableOpacity
                    style={[
                      trackerStyles.microsToggle,
                      isDarkMode ? {} : trackerStyles.microsToggleLight,
                    ]}
                    onPress={() => setShowMicros((prev) => !prev)}
                  >
                    <Ionicons
                      name={showMicros ? 'chevron-down-circle' : 'chevron-up-circle'}
                      size={20}
                      color={isDarkMode ? '#fff' : '#000'}
                    />
                    <Text
                      style={[
                        trackerStyles.microsToggleText,
                        isDarkMode ? {} : trackerStyles.microsToggleTextLight,
                      ]}
                    >
                      {showMicros ? 'Hide Micronutrients' : 'Add Micronutrients'}
                    </Text>
                  </TouchableOpacity>

                  {showMicros && (
                    <View style={{ marginTop: 10 }}>
                      <View style={[styles.inputGroup, { marginBottom: 10 }]}>
                        <Text
                          style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                        >
                          Iron (mg)
                        </Text>
                        <TextInput
                          style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                          placeholder="e.g. 8"
                          placeholderTextColor={isDarkMode ? '#666' : '#999'}
                          keyboardType="numeric"
                          value={microIron}
                          onChangeText={setMicroIron}
                        />
                      </View>
                      <View style={[styles.inputGroup, { marginBottom: 10 }]}>
                        <Text
                          style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                        >
                          Calcium (mg)
                        </Text>
                        <TextInput
                          style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                          placeholder="e.g. 300"
                          placeholderTextColor={isDarkMode ? '#666' : '#999'}
                          keyboardType="numeric"
                          value={microCalcium}
                          onChangeText={setMicroCalcium}
                        />
                      </View>
                      <View style={styles.inputGroup}>
                        <Text
                          style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}
                        >
                          Vitamin C (mg)
                        </Text>
                        <TextInput
                          style={[styles.input, isDarkMode ? {} : styles.inputLight]}
                          placeholder="e.g. 60"
                          placeholderTextColor={isDarkMode ? '#666' : '#999'}
                          keyboardType="numeric"
                          value={microVitC}
                          onChangeText={setMicroVitC}
                        />
                      </View>
                    </View>
                  )}

                  {/* SUBMIT BUTTON (“Log This Meal”) */}
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

              {/* ─── LOG BY FOOD NAME ─── */}
              {activeLogTab === 'byName' && (
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
                      style={[
                        styles.foodSectionTitle,
                        isDarkMode ? {} : styles.foodSectionTitleLight,
                      ]}
                    >
                      Search Food
                    </Text>
                  </View>

                  {/* FOOD NAME INPUT */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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

                  {/* If matchedFood, show its macros & allow “Log <Food>” */}
                  {matchedFood && (
                    <View style={{ marginTop: 16 }}>
                      <Text
                        style={[
                          styles.calorieLabel,
                          isDarkMode ? {} : styles.calorieLabelLight,
                        ]}
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
                        P: {matchedFood.protein}g • C: {matchedFood.carbs}g • F:{' '}
                        {matchedFood.fat}g
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.setGoalBtn,
                          { backgroundColor: '#1abc9c', alignSelf: 'center' },
                        ]}
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

              {/* ─── ADD NEW FOOD ─── */}
              {activeLogTab === 'addFood' && (
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
                      style={[
                        styles.foodSectionTitle,
                        isDarkMode ? {} : styles.foodSectionTitleLight,
                      ]}
                    >
                      Add New Food
                    </Text>
                  </View>

                  {/* FOOD NAME */}
                  <View style={[styles.inputGroup, { marginTop: 10 }]}>
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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
                    <Text style={[styles.inputLabel, isDarkMode ? {} : styles.inputLabelLight]}>
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

                  {/* SUBMIT BUTTON (“Add New Food”) */}
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

          {/* ─── TODAY’S LOG SUMMARY ─── */}
          {todayEntry && (
            <View style={{ marginTop: 24, marginHorizontal: 20 }}>
              <Text
                style={[
                  styles.foodSectionTitle,
                  isDarkMode ? {} : styles.foodSectionTitleLight,
                ]}
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
                    style={[
                      styles.loggedFoodName,
                      isDarkMode ? {} : styles.loggedFoodNameLight,
                    ]}
                  >
                    Remaining Calories: {todayEntry.total_calories.toFixed(0)}
                  </Text>
                  <Text
                    style={[
                      styles.loggedFoodMacros,
                      isDarkMode ? {} : styles.loggedFoodMacrosLight,
                    ]}
                  >
                    P: {todayEntry.protein.toFixed(0)}g • C: {todayEntry.carbs.toFixed(0)}g • F:{' '}
                    {todayEntry.fat.toFixed(0)}g
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Add some bottom padding so last content isn’t cut off */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    );
  }

  //────────────────────────────────────────────────────────────────
  // MAIN RENDER: LOADING → QUIZ → TRACKER
  //────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────
// New styles specific to the tracker UI (tabs, toggles, etc.)
// ─────────────────────────────────────────────────────────────────
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
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  logTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  logTabActive: {
    borderBottomColor: '#1abc9c',
  },
  logTabText: {
    color: '#aaa',
    fontSize: 16,
  },
  logTabTextActive: {
    color: '#1abc9c',
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
  microsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  microsToggleLight: {
    // no background change, just text changes via microsToggleTextLight
  },
  microsToggleText: {
    color: '#1abc9c',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  microsToggleTextLight: {
    color: '#1abc9c',
  },
});
