import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  welcomeBanner: {
    position: 'absolute',
    top: 85,
    left: 20,
    right: 20,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    // Enhanced shadow for better depth
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    zIndex: 1000,
    
    // Add subtle border for premium feel
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    
    // Backdrop blur effect simulation
    backgroundColor: 'rgba(26, 188, 156, 0.95)',
  },

  welcomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 16,
    lineHeight: 22,
    letterSpacing: 0.3,
    textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },

  welcomeClose: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    
    // Add subtle inner shadow
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOpacity: 1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },

  welcomeCloseIcon: {
    color: '#fff',
    fontWeight: '600',
  },

  // Optional: Add a subtle animation container
  welcomeContainer: {
    overflow: 'hidden',
    borderRadius: 16,
  },

  // Optional: Add a shine effect overlay
  welcomeShine: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },

  // Alternative style for success/celebration version
  welcomeBannerSuccess: {
    position: 'absolute',
    top: 85,
    left: 20,
    right: 20,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    // Gradient-like effect with multiple shadows
    shadowColor: '#1abc9c',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 15,
    zIndex: 1000,
    
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(26, 188, 156, 0.98)',
    
    // Add a subtle glow effect
    overflow: 'visible',
  },

  // Enhanced text for success version
  welcomeTextSuccess: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    textAlign: 'left',
  },

  // Animated rocket icon container
  welcomeIconContainer: {
    marginRight: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Enhanced close button for success version
  welcomeCloseSuccess: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});