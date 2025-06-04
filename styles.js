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
    backgroundColor: '#0f0f0f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 25,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
    zIndex: 1000,
  },
  navbarLight: {
    backgroundColor: '#ffffff',
    borderTopColor: '#ddd',
    shadowOpacity: 0.1,
    shadowColor: '#aaa',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 3,
  },
  navItemActive: {
    backgroundColor: 'rgba(26,188,156,0.12)',
  },
  navMainBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1abc9c',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    elevation: 12,
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    transform: [{ scale: 1 }],
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navIcon: {
    width: 22,
    height: 22,
    tintColor: '#777',
  },
  navIconActive: {
    tintColor: '#1abc9c',
  },
  navLabel: {
    fontSize: 10,
    color: '#777',
    marginTop: 3,
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1abc9c',
    fontWeight: '600',
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
    height: ((width - 45) / 3) * 0.75,
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
  liveBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    paddingVertical: 75,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 30,
    backgroundColor: '#111',
    borderRadius: 20,
    marginTop: 25,
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
  rankInfo: {
    color: '#bbb',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  rankInfoLight: {
    color: '#555',
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
  },

  // ===== OUTER CONTAINER =====
  outer: {
    flex: 1,
    backgroundColor: '#0a0f0d',
  },
  centerer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: height,
  },

 
  // ===== CALORIE TRACKER STYLES =====

  // Main Container
  calorieContainer: {
    flex: 1,
    backgroundColor: '#000',            // dark background
    paddingBottom: 110,                 // account for navbar
  },
  calorieContainerLight: {
    backgroundColor: '#f8f9fa',
  },

  // ─── STREAK COUNTER ───
  streakBadge: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#1abc9c',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1abc9c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  streakText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },

  // ─── GOAL SETTING SECTION ───
  goalSection: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginTop: 0,       // account for streak badge
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  goalSectionLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  goalTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 5,
    textAlign: 'center',
  },
  goalTitleLight: {
    color: '#1a1a1a',
  },

  goalTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  goalTypeBtn: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 14,
    paddingVertical: 0,
    marginHorizontal: 6,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
  },
  goalTypeBtnLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
  },
  goalTypeBtnActive: {
    borderColor: '#1abc9c',
    backgroundColor: 'rgba(26, 188, 156, 0.12)',
  },
  goalTypeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  goalTypeTextLight: {
    color: '#1a1a1a',
  },
  goalTypeTextActive: {
    color: '#1abc9c',
  },
  goalDescription: {
    color: '#bbb',
    fontSize: 12,
    marginTop: 0,
    textAlign: 'center',
  },
  goalDescriptionLight: {
    color: '#6c757d',
  },

  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 12,
  },
  weightInputLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  setGoalBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  setGoalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── CALORIES OVERVIEW ───
  calorieOverview: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  calorieOverviewLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  calorieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  calorieLabelLight: {
    color: '#1a1a1a',
  },
  calorieSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  calorieSubtextLight: {
    color: '#6c757d',
  },
  // Instead of the old ring, we’ll just show a horizontal bar with percentage text
  progressBarContainer: {
    marginTop: 10,
    height: 24,
    backgroundColor: '#333',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 24,
  },
  progressPercentageLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  progressPercentageLabelLight: {
    color: '#1a1a1a',
  },

  // ─── MACROS SECTION ───
  macroSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: '#222',
    borderRadius: 14,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#333',
  },
  macroItemLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
  },
  macroName: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 6,
  },
  macroNameLight: {
    color: '#6c757d',
  },
  macroValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  macroValueLight: {
    color: '#1a1a1a',
  },
  macroGoal: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  macroGoalLight: {
    color: '#8c8c8c',
  },

  // ─── FOOD LOGGING SECTION ───
  foodSection: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  foodSectionLight: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  foodSectionTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 18,
  },
  foodSectionTitleLight: {
    color: '#1a1a1a',
  },

  // ─── FOOD SEARCH ───
  foodSearchContainer: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  foodSearchInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 10,
  },
  foodSearchInputLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  searchBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 14,
    paddingHorizontal: 22,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  // ─── FOOD RESULTS ───
  foodResults: {
    maxHeight: 200,
    marginBottom: 18,
  },
  foodResultItem: {
    backgroundColor: '#222',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodResultItemLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
  },
  foodResultInfo: {
    flex: 1,
  },
  foodResultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  foodResultNameLight: {
    color: '#1a1a1a',
  },
  foodResultDetails: {
    color: '#aaa',
    fontSize: 14,
  },
  foodResultDetailsLight: {
    color: '#6c757d',
  },
  addFoodBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addFoodBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── LOGGED FOODS ───
  loggedFoodsSection: {
    marginTop: 20,
  },
  loggedFoodItem: {
    backgroundColor: '#222',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loggedFoodItemLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
  },
  loggedFoodInfo: {
    flex: 1,
  },
  loggedFoodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  loggedFoodNameLight: {
    color: '#1a1a1a',
  },
  loggedFoodMacros: {
    color: '#aaa',
    fontSize: 14,
  },
  loggedFoodMacrosLight: {
    color: '#6c757d',
  },
  loggedFoodCalories: {
    color: '#1abc9c',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 12,
  },
  removeFoodBtn: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderWidth: 1,
    borderColor: '#e74c3c',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  // ─── COMPLETE DAY SECTION ───
  completeDaySection: {
    backgroundColor: '#111',
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  completeDayBtn: {
    backgroundColor: '#1abc9c',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completeDayBtnDisabled: {
    backgroundColor: '#333',
  },
  completeDayBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 10,
  },
  completeDayBtnTextDisabled: {
    color: '#666',
  },

  // ─── QUANTITY MODAL (REMAINING STYLES) ───
  quantityModal: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 25,
    width: width * 0.8,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  quantityModalLight: {
    backgroundColor: '#fff',
  },
  quantityTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  quantityTitleLight: {
    color: '#1a1a1a',
  },
  quantityInput: {
    backgroundColor: '#222',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  quantityInputLight: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e0e0e0',
    color: '#1a1a1a',
  },
  quantityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  quantityBtnPrimary: {
    backgroundColor: '#1abc9c',
  },
  quantityBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ─── LOADING STATES ───
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#999',
    fontSize: 16,
    marginTop: 10,
  },
  loadingTextLight: {
    color: '#6c757d',
  },

  // ─── EMPTY STATES ───
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  emptyStateTextLight: {
    color: '#6c757d',
  },

  // ─── EDIT GOALS BUTTON (PLACEHOLDER) ───
  editGoalsBtn: {
    backgroundColor: '#444',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 15,
  },
  editGoalsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  editGoalsBtnLight: {
    backgroundColor: '#ddd',
  },
  editGoalsBtnTextLight: {
    color: '#1a1a1a',
  },

  // ─── ANIMATION HELPERS ───
  slideInFromRight: {
    transform: [{ translateX: width }],
  },
  slideInFromLeft: {
    transform: [{ translateX: -width }],
  },
  fadeIn: {
    opacity: 0,
  },
  scaleIn: {
    transform: [{ scale: 0.8 }],
    opacity: 0,
  },
  inputGroup: {
  marginTop: 12,
},
inputLabel: {
  color: '#ccc',
  fontSize: 14,
  marginBottom: 6,
},
inputLabelLight: {
  color: '#6c757d',
},
input: {
  backgroundColor: '#222',
  borderRadius: 14,
  paddingVertical: 12,
  paddingHorizontal: 16,
  fontSize: 16,
  color: '#fff',
  borderWidth: 1,
  borderColor: '#333',
},
inputLight: {
  backgroundColor: '#f8f9fa',
  borderColor: '#e0e0e0',
  color: '#1a1a1a',
},
genderButtons: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginTop: 6,
},
genderBtn: {
  flex: 1,
  backgroundColor: '#222',
  borderRadius: 12,
  paddingVertical: 12,
  marginHorizontal: 6,
  borderWidth: 1,
  borderColor: '#333',
  alignItems: 'center',
},
genderBtnLight: {
  backgroundColor: '#f8f9fa',
  borderColor: '#e0e0e0',
},
genderBtnActive: {
  backgroundColor: 'rgba(26,188,156,0.12)',
  borderColor: '#1abc9c',
},
genderText: {
  color: '#fff',
  fontSize: 14,
  fontWeight: '600',
},
genderTextLight: {
  color: '#1a1a1a',
},
  genderTextActive: {
    color: '#1abc9c',
  },

  // === VIDEO TABS ===
  videoTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  videoTabsLight: {
    backgroundColor: '#e9ecef',
  },
  videoTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 2,
  },
  videoTabBtnActive: {
    backgroundColor: '#1abc9c',
  },
  videoTabText: {
    color: '#bbb',
    fontSize: 15,
    fontWeight: '600',
  },
  videoTabTextActive: {
    color: '#fff',
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  uploadText: {
    marginTop: 8,
    color: '#1abc9c',
    fontWeight: '600',
  },
  liveLocked: {
    alignItems: 'center',
    marginTop: 40,
  },

});
