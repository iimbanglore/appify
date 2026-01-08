import React from 'react';
import { StatusBar, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const navItems = [{"id":"1","label":"Home","url":"/","icon":"user"},{"id":"1767887849044","label":"Trend","url":"/channel/top-trend","icon":"menu"},{"id":"1767887897551","label":"Songtap","url":"https://songtap.uben.in/","icon":"home"}];

function WebViewScreen({ url }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={true}
      />
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
      })}
    >
      {navItems.map((item, index) => (
        <Tab.Screen 
          key={index}
          name={item.label} 
          children={() => <WebViewScreen url={"https://music.uben.in" + item.url} />}
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
  webview: {
    flex: 1,
  },
});