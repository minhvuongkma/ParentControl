import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AppLockBridge } from './src/services/AppLockBridge';
import { StorageService } from './src/services/StorageService';

enableScreens();

function App() {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initApp = async () => {
      try {
        // Start the background service on app launch
        AppLockBridge.startLockingService();

        // Sync initial state to native
        const isLocked = StorageService.getIsLocked();
        const whitelist = StorageService.getWhitelist();
        const timerEndTime = await AppLockBridge.getTimerEndTime();

        AppLockBridge.updateLockStatus(isLocked);
        AppLockBridge.updateWhitelist(whitelist);
        AppLockBridge.updateNotificationSetting(StorageService.getNotificationTimerEnabled());
        AppLockBridge.updateFloatingSetting(StorageService.getFloatingTimerEnabled());
        AppLockBridge.updateFloatingPosition(StorageService.getFloatingPosition());
        // timerEndTime is already on Native side if we use bridge, 
        // but let's ensure it's synced if it exists in MMKV (fallback)
        if (timerEndTime) {
          AppLockBridge.updateTimerEndTime(timerEndTime);
        }
      } catch (e: any) {
        console.error('Initialization error:', e);
        setHasError(true);
        setErrorMessage(e.message);
      }
    };

    initApp();
  }, []);

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>App Error</Text>
        <ScrollView style={styles.errorScroll}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </ScrollView>
        <TouchableOpacity style={styles.retryButton} onPress={() => setHasError(false)}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorScroll: {
    maxHeight: '60%',
    width: '100%',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
