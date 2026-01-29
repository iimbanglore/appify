import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, ActivityIndicator, Platform, TouchableOpacity, Modal, BackHandler, Dimensions, PanResponder, Image, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

// Prevent auto-hiding of splash screen
SplashScreen.preventAutoHideAsync();

const BASE_DOMAIN = 'smartfin.ask2mesolution.com';
const SYNC_INTERVAL = 30000;
const PULL_THRESHOLD = 150;
const CACHE_KEY = 'OFFLINE_HTML_CACHE';
const SPLASH_DURATION = 4000; // Show splash for 4 seconds
const SPLASH_BG_COLOR = '#ffffff';
const LOADING_TIMEOUT = 15000; // Force hide loading after 15 seconds

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

function InAppBrowser({ visible, url, onClose }) {
  const [canGoBack, setCanGoBack] = useState(false);
  const [browserLoading, setBrowserLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(url);
  const browserRef = useRef(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible && canGoBack && browserRef.current) {
        browserRef.current.goBack();
        return true;
      }
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [visible, canGoBack, onClose]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.browserContainer}>
        <View style={styles.browserHeader}>
          <TouchableOpacity onPress={onClose} style={styles.browserButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.browserUrlContainer}>
            <Text style={styles.browserUrl} numberOfLines={1}>{currentUrl}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => canGoBack && browserRef.current?.goBack()} 
            style={[styles.browserButton, !canGoBack && styles.browserButtonDisabled]}
          >
            <Ionicons name="arrow-back" size={24} color={canGoBack ? "#fff" : "#666"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => browserRef.current?.reload()} style={styles.browserButton}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {browserLoading && (
          <View style={styles.browserLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
        <WebView
          ref={browserRef}
          source={{ uri: url }}
          style={styles.browserWebview}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
            setCurrentUrl(navState.url);
          }}
          onLoadStart={() => setBrowserLoading(true)}
          onLoadEnd={() => setBrowserLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={true}
          cacheMode="LOAD_CACHE_ELSE_NETWORK"
        />
      </View>
    </Modal>
  );
}

function MainContent() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [browserUrl, setBrowserUrl] = useState('');
  const [showBrowser, setShowBrowser] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedHtml, setCachedHtml] = useState(null);
  const webViewRef = useRef(null);
  const lastSyncRef = useRef(Date.now());
  const websiteUrl = 'https://smartfin.ask2mesolution.com/';

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
    AsyncStorage.getItem(CACHE_KEY + '_main').then(html => {
      if (html) setCachedHtml(html);
    });
  }, []);

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

  const handleRefresh = useCallback(() => {
    if (scrollY <= 0 && pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      if (webViewRef.current) {
        webViewRef.current.reload();
      }
      setTimeout(() => {
        setRefreshing(false);
        setPullDistance(0);
      }, 1500);
    }
  }, [scrollY, pullDistance]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return scrollY <= 0 && gestureState.dy > 10 && Math.abs(gestureState.dx) < 50;
      },
      onPanResponderMove: (_, gestureState) => {
        if (scrollY <= 0 && gestureState.dy > 0) {
          setPullDistance(Math.min(gestureState.dy, PULL_THRESHOLD + 50));
        }
      },
      onPanResponderRelease: () => {
        if (pullDistance >= PULL_THRESHOLD) {
          handleRefresh();
        } else {
          setPullDistance(0);
        }
      },
    })
  ).current;

  const handleNavigationRequest = (request) => {
    const requestUrl = request.url;
    try {
      const urlObj = new URL(requestUrl);
      const isExternal = !urlObj.hostname.includes(BASE_DOMAIN) && 
                         !requestUrl.startsWith('about:') && 
                         !requestUrl.startsWith('javascript:');
      if (isExternal) {
        setBrowserUrl(requestUrl);
        setShowBrowser(true);
        return false;
      }
    } catch (e) {}
    return true;
  };

  const injectedJS = `
    (function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: window.scrollY }));
      window.addEventListener('scroll', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'scroll', y: window.scrollY }));
      }, { passive: true });
    })();
    true;
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'scroll') {
        setScrollY(data.y);
      } else if (data.type === 'cache' && data.html) {
        AsyncStorage.setItem(CACHE_KEY + '_main', data.html);
        setCachedHtml(data.html);
      }
    } catch (e) {}
  };

  const getWebViewSource = () => {
    if (isOffline) {
      if (cachedHtml) {
        return { html: cachedHtml, baseUrl: websiteUrl };
      }
      return { html: OFFLINE_HTML };
    }
    return { uri: websiteUrl };
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {pullDistance > 0 && (
        <View style={[styles.pullIndicator, { height: pullDistance }]}>
          <ActivityIndicator 
            size="small" 
            color="#007AFF" 
            style={{ opacity: pullDistance / PULL_THRESHOLD }}
          />
          <Text style={[styles.pullText, { opacity: pullDistance / PULL_THRESHOLD }]}>
            {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull down to refresh'}
          </Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
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
        style={[styles.webview, { marginTop: pullDistance }]}
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

      <InAppBrowser 
        visible={showBrowser} 
        url={browserUrl} 
        onClose={() => setShowBrowser(false)} 
      />
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashFinish = useCallback(() => {
    setShowSplash(false);
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      <MainContent />
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
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  pullIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pullText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
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
});