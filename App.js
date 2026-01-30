import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StatusBar, StyleSheet, SafeAreaView, View, Text, ActivityIndicator, Platform, TouchableOpacity, Dimensions, Image, Animated, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();
const navItems = ${navItemsJson};
const BASE_DOMAIN = 'smartfin.ask2mesolution.com';
const SYNC_INTERVAL = 30000;
const PULL_THRESHOLD = 150;
const CACHE_KEY = 'OFFLINE_HTML_CACHE';
const SPLASH_DURATION = 4000; // Show splash for 4 seconds
const SPLASH_BG_COLOR = '#ffffff';
const LOADING_TIMEOUT = 15000; // Force hide loading after 15 seconds

// Chromium In-App Browser Configuration
const BROWSER_CONFIG = {
  // Android Chrome Custom Tabs settings - uses Chromium engine
  showTitle: true,
  toolbarColor: '#1a1a1a',
  secondaryToolbarColor: '#1a1a1a',
  navigationBarColor: '#1a1a1a',
  navigationBarDividerColor: '#333333',
  enableUrlBarHiding: true,
  enableDefaultShare: true,
  forceCloseOnRedirection: false,
  showInRecents: true,
  hasBackButton: true,
  // iOS Safari View Controller settings
  dismissButtonStyle: 'close',
  preferredBarTintColor: '#1a1a1a',
  preferredControlTintColor: '#ffffff',
  readerMode: false,
  animated: true,
  modalPresentationStyle: 'automatic',
  modalTransitionStyle: 'coverVertical',
  modalEnabled: true,
  enableBarCollapsing: true,
};

// Helper function to open URL in Chromium-based in-app browser
async function openInAppBrowser(url) {
  try {
    if (await InAppBrowser.isAvailable()) {
      const result = await InAppBrowser.open(url, BROWSER_CONFIG);
      console.log('Browser closed with result:', result.type);
    } else {
      // Fallback to system browser if in-app browser not available
      Linking.openURL(url);
    }
  } catch (error) {
    console.error('Error opening in-app browser:', error);
    Linking.openURL(url);
  }
}

// Icon mapping from Lucide to Ionicons
const iconMap = {
  'home': 'home',
  'user': 'person',
  'settings': 'settings',
  'info': 'information-circle',
  'menu': 'menu',
  'cart': 'cart',
  'search': 'search',
  'notifications': 'notifications',
  'heart': 'heart',
  'mail': 'mail',
  'calendar': 'calendar',
  'camera': 'camera',
  'music': 'musical-notes',
  'video': 'videocam',
  'map': 'map',
  'phone': 'call',
  'star': 'star',
  'bookmark': 'bookmark',
  'share': 'share-social',
  'download': 'download',
  'upload': 'cloud-upload',
};

const getIonIconName = (lucideIcon) => {
  return iconMap[lucideIcon] || iconMap['home'] || 'home';
};


// Custom Splash Screen Component
function CustomSplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        SplashScreen.hideAsync();
        onFinish();
      });
    }, SPLASH_DURATION);
    
    return () => clearTimeout(timer);
  }, [fadeAnim, onFinish]);
  
  return (
    <Animated.View style={[splashStyles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor={SPLASH_BG_COLOR} />
      <Image 
        source={require('./assets/splash.png')} 
        style={splashStyles.image}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
});

// Offline fallback page HTML
const OFFLINE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      font-size: 80px;
      margin-bottom: 24px;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(90deg, #fff, #a8d8ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      font-size: 16px;
      color: #b0b8c8;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .retry-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 16px 48px;
      border-radius: 50px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.4);
    }
    .status {
      margin-top: 32px;
      padding: 12px 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      font-size: 14px;
      color: #8892a6;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Please check your network settings and try again.</p>
    <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
    <div class="status">Waiting for connection...</div>
  </div>
</body>
</html>
`;

// Legacy InAppBrowser component - kept for fallback, but primary is Chromium browser
function InAppBrowserFallback({ visible, url, onClose }) {
  // This is a fallback component - the main functionality now uses react-native-inappbrowser-reborn
  // which provides Chrome Custom Tabs on Android and SFSafariViewController on iOS
  if (!visible) return null;
  
  // Use Chromium-based browser immediately
  useEffect(() => {
    if (visible && url) {
      openInAppBrowser(url).then(() => {
        onClose();
      });
    }
  }, [visible, url, onClose]);
  
  return null;
}

function WebViewScreen({ url }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshButton, setShowRefreshButton] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedHtml, setCachedHtml] = useState(null);
  const webViewRef = useRef(null);
  const lastSyncRef = useRef(Date.now());

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);
      if (!offline && webViewRef.current) {
        webViewRef.current.reload();
      }
    });
    return () => unsubscribe();
  }, []);

  // Load cached HTML on mount
  useEffect(() => {
    AsyncStorage.getItem(CACHE_KEY + '_' + url).then(html => {
      if (html) setCachedHtml(html);
    });
  }, [url]);

  // Loading timeout - force hide loading overlay after timeout
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, LOADING_TIMEOUT);
      return () => clearTimeout(timeout);
    }
  }, [loading]);

  // Cache HTML content for offline use
  const cachePageContent = useCallback(() => {
    if (webViewRef.current && !isOffline) {
      webViewRef.current.injectJavaScript(`
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
          type: 'cache', 
          html: document.documentElement.outerHTML 
        }));
        true;
      `);
    }
  }, [isOffline]);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (webViewRef.current && !loading && !isOffline && Date.now() - lastSyncRef.current >= SYNC_INTERVAL) {
        webViewRef.current.injectJavaScript(`
          if (typeof window.__realTimeSync === 'function') {
            window.__realTimeSync();
          } else {
            if (document.hidden === false) {
              fetch(window.location.href, { cache: 'reload' })
                .then(r => r.text())
                .then(html => {
                  const parser = new DOMParser();
                  const newDoc = parser.parseFromString(html, 'text/html');
                  const newBody = newDoc.body.innerHTML;
                  if (document.body.innerHTML !== newBody) {
                    document.body.innerHTML = newBody;
                  }
                })
                .catch(() => {});
            }
          }
          true;
        `);
        lastSyncRef.current = Date.now();
        cachePageContent();
      }
    }, SYNC_INTERVAL);
    return () => clearInterval(syncInterval);
  }, [loading, isOffline, cachePageContent]);

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Show refresh button when scrolled to top
  const handleScrollChange = useCallback((scrollY) => {
    setShowRefreshButton(scrollY <= 50);
  }, []);

  const handleNavigationRequest = (request) => {
    const requestUrl = request.url;
    try {
      const urlObj = new URL(requestUrl);
      const isExternal = !urlObj.hostname.includes(BASE_DOMAIN) && 
                         !requestUrl.startsWith('about:') && 
                         !requestUrl.startsWith('javascript:');
      if (isExternal) {
        // Open external links in Chromium-based in-app browser
        openInAppBrowser(requestUrl);
        return false;
      }
    } catch (e) {}
    return true;
  };

  const injectedJS = `
    (function() {
      // Scroll tracking
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: window.scrollY }));
      window.addEventListener('scroll', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: window.scrollY }));
      }, { passive: true });
      
      // Intercept all link clicks for in-app browser
      document.addEventListener('click', function(e) {
        var target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        if (target && target.tagName === 'A') {
          var href = target.getAttribute('href');
          if (href && !href.startsWith('javascript:') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
              var fullUrl = new URL(href, window.location.origin).href;
              var baseDomain = 'smartfin.ask2mesolution.com';
              var linkHostname = new URL(fullUrl).hostname;
              if (!linkHostname.includes(baseDomain)) {
                e.preventDefault();
                e.stopPropagation();
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'external_link', url: fullUrl }));
              }
            } catch (err) {}
          }
        }
      }, true);
      
      // Also intercept window.open calls
      var originalOpen = window.open;
      window.open = function(url, target, features) {
        if (url) {
          try {
            var fullUrl = new URL(url, window.location.origin).href;
            var baseDomain = 'smartfin.ask2mesolution.com';
            var linkHostname = new URL(fullUrl).hostname;
            if (!linkHostname.includes(baseDomain)) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'external_link', url: fullUrl }));
              return null;
            }
          } catch (err) {}
        }
        return originalOpen.call(window, url, target, features);
      };
    })();
    true;
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scroll') {
        handleScrollChange(data.y);
      } else if (data.type === 'cache' && data.html) {
        AsyncStorage.setItem(CACHE_KEY + '_' + url, data.html);
        setCachedHtml(data.html);
      } else if (data.type === 'external_link' && data.url) {
        // Open external links in Chromium-based in-app browser
        openInAppBrowser(data.url);
      }
    } catch (e) {}
  };

  const getWebViewSource = () => {
    if (isOffline) {
      if (cachedHtml) {
        return { html: cachedHtml, baseUrl: url };
      }
      return { html: OFFLINE_HTML };
    }
    return { uri: url };
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {isOffline && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>{cachedHtml ? 'Offline - Showing cached version' : 'No internet connection'}</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={getWebViewSource()}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => {
          setLoading(false);
          cachePageContent();
        }}
        onShouldStartLoadWithRequest={handleNavigationRequest}
        onMessage={handleMessage}
        injectedJavaScript={injectedJS}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={false}
        onError={() => setIsOffline(true)}
        onHttpError={() => setIsOffline(true)}
      />

      {/* Floating Refresh Button */}
      {showRefreshButton && !loading && (
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleManualRefresh}
          activeOpacity={0.8}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={22} color="#fff" />
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// External Link Screen - opens external URL in Chromium-based in-app browser
function ExternalLinkScreen({ url, label }) {
  // Open in Chromium browser when component mounts or when button is pressed
  const handleOpenBrowser = useCallback(() => {
    openInAppBrowser(url);
  }, [url]);
  
  // Auto-open on mount
  useEffect(() => {
    handleOpenBrowser();
  }, [handleOpenBrowser]);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.externalPlaceholder}>
        <Ionicons name="globe-outline" size={48} color="#ffffff" />
        <Text style={styles.externalText}>{label}</Text>
        <TouchableOpacity 
          style={styles.openExternalButton}
          onPress={handleOpenBrowser}
        >
          <Text style={styles.openExternalButtonText}>Open Link</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const item = navItems.find(n => n.label === route.name);
          return <Ionicons name={getIonIconName(item?.icon)} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      {navItems.map((item, index) => (
        <Tab.Screen 
          key={index}
          name={item.label} 
          children={() => item.isExternal 
            ? <ExternalLinkScreen url={item.url} label={item.label} />
            : <WebViewScreen url={"https://smartfin.ask2mesolution.com/" + item.url} />
          }
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      {showSplash && <CustomSplashScreen onFinish={handleSplashFinish} />}
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  refreshButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 100,
  },
  browserContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  browserButton: {
    padding: 8,
  },
  browserButtonDisabled: {
    opacity: 0.5,
  },
  browserUrlContainer: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  browserUrl: {
    color: '#aaa',
    fontSize: 13,
  },
  browserLoading: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  browserWebview: {
    flex: 1,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  externalPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    gap: 16,
  },
  externalText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  openExternalButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  openExternalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});