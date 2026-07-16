import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StatusBar, StyleSheet, View, Text, Platform, ActivityIndicator, TouchableOpacity, Dimensions, Animated, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';

SplashScreen.preventAutoHideAsync();
const Nav = createBottomTabNavigator();
const navItems = [{"id":"1","label":"Home","url":"https://fin.uben.in/","icon":"home","isExternal":true},{"id":"1784202860378","label":"Terminal","url":"https://fin.uben.in/terminal","icon":"menu","isExternal":true},{"id":"1784202961280","label":"Account","url":"https://fin.uben.in/auth","icon":"user","isExternal":true}];
const BASE_DOMAIN = 'fin.uben.in';
const SPLASH_BG = '#ffffff';
const NAV_BG = '#1a1a1a';
const NAV_ACTIVE = '#007AFF';
const NAV_INACTIVE = '#8E8E93';

const iconMap = { home:'home', user:'person', settings:'settings', info:'information-circle', menu:'menu', cart:'cart', search:'search', notifications:'notifications', heart:'heart', mail:'mail', calendar:'calendar', camera:'camera', music:'musical-notes', video:'videocam', map:'map', phone:'call', star:'star', bookmark:'bookmark', share:'share-social', download:'download', upload:'cloud-upload' };
const getIcon = (n) => iconMap[n] || 'home';
async function openBrowser(url) { try { if (await InAppBrowser.isAvailable()) await InAppBrowser.open(url, { toolbarColor: NAV_BG, showTitle: true }); else Linking.openURL(url); } catch { Linking.openURL(url); } }

function Splash({ onFinish }) {
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => { const t = setTimeout(() => { Animated.timing(fade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => { SplashScreen.hideAsync(); onFinish(); }); }, 3000); return () => clearTimeout(t); }, []);
  return <Animated.View style={[{ flex:1, backgroundColor: SPLASH_BG, justifyContent:'center', alignItems:'center', position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:9999 }, { opacity: fade }]}><Text style={{ fontSize:28, fontWeight:'bold', color: SPLASH_BG === '#ffffff' ? '#000' : '#fff' }}>FinityAI</Text></Animated.View>;
}
function WebViewScreen({ url }) {
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const u = NetInfo.addEventListener(s => { setOffline(!s.isConnected); if (s.isConnected && ref.current) ref.current.reload(); }); return () => u(); }, []);
  useEffect(() => { if (loading) { const t = setTimeout(() => setLoading(false), 15000); return () => clearTimeout(t); } }, [loading]);
  const onNav = (r) => { try { const u = new URL(r.url); if (!u.hostname.includes(BASE_DOMAIN) && !r.url.startsWith('about:') && !r.url.startsWith('javascript:')) { openBrowser(r.url); return false; } } catch {} return true; };
  const onMsg = (e) => { try { const d = JSON.parse(e.nativeEvent.data); if (d.type === 'external_link' && d.url) openBrowser(d.url); } catch {} };
  const js = `(function(){document.addEventListener('click',function(e){var t=e.target;while(t&&t.tagName!=='A')t=t.parentElement;if(t&&t.tagName==='A'){var h=t.getAttribute('href');if(h&&!h.startsWith('javascript:')&&!h.startsWith('#')){try{var f=new URL(h,location.origin).href;if(!new URL(f).hostname.includes('fin.uben.in')){e.preventDefault();window.ReactNativeWebView.postMessage(JSON.stringify({type:'external_link',url:f}))}}catch{}}}},true)})();true;`;
  return <View style={s.c}><StatusBar barStyle="light-content" translucent backgroundColor="transparent"/>{loading && <View style={s.lo}><ActivityIndicator size="large" color={NAV_ACTIVE}/></View>}{offline && <View style={s.off}><Text style={s.offT}>Offline</Text></View>}<WebView ref={ref} source={offline ? {html:'<h1>Offline</h1>'} : {uri:url}} style={s.wv} javaScriptEnabled domStorageEnabled onLoadStart={()=>setLoading(true)} onLoadEnd={()=>setLoading(false)} onShouldStartLoadWithRequest={onNav} onMessage={onMsg} injectedJavaScript={js}/></View>;
}function ExtScreen({ url, label }) { useEffect(() => { openBrowser(url); }, []); return <View style={[s.c, {justifyContent:'center',alignItems:'center'}]}><Ionicons name="globe-outline" size={48} color={NAV_ACTIVE}/><Text style={{color:'#fff',marginTop:12}}>{label}</Text><TouchableOpacity style={{marginTop:16,backgroundColor:NAV_ACTIVE,padding:12,borderRadius:8}} onPress={()=>openBrowser(url)}><Text style={{color:'#fff'}}>Open</Text></TouchableOpacity></View>; }
function AppNav() { return <Nav.Navigator screenOptions={({route})=>({headerShown:false,tabBarIcon:({color,size})=>{const it=navItems.find(n=>n.label===route.name);return <Ionicons name={getIcon(it?.icon)} size={size} color={color}/>},tabBarActiveTintColor:NAV_ACTIVE,tabBarInactiveTintColor:NAV_INACTIVE,tabBarStyle:{backgroundColor:NAV_BG}})}>{navItems.map((it,i)=><Nav.Screen key={i} name={it.label} children={()=>it.isExternal?<ExtScreen url={it.url} label={it.label}/>:<WebViewScreen url={"https://fin.uben.in/terminal"+it.url}/>}/>)}</Nav.Navigator>; }
export default function App() { const [sp, setSp] = useState(true); return <View style={{flex:1}}><NavigationContainer><AppNav/></NavigationContainer>{sp && <Splash onFinish={()=>setSp(false)}/>}</View>; }

const s = StyleSheet.create({
  c: { flex:1, backgroundColor:'#000' },
  wv: { flex:1, marginTop: Platform.OS==='android'? StatusBar.currentHeight:0 },
  lo: { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', alignItems:'center', zIndex:999 },
  off: { backgroundColor:'#f66', padding:8, alignItems:'center' },
  offT: { color:'#fff', fontSize:12 },
});