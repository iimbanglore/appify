import React, { useState, useRef, useCallback } from 'react';
import { StatusBar, StyleSheet, SafeAreaView, RefreshControl, ScrollView, View, Text, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const navItems = [{"id":"1","label":"Home","url":"/","icon":"home"},{"id":"1768593298211","label":"Profile","url":"https://account.tinkklebox.com/?locale=en&region_country=IN","icon":"user"},{"id":"1768593299990","label":"Collection","url":"/collections","icon":"heart"},{"id":"1768593379346","label":"Cart","url":"/cart","icon":"cart"}];

function WebViewScreen({ url }) {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={['#007AFF']}
            progressBackgroundColor="#1a1a1a"
          />
        }
      >
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          pullToRefreshEnabled={true}
          nestedScrollEnabled={true}
        />
      </ScrollView>
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
          return <Ionicons name={item?.icon || 'home'} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#333' },
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      {navItems.map((item, index) => (
        <Tab.Screen 
          key={index}
          name={item.label} 
          children={() => <WebViewScreen url={"https://tinkklebox.com/" + item.url} />}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    height: '100%',
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
});