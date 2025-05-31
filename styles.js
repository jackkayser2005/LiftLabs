// gym-app/styles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export default StyleSheet.create({
  // === CONTAINER & BASE STYLES ===
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  containerLight: {
    backgroundColor: '#f8f9fa',
  },
  
  // === HEADER STYLES ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLight: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerTitleLight: {
    color: '#1a1a1a',
  },
  userBtn: {
    padding: 8,
    borderRadius: 20,
  },

  // === BACK BUTTON ===
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
  },
  backText: {
    color: '#1abc9c',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },

  // === NAVBAR STYLES ===
  navbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 85,
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 25,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navbarLight: {
    backgroundColor: '#fff',
    borderTopColor: '#e0e0e0',
    shadowOpacity: 0.05,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  navMainBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1abc9c',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    elevation: 8,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    transform: [{ scale: 1 }],
  },

  // === CONTENT STYLES ===
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 110, // Space for navbar
  },

  // === EMPTY STATE ===
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyTextLight: {
    color: '#1a1a1a',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptySubtextLight: {
    color: '#6c757d',
  },
  getStartedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#1abc9c',
  },
  getStartedText: {
    color: '#1abc9c',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // === TIP BANNER STYLES ===
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 5,
  },
  tipBannerLight: {
    backgroundColor: '#f8f9fa',
    borderBottomColor: '#e0e0e0',
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tipText: {
    color: '#999',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  tipTextLight: {
    color: '#6c757d',
  },

  // === VIDEO GRID STYLES ===
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  videoItem: {
    width: (width - 45) / 3,
    height: (width - 45) / 3 * 0.75,
    marginBottom: 15,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#222',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  videoItemLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreBadgeExcellent: {
    backgroundColor: '#27ae60',
  },
  scoreBadgeGood: {
    backgroundColor: '#f39c12',
  },
  scoreBadgeNeedsWork: {
    backgroundColor: '#e74c3c',
  },
  scoreText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // === VIDEO ANALYSIS MODAL ===
  analysisPanel: {
    backgroundColor: '#111',
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderTopWidth: 1,
    borderTopColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  analysisPanelLight: {
    backgroundColor: '#fff',
    borderTopColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  scoreTitleLight: {
    color: '#1a1a1a',
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    borderRadius: 40,
    width: 80,
    height: 80,
    borderWidth: 3,
    borderColor: '#1abc9c',
  },
  scoreLarge: {
    color: '#1abc9c',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreOutOf: {
    color: '#1abc9c',
    fontSize: 12,
    opacity: 0.8,
  },
  critiqueText: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 25,
    fontStyle: 'italic',
  },
  critiqueTextLight: {
    color: '#495057',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  replayBtn: {
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    borderWidth: 2,
    borderColor: '#1abc9c',
  },
  closeBtn: {
    backgroundColor: '#1abc9c',
  },
  actionBtnText: {
    color: '#1abc9c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionBtnTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // === TOOLTIP STYLES ===
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltipContainer: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 25,
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  tooltipContainerLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.2,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tooltipTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  tooltipTitleLight: {
    color: '#1a1a1a',
  },
  tooltipText: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  tooltipTextLight: {
    color: '#495057',
  },
  tooltipBold: {
    fontWeight: 'bold',
    color: '#1abc9c',
  },
  tooltipCloseBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tooltipCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // === SCREEN STYLES ===
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 110,
    paddingHorizontal: 40,
  },
  screenTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  screenTitleLight: {
    color: '#1a1a1a',
  },
  screenSubtitle: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  screenSubtitleLight: {
    color: '#6c757d',
  },

  // === PROFILE SCREEN STYLES ===
  profileContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 35,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 30,
    backgroundColor: '#111',
    borderRadius: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  profileHeaderLight: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  profileName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 15,
    textAlign: 'center',
  },
  profileNameLight: {
    color: '#1a1a1a',
  },
  profileEmail: {
    color: '#666',
    fontSize: 16,
    marginTop: 5,
    textAlign: 'center',
  },
  profileEmailLight: {
    color: '#6c757d',
  },

  // === SETTINGS SECTION ===
  settingsSection: {
    marginBottom: 30,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingItemLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.05,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  settingTextLight: {
    color: '#1a1a1a',
  },

  // === LEVEL SECTION ===
  levelSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  sectionTitleLight: {
    color: '#1a1a1a',
  },
  levelCard: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  levelCardLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    shadowOpacity: 0.1,
  },
  levelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  levelNumber: {
    color: '#1abc9c',
    fontSize: 28,
    fontWeight: 'bold',
    textShadowColor: 'rgba(26, 188, 156, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  rankText: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBarLight: {
    backgroundColor: '#e9ecef',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1abc9c',
    borderRadius: 5,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressTextLight: {
    color: '#6c757d',
  },

  // === STATS SECTION ===
  statsSection: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    backgroundColor: '#111',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statRowLight: {
    backgroundColor: '#fff',
    borderBottomColor: '#e0e0e0',
    shadowOpacity: 0.05,
  },
  statLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  statLabelLight: {
    color: '#1a1a1a',
  },
  statValue: {
    color: '#1abc9c',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(26, 188, 156, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // === LEGACY/CAMERA STYLES ===
  camera: {
    flex: 1,
  },
  controls: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  btn: {
    backgroundColor: '#1abc9c',
    padding: 20,
    borderRadius: 35,
    minWidth: 140,
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  playback: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingBottom: 50,
  },
  video: {
    marginVertical: 20,
    alignSelf: 'center',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  white: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
    fontWeight: '500',
  },

  // === BODY FAT CALCULATOR STYLES ===
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
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 3,
    borderWidth: 2,
    borderColor: '#333',
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
    backgroundColor: 'rgba(26, 188, 156, 0.1)',
    shadowColor: '#1abc9c',
    shadowOpacity: 0.3,
    elevation: 6,
  },
  methodText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  methodTextLight: {
    color: '#1a1a1a',
  },
  methodTextActive: {
    color: '#1abc9c',
  },
  accuracyText: {
    color: '#999',
    fontSize: 11,
    textAlign: 'center',
  },
  accuracyTextLight: {
    color: '#6c757d',
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
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: '#333',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  genderTextLight: {
    color: '#1a1a1a',
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
    backgroundColor: '#111',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unitTextLight: {
    color: '#1a1a1a',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputLabelLight: {
    color: '#1a1a1a',
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  infoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
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

  // Result Container
  resultContainer: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
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
  resultTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  resultTitleLight: {
    color: '#1a1a1a',
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
// Add these missing styles to your StyleSheet.create() object:

  // === RESULT STYLES (additional) ===
  resultCategory: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  resultAdvice: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  resultAdviceLight: {
    color: '#495057',
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f39c12',
    marginTop: 10,
  },
  disclaimerText: {
    color: '#f39c12',
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
    lineHeight: 16,
  },
  disclaimerTextLight: {
    color: '#856404',
  },

  // === MODAL STYLES ===
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#111',
    borderRadius: 20,
    maxHeight: '80%',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
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
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitleLight: {
    color: '#1a1a1a',
  },
  modalContent: {
    maxHeight: 400,
  },
  measurementGuide: {
    padding: 20,
  },
  guideTitle: {
    color: '#1abc9c',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 12,
  },
  guideTitleLight: {
    color: '#1abc9c',
  },
  guideItem: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  guideItemLight: {
    color: '#495057',
  },
  guideBold: {
    fontWeight: 'bold',
    color: '#1abc9c',
  },});