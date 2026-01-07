import React from 'react';
import { StatusBar, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { NavigationContainer } from '@react-navigation/native';


import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

const navItems = [{"id":"1","label":"Home","url":"/home","icon":"home"}];

function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const item = navItems.find(n => n.label === route.name);
          return <Ionicons name={item?.icon || 'home'} size={size} color={color} />;
        },
      })}
    >
      {navItems.map((item, index) => (
        <Tab.Screen 
          key={index}
          name={item.label} 
          children={() => <WebViewScreen url={"https://play.uben.in/" + item.url} />}
        />
      ))}
    </Tab.Navigator>
  );
}

function WebViewScreen({ url = 'https://play.uben.in/' }) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
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
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});