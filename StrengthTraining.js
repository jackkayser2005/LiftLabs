// StrengthTraining.js

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Swipeable,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { supabase } from './supabaseClient';
import { updateDailyStreak } from './lib/streak';
import styles from './styles';

// Sensible upper bounds to prevent absurd input values
const MAX_WEIGHT = 1500; // lbs
const MAX_REPS = 100;

const { width } = Dimensions.get('window');

const StrengthTraining = ({ setCurrentScreen, isDarkMode }) => {
  // ─── 1) State Hooks ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // Profile EXP + last award date
  const [profileExp, setProfileExp] = useState(0);
  const [lastExpDate, setLastExpDate] = useState(null);

  // Exercise form fields
  const [sessionName, setSessionName] = useState('');
  const [exercise, setExercise] = useState('');
  const [notes, setNotes] = useState('');
  const [currentSets, setCurrentSets] = useState([{ weight: '', reps: '' }]);

  // One-Rep Max calculator
  const [calcWeight, setCalcWeight] = useState('');
  const [calcReps, setCalcReps] = useState('');
  const [calcResult, setCalcResult] = useState(null);
  const [calcTip, setCalcTip] = useState('');

  // Date is always today
  const todayString = new Date().toISOString().slice(0, 10);

  // Holds all “pending” sets to be saved together
  const [pendingWorkout, setPendingWorkout] = useState([]);

  // Fetched past logs
  const [logs, setLogs] = useState([]);
  const [groupedLogs, setGroupedLogs] = useState({});

  // If user taps a date, show details
  const [selectedDate, setSelectedDate] = useState(null);

  // Controls for dropdown panels
  const [addOpen, setAddOpen] = useState(false);
  const [oneRepOpen, setOneRepOpen] = useState(false);

  // “Flash banner” for success/error messages
  const [flashMessage, setFlashMessage] = useState('');
  const [flashBg, setFlashBg] = useState('#1abc9c'); // green by default
  const [flashType, setFlashType] = useState('success');
  const flashAnim = useRef(new Animated.Value(-80)).current; // banner height

  // “+250 EXP” pop-up
  const [showExpPopup, setShowExpPopup] = useState(false);
  const expFade = useRef(new Animated.Value(0)).current;

  // Streak tracking
  const [streakDays, setStreakDays] = useState(0);
  const [streakToday, setStreakToday] = useState(false);

  // ─── FlashBanner Helpers ─────────────────────────────────────────────────────────
  const showMessage = (msg, type = 'success') => {
    // type: 'success' (green) or 'error' (red)
    setFlashType(type);
    setFlashBg(type === 'success' ? '#1abc9c' : '#e74c3c');
    setFlashMessage(msg);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // Hide after 2s
      setTimeout(() => {
        Animated.timing(flashAnim, {
          toValue: -80,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setFlashMessage(''));
      }, 2000);
    });
  };

  // ─── 2) Fetch current user, profile, & logs ───────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);

        // Fetch profile.exp and profile.last_exp_date
        const { data: prof, error: profErr } = await supabase
          .from('profile')
          .select('exp, last_exp_date')
          .eq('id', data.session.user.id)
          .single();

        if (profErr) {
          console.warn('Error fetching profile:', profErr);
        } else {
          setProfileExp(prof.exp || 0);
          setLastExpDate(prof.last_exp_date);
        }

        // Initialize streak info
        await fetchStreakInfo(data.session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    if (user) fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('strength_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('date_performed', { ascending: false });

    if (error) {
      console.warn('Error fetching logs:', error);
      return;
    }

    setLogs(data);

    // Group by date_performed
    const grouped = data.reduce((acc, entry) => {
      const dateKey = entry.date_performed;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {});
    setGroupedLogs(grouped);
  };

  const fetchStreakInfo = async (uid) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('calorie_logs')
      .select('log_date, streak_days')
      .eq('user_id', uid)
      .order('log_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      setStreakDays(data.streak_days || 0);
      if (data.log_date === today) setStreakToday(true);
    }
  };

  // ─── 3) Helpers: 1RM & Tips ─────────────────────────────────────────────────────────
  const calculateOneRepMax = (w, r) => Math.round(w * (1 + r / 30));
  const generateTip = (repMax) => {
    if (repMax < 100) return 'Keep at it—focus on consistency and form.';
    if (repMax < 200) return 'Nice work! Try small weight jumps to keep progress.';
    return 'Beast mode! Mix up rep ranges to avoid plateaus.';
  };

  // Revised calorie estimate: Σ(weight_lbs × reps × 0.05)
  const estimateCaloriesForSession = (sessionEntries) =>
    sessionEntries.reduce((sum, ent) => sum + ent.weight * ent.reps * 0.05, 0);

  // ─── 4) Manage dynamic set rows ───────────────────────────────────────────────────
  const addEmptySetRow = () => {
    setCurrentSets((prev) => [...prev, { weight: '', reps: '' }]);
  };
  const removeSetRow = (index) => {
    setCurrentSets((prev) => prev.filter((_, i) => i !== index));
  };
  const updateSetField = (index, field, value) => {
    setCurrentSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  // ─── 5) “Add to Current Workout” Handler ─────────────────────────────────────────
  const handleAddToPending = () => {
    if (!sessionName.trim()) {
      showMessage('Enter a session/workout name.', 'error');
      return;
    }
    if (!exercise.trim()) {
      showMessage('Enter the exercise name first.', 'error');
      return;
    }
    if (currentSets.length === 0) {
      showMessage('Add at least one set before proceeding.', 'error');
      return;
    }

    // Validate each set
    const parsedSets = currentSets.map((s) => {
      const wNum = parseFloat(s.weight);
      const rNum = parseInt(s.reps, 10);
      return { wNum, rNum };
    });

    for (let i = 0; i < parsedSets.length; i++) {
      const { wNum, rNum } = parsedSets[i];
      if (isNaN(wNum) || isNaN(rNum) || wNum <= 0 || rNum <= 0) {
        showMessage(`Set ${i + 1} must have positive weight & reps.`, 'error');
        return;
      }
      if (wNum > MAX_WEIGHT || rNum > MAX_REPS) {
        showMessage(
          `Set ${i + 1} exceeds ${MAX_WEIGHT} lbs or ${MAX_REPS} reps limit.`,
          'error'
        );
        return;
      }
    }

    // Build pending‐workout entries (one per set), including sessionName
    const newEntries = parsedSets.map(({ wNum, rNum }) => {
      const repMax = calculateOneRepMax(wNum, rNum);
      return {
        id: Date.now().toString() + Math.random().toString().slice(2),
        sessionName: sessionName.trim(),
        exercise: exercise.trim(),
        date_performed: todayString,
        sets: 1,
        reps: rNum,
        weight: wNum,
        rep_max: repMax,
        notes: notes.trim() || null,
      };
    });

    // Show summary tip
    const highestRepMax = Math.max(...newEntries.map((e) => e.rep_max));
    const tip = generateTip(highestRepMax);

    setPendingWorkout((prev) => [...prev, ...newEntries]);

    // Clear only the exercise fields (preserve sessionName)
    setExercise('');
    setNotes('');
    setCurrentSets([{ weight: '', reps: '' }]);

    showMessage(
      `Added ${newEntries.length} set(s) to "${sessionName}". Highest 1RM ${highestRepMax} lbs.`,
      'success'
    );
  };

  // ─── 6) “Save Workout” Handler ─────────────────────────────────────────────────────
  const handleSaveWorkout = async () => {
    if (pendingWorkout.length === 0) {
      showMessage('Add at least one exercise first.', 'error');
      return;
    }

    // Prepare payload for strength_logs
    const payload = pendingWorkout.map((item) => ({
      user_id: user.id,
      session: item.sessionName, // is TEXT in table
      exercise: item.exercise,
      date_performed: item.date_performed,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      rep_max: item.rep_max,
      notes: item.notes,
    }));

    const { data, error } = await supabase.from('strength_logs').insert(payload);

    if (error) {
      console.warn('Error inserting workout batch:', error);
      if (
        error.message.includes('column') &&
        error.message.includes('session')
      ) {
        showMessage(
          'Your `strength_logs` table is missing a TEXT “session” column.',
          'error'
        );
      } else {
        showMessage('Could not save workout. Check RLS policies.', 'error');
      }
      return;
    }

    // After saving to strength_logs, insert into calorie_logs
    const totalCalories = Math.round(
      estimateCaloriesForSession(pendingWorkout)
    );
    const { error: calErr } = await supabase
      .from('calorie_logs')
      .insert({
        user_id: user.id,
        date: todayString,
        total_burned: totalCalories,
      });

    if (calErr) {
      console.warn('Error inserting calorie_log:', calErr);
      showMessage('Workout saved, but couldn’t log calories.', 'error');
    } else {
      showMessage(`Workout saved (≈${totalCalories} kcal).`, 'success');
    }

    // Reset local form state
    setPendingWorkout([]);
    setSessionName('');
    fetchLogs();

    // ─── Award +250 EXP Only Once Today ─────────────────────────────────────────────
    if (lastExpDate !== todayString) {
      const newExp = (profileExp || 0) + 250;
      const { error: expErr } = await supabase
        .from('profile')
        .update({
          exp: newExp,
          last_exp_date: todayString,
        })
        .eq('id', user.id);

      if (expErr) {
        console.warn('Error updating exp:', expErr);
      } else {
        setProfileExp(newExp);
        setLastExpDate(todayString);

        // Show +250 EXP pop-up
        setShowExpPopup(true);
        Animated.timing(expFade, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    }

    if (!streakToday) {
      const newStreak = await updateDailyStreak(user.id);
      if (newStreak !== null) {
        setStreakDays(newStreak);
        setStreakToday(true);
      }
    }
  };

  // ─── 7) “1RM Calculator” Handler ─────────────────────────────────────────────────
  const handleCalculate1RM = () => {
    if (!calcWeight || !calcReps) {
      showMessage('Enter weight and reps first.', 'error');
      return;
    }
    const wNum = parseFloat(calcWeight);
    const rNum = parseInt(calcReps, 10);
    if (isNaN(wNum) || isNaN(rNum) || wNum <= 0 || rNum <= 0) {
      showMessage('Weight and reps must be positive numbers.', 'error');
      return;
    }
    if (wNum > MAX_WEIGHT || rNum > MAX_REPS) {
      showMessage(
        `Weight must be ≤${MAX_WEIGHT} lbs and reps ≤${MAX_REPS}.`,
        'error'
      );
      return;
    }
    const oneRM = calculateOneRepMax(wNum, rNum);
    const tip = generateTip(oneRM);
    setCalcResult(oneRM);
    setCalcTip(tip);
    showMessage(`Estimated 1RM: ${oneRM} lbs.`, 'success');
  };

  // ─── 8) Delete Single Log ─────────────────────────────────────────────────────────
  const deleteSingleLog = async (logId) => {
    // 1) Remove from database:
    const { error } = await supabase
      .from('strength_logs')
      .delete()
      .eq('id', logId);

    if (error) {
      console.warn('Error deleting log:', error);
      showMessage('Could not delete that log entry.', 'error');
      return;
    }

    // 2) Immediately remove from local state (logs & groupedLogs):
    const updatedLogs = logs.filter((l) => l.id !== logId);
    setLogs(updatedLogs);

    const reGrouped = updatedLogs.reduce((acc, entry) => {
      const dateKey = entry.date_performed;
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {});
    setGroupedLogs(reGrouped);

    showMessage('Entry deleted.', 'success');
  };

  // ─── 9) Render “Delete” action for Swipeable ─────────────────────────────────────
  const renderRightActions = (progress, dragX, logId) => {
    return (
      <TouchableOpacity
        style={localStyles.swipeDelete}
        onPress={() => deleteSingleLog(logId)}
      >
        <Ionicons name="trash-outline" size={30} color="#fff" />
        <Text style={localStyles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  // ─── 10) Render Past-Workout Date Tiles ───────────────────────────────────────────
  const renderDateTiles = () => {
    const dates = Object.keys(groupedLogs);
    if (dates.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="barbell-outline"
            size={64}
            color={isDarkMode ? '#666' : '#999'}
          />
          <Text style={[styles.emptyText, !isDarkMode && styles.emptyTextLight]}>
            No workouts logged yet
          </Text>
          <Text
            style={[
              styles.emptySubtext,
              !isDarkMode && styles.emptySubtextLight,
            ]}
          >
            Add a workout above to get started.
          </Text>
        </View>
      );
    }

    return dates.map((dateKey) => {
      const totalEntries = groupedLogs[dateKey].length;
      return (
        <TouchableOpacity
          key={dateKey}
          style={[localStyles.dateCard, !isDarkMode && localStyles.dateCardLight]}
          onPress={() => setSelectedDate(dateKey)}
        >
          <View style={localStyles.dateInfo}>
            <Text
              style={[
                localStyles.dateText,
                { color: isDarkMode ? '#1abc9c' : '#007b5e' },
                !isDarkMode && localStyles.dateTextLight,
              ]}
            >
              {dateKey}
            </Text>
            <Text
              style={[
                localStyles.setCountText,
                !isDarkMode && localStyles.setCountTextLight,
              ]}
            >
              {totalEntries} set{totalEntries > 1 ? 's' : ''}
            </Text>
          </View>
        </TouchableOpacity>
      );
    });
  };

  // ─── 11) Render Details for a Selected Date ───────────────────────────────────────
  const renderDetailsForDate = () => {
    const entries = groupedLogs[selectedDate] || [];

    // Group by sessionName
    const sessionsMap = entries.reduce((acc, entry) => {
      const sess = entry.session || 'Default';
      if (!acc[sess]) acc[sess] = [];
      acc[sess].push(entry);
      return acc;
    }, {});

    return (
      <View
        style={[
          localStyles.overlayContainer,
          { backgroundColor: isDarkMode ? '#000' : '#f8f9fa' },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { marginBottom: 14 }]}
          onPress={() => setSelectedDate(null)}
        >
          <Ionicons name="arrow-back" size={20} color="#1abc9c" />
          <Text style={styles.backText}>Back to dates</Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.screenTitle,
            { marginBottom: 12, fontSize: 22 },
            !isDarkMode && styles.screenTitleLight,
          ]}
        >
          {selectedDate} Workouts
        </Text>

        <ScrollView>
          {Object.keys(sessionsMap).map((sessName) => {
            const sessionEntries = sessionsMap[sessName];
            const calories = Math.round(
              estimateCaloriesForSession(sessionEntries)
            );

            return (
              <View key={sessName} style={{ marginBottom: 24 }}>
                {/* Session Header */}
                <View
                  style={[
                    localStyles.sessionHeader,
                    !isDarkMode && localStyles.sessionHeaderLight,
                  ]}
                >
                  <Text
                    style={[
                      localStyles.sessionTitle,
                      !isDarkMode && localStyles.sessionTitleLight,
                    ]}
                  >
                    {sessName}
                  </Text>
                  <Text
                    style={[
                      localStyles.sessionCalories,
                      !isDarkMode && localStyles.sessionCaloriesLight,
                    ]}
                  >
                    ≈ {calories} kcal
                  </Text>
                </View>

                {/* Each set/exercise in this session */}
                {sessionEntries.map((log) => (
                  <Swipeable
                    key={log.id}
                    renderRightActions={(progress, dragX) =>
                      renderRightActions(progress, dragX, log.id)
                    }
                  >
                    <View
                      style={[
                        localStyles.detailCard,
                        !isDarkMode && localStyles.detailCardLight,
                      ]}
                    >
                      <View style={localStyles.detailInfo}>
                        <Text
                          style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}
                        >
                          {log.exercise} — 1×{log.reps} @ {log.weight} lbs
                        </Text>
                        <Text
                          style={[
                            styles.statValue,
                            { fontSize: 14, marginTop: 6 },
                            !isDarkMode && styles.statValueLight,
                            { color: isDarkMode ? '#1abc9c' : '#007b5e' },
                          ]}
                        >
                          1RM: {log.rep_max} lbs
                        </Text>
                        {log.notes ? (
                          <Text
                            style={[
                              styles.tooltipText,
                              !isDarkMode && styles.tooltipTextLight,
                              { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
                            ]}
                          >
                            “{log.notes}”
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Swipeable>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // ─── 12) MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#f8f9fa' }}>
      {/* ─── Flash Banner ───────────────────────────────────────────────────────────── */}
      {flashMessage !== '' && (
        <Animated.View
          style={[
            localStyles.flashBanner,
            { transform: [{ translateY: flashAnim }] },
          ]}
        >
          <View style={[localStyles.flashContent, { backgroundColor: flashBg }]}>
            <Ionicons
              name={
                flashType === 'success'
                  ? 'checkmark-circle-outline'
                  : 'alert-circle-outline'
              }
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={localStyles.flashText}>{flashMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* ─── Back Button & Header ─────────────────────────────────────────────────── */}
      <View style={{ paddingTop: 10, paddingHorizontal: 20 }}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <View style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1abc9c" />
            <Text style={styles.backText}>Back</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Ionicons name="barbell" size={36} color="#1abc9c" />
        <Text
          style={[
            styles.screenTitle,
            { marginTop: 6, fontSize: 24 },
            !isDarkMode && styles.screenTitleLight,
          ]}
        >
          Strength Training
        </Text>
      </View>

      {/* ─── Scrollable Content ─────────────────────────────────────────────────────── */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ─── “1RM Calculator” Dropdown Header ─────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => {
            setOneRepOpen((prev) => !prev);
            if (!oneRepOpen) setAddOpen(false);
          }}
          style={[
            localStyles.dropdownHeader,
            { backgroundColor: isDarkMode ? '#111' : '#fff' },
            !isDarkMode && localStyles.dropdownHeaderLight,
          ]}
        >
          <Text
            style={[
              localStyles.dropdownHeaderText,
              !isDarkMode && localStyles.dropdownHeaderTextLight,
            ]}
          >
            One-Rep Max Calculator
          </Text>
          <Ionicons
            name={oneRepOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={24}
            color={isDarkMode ? '#1abc9c' : '#007b5e'}
          />
        </TouchableOpacity>

        {oneRepOpen && (
          <View
            style={[
              localStyles.cardContainer,
              !isDarkMode && localStyles.cardContainerLight,
            ]}
          >
            {/* Weight Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Weight Lifted (lbs)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fff',
                    borderRadius: 6,
                    padding: 10,
                  },
                ]}
                placeholder="e.g. 185"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                keyboardType="numeric"
                maxLength={4}
                value={calcWeight}
                onChangeText={setCalcWeight}
              />
            </View>

            {/* Reps Input */}
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Reps Completed
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fff',
                    borderRadius: 6,
                    padding: 10,
                  },
                ]}
                placeholder="e.g. 5"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                keyboardType="numeric"
                maxLength={3}
                value={calcReps}
                onChangeText={setCalcReps}
              />
            </View>

            {/* Calculate Button */}
            <TouchableOpacity
              style={[styles.calculateBtn, localStyles.calcButton]}
              onPress={handleCalculate1RM}
            >
              <Ionicons name="calculator-outline" size={20} color="#fff" />
              <Text style={[styles.calculateBtnText, { color: '#fff' }]}>
                Calculate
              </Text>
            </TouchableOpacity>

            {calcResult !== null && (
              <View
                style={[
                  localStyles.resultContainer,
                  !isDarkMode && localStyles.resultContainerLight,
                ]}
              >
                <Text style={[styles.resultTitle, !isDarkMode && styles.resultTitleLight]}>
                  Estimated 1RM
                </Text>
                <View style={styles.resultDisplay}>
                  <Text
                    style={[
                      styles.resultNumber,
                      { color: isDarkMode ? '#1abc9c' : '#007b5e' },
                    ]}
                  >
                    {calcResult} lbs
                  </Text>
                </View>
                <Text
                  style={[styles.resultAdvice, !isDarkMode && styles.resultAdviceLight]}
                >
                  {calcTip}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── “Add Exercise” Dropdown Header ─────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => {
            setAddOpen((prev) => !prev);
            if (!addOpen) setOneRepOpen(false);
          }}
          style={[
            localStyles.dropdownHeader,
            { backgroundColor: isDarkMode ? '#111' : '#fff' },
            !isDarkMode && localStyles.dropdownHeaderLight,
          ]}
        >
          <Text
            style={[
              localStyles.dropdownHeaderText,
              !isDarkMode && localStyles.dropdownHeaderTextLight,
            ]}
          >
            Add Exercise
          </Text>
          <Ionicons
            name={addOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={24}
            color={isDarkMode ? '#1abc9c' : '#007b5e'}
          />
        </TouchableOpacity>

        {/* ─── “Add Exercise” Form ─────────────────────────────────────────────────────── */}
        {addOpen && (
          <View
            style={[
              localStyles.cardContainer,
              !isDarkMode && localStyles.cardContainerLight,
            ]}
          >
            {/* Session/Workout Name */}
            <View style={[styles.inputGroup, { marginBottom: 12 }]}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Session Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fff',
                    borderRadius: 6,
                    padding: 10,
                  },
                ]}
                placeholder="e.g. Morning Upper"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={sessionName}
                onChangeText={setSessionName}
              />
            </View>

            {/* (Date is auto‐today; no input needed) */}
            <View style={{ marginBottom: 16 }}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Workout Date
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fafafa',
                    borderRadius: 6,
                    padding: 10,
                  },
                ]}
                value={todayString}
                editable={false}
              />
            </View>

            <Text style={[localStyles.cardTitle, !isDarkMode && localStyles.cardTitleLight]}>
              Exercise Details
            </Text>

            {/* Exercise Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Exercise Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fff',
                    borderRadius: 6,
                  },
                ]}
                placeholder="e.g. Squat"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={exercise}
                onChangeText={setExercise}
              />
            </View>

            {/* Dynamic Set Rows */}
            <View style={{ marginTop: 14, marginBottom: 20 }}>
              {currentSets.map((s, idx) => (
                <View key={idx} style={localStyles.setRow}>
                  <View style={localStyles.setInputWrapper}>
                    <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                      Weight (lbs)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        !isDarkMode && styles.inputLight,
                        {
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#333' : '#ddd',
                          backgroundColor: isDarkMode ? '#111' : '#fff',
                          borderRadius: 6,
                          padding: 10,
                        },
                      ]}
                      placeholder="e.g. 185"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      maxLength={4}
                      value={s.weight}
                      onChangeText={(val) => updateSetField(idx, 'weight', val)}
                    />
                  </View>

                  <View style={localStyles.setInputWrapper}>
                    <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                      Reps
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        !isDarkMode && styles.inputLight,
                        {
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#333' : '#ddd',
                          backgroundColor: isDarkMode ? '#111' : '#fff',
                          borderRadius: 6,
                          padding: 10,
                        },
                      ]}
                      placeholder="e.g. 8"
                      placeholderTextColor={isDarkMode ? '#666' : '#999'}
                      keyboardType="numeric"
                      maxLength={3}
                      value={s.reps}
                      onChangeText={(val) => updateSetField(idx, 'reps', val)}
                    />
                  </View>

                  {currentSets.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeSetRow(idx)}
                      style={localStyles.removeSetBtn}
                    >
                      <Ionicons
                        name="remove-circle-outline"
                        size={26}
                        color={isDarkMode ? '#e74c3c' : '#c0392b'}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* “+ Add Another Set” Button */}
              <TouchableOpacity onPress={addEmptySetRow} style={localStyles.addSetRow}>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={isDarkMode ? '#1abc9c' : '#007b5e'}
                />
                <Text
                  style={[
                    localStyles.addSetText,
                    { color: isDarkMode ? '#1abc9c' : '#007b5e' },
                  ]}
                >
                  Add Set
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes (optional) */}
            <View style={[styles.inputGroup, { marginBottom: 20 }]}>
              <Text style={[styles.inputLabel, !isDarkMode && styles.inputLabelLight]}>
                Notes (optional)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !isDarkMode && styles.inputLight,
                  {
                    height: 80,
                    textAlignVertical: 'top',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#333' : '#ddd',
                    backgroundColor: isDarkMode ? '#111' : '#fff',
                    borderRadius: 6,
                    padding: 10,
                  },
                ]}
                placeholder="Any form cues? How’d it feel?"
                placeholderTextColor={isDarkMode ? '#666' : '#999'}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            {/* Add to Current Workout Button */}
            <TouchableOpacity
              style={[styles.calculateBtn, localStyles.addButton]}
              onPress={handleAddToPending}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={[styles.calculateBtnText, { color: '#fff' }]}>
                Add to Workout
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Pending Workout List ─────────────────────────────────────────────────── */}
        {pendingWorkout.length > 0 && (
          <View
            style={[localStyles.cardContainer, !isDarkMode && localStyles.cardContainerLight]}
          >
            <Text
              style={[
                localStyles.cardTitleSmall,
                !isDarkMode && localStyles.cardTitleSmallLight,
              ]}
            >
              Pending Workout: "{pendingWorkout[0].sessionName}" (
              {pendingWorkout.length} set
              {pendingWorkout.length > 1 ? 's' : ''})
            </Text>

            {pendingWorkout.map((item) => (
              <View
                key={item.id}
                style={[
                  localStyles.pendingCard,
                  !isDarkMode && localStyles.pendingCardLight,
                ]}
              >
                <View>
                  <Text
                    style={[styles.statLabel, !isDarkMode && styles.statLabelLight]}
                  >
                    {item.exercise} — 1×{item.reps} @ {item.weight} lbs
                  </Text>
                  <Text
                    style={[
                      styles.statValue,
                      { fontSize: 14, marginTop: 6 },
                      !isDarkMode && styles.statValueLight,
                      { color: isDarkMode ? '#1abc9c' : '#007b5e' },
                    ]}
                  >
                    1RM: {item.rep_max} lbs
                  </Text>
                  {item.notes ? (
                    <Text
                      style={[
                        styles.tooltipText,
                        !isDarkMode && styles.tooltipTextLight,
                        { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
                      ]}
                    >
                      “{item.notes}”
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ─── Save Entire Workout Button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.calculateBtn,
            {
              backgroundColor: pendingWorkout.length ? '#1abc9c' : '#555',
              borderRadius: 8,
              paddingVertical: 12,
              marginTop: 10,
              marginBottom: 30,
              marginHorizontal: 20,
              flexDirection: 'row',
              justifyContent: 'center',
            },
          ]}
          onPress={handleSaveWorkout}
          disabled={pendingWorkout.length === 0}
        >
          <Ionicons name="save-outline" size={20} color="#fff" />
          <Text style={[styles.calculateBtnText, { color: '#fff' }]}>
            Save Workout
          </Text>
        </TouchableOpacity>

        {/* ─── Past Workouts by Date ─────────────────────────────────────────────────── */}
        <Text
          style={[
            styles.sectionTitle,
            { marginBottom: 12, textAlign: 'center', fontSize: 18 },
            !isDarkMode && styles.sectionTitleLight,
          ]}
        >
          Past Workouts by Date
        </Text>

        {renderDateTiles()}
      </ScrollView>

      {/* ─── “+250 EXP” Pop-Up ───────────────────────────────────────────────────────── */}
      {showExpPopup && (
        <Animated.View
          style={[
            localStyles.expPopupContainer,
            {
              opacity: expFade,
              backgroundColor: isDarkMode
                ? 'rgba(0,0,0,0.8)'
                : 'rgba(255,255,255,0.9)',
            },
          ]}
        >
          <View
            style={[
              localStyles.expPopupCard,
              { backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' },
            ]}
          >
            <Ionicons
              name="trophy-outline"
              size={48}
              color={isDarkMode ? '#f1c40f' : '#e67e22'}
            />
            <Text
              style={[
                localStyles.expPopupText,
                !isDarkMode && { color: '#1a1a1a' },
              ]}
            >
              +250 EXP Earned!
            </Text>
            <TouchableOpacity
              onPress={() => {
                Animated.timing(expFade, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(() => setShowExpPopup(false));
              }}
              style={[
                localStyles.expPopupButton,
                { backgroundColor: isDarkMode ? '#1abc9c' : '#007b5e' },
              ]}
            >
              <Text style={localStyles.expPopupButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* If a date is selected for “Past Workouts,” show details on top */}
      {selectedDate && renderDetailsForDate()}
    </GestureHandlerRootView>
  );
};

export default StrengthTraining;

// ─── Local Styles ────────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  // Card containers
  cardContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContainerLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  cardTitleLight: {
    color: '#1a1a1a',
  },
  cardTitleSmall: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'left',
  },
  cardTitleSmallLight: {
    color: '#1a1a1a',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setInputWrapper: {
    flex: 1,
    marginRight: 8,
  },
  removeSetBtn: {
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  addSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addSetText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1abc9c',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  calcButton: {
    backgroundColor: '#1abc9c',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultContainer: {
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
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

  // Date tiles
  dateCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginHorizontal: 10,
  },
  dateCardLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  dateInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
  },
  dateTextLight: {
    color: '#1a1a1a',
  },
  setCountText: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600',
  },
  setCountTextLight: {
    color: '#555',
  },

  // Overlay for details
  overlayContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    zIndex: 10,
  },
  detailCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  detailCardLight: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    shadowOpacity: 0.1,
  },
  detailInfo: {
    flexDirection: 'column',
  },

  // Pending cards
  pendingCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  pendingCardLight: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    shadowOpacity: 0.1,
  },

  // Collapsible headers
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginHorizontal: 10,
  },
  dropdownHeaderLight: {
    borderColor: '#ddd',
  },
  dropdownHeaderText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownHeaderTextLight: {
    color: '#1a1a1a',
  },

  // Session header in details
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#222',
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionHeaderLight: {
    backgroundColor: '#f0f0f0',
  },
  sessionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionTitleLight: {
    color: '#1a1a1a',
  },
  sessionCalories: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionCaloriesLight: {
    color: '#007b5e',
  },

  // Swipeable “Delete”
  swipeDelete: {
    backgroundColor: '#e74c3c',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 10,
    marginVertical: 6,
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },

  // Flash banner at top
  flashBanner: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    paddingHorizontal: 20,
  },
  flashContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  flashText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // “+250 EXP” Pop-Up
  expPopupContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  expPopupCard: {
    width: '100%',
    backgroundColor: '#1f1f1f',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  expPopupText: {
    color: '#f1c40f',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 20,
  },
  expPopupButton: {
    backgroundColor: '#1abc9c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  expPopupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
