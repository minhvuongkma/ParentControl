import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  SafeAreaView
} from 'react-native';
import { AppLockBridge } from './src/services/AppLockBridge';
import { StorageService } from './src/services/StorageService';
import HomeScreen from './src/screens/HomeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Simple icons
const LockIcon = () => <Text style={{ fontSize: 24 }}>🔒</Text>;

type Screen = 'pinSetup' | 'home' | 'settings';

// Mock navigation object for screens
const createMockNavigation = (navigate: (screen: string) => void) => ({
  navigate,
  goBack: () => navigate('home'),
  setOptions: () => { },
  addListener: () => ({ remove: () => { } }),
});

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [hasPin, setHasPin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        AppLockBridge.startLockingService();
        const pin = await StorageService.getPIN();
        setHasPin(!!pin);

        // Synchronize PIN to native side if it exists
        if (pin) {
          await AppLockBridge.updatePIN(pin);
        } else {
          setCurrentScreen('pinSetup');
        }

        setIsLoading(false);
      } catch (e) {
        console.error('Init error:', e);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleNavigate = (screen: string) => {
    if (screen === 'Home') setCurrentScreen('home');
    else if (screen === 'Settings') setCurrentScreen('settings');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {currentScreen === 'pinSetup' && (
        <PinSetupScreen onComplete={() => {
          setHasPin(true);
          setCurrentScreen('home');
        }} />
      )}

      {currentScreen === 'home' && (
        <HomeScreen navigation={createMockNavigation(handleNavigate) as any} route={{} as any} />
      )}

      {currentScreen === 'settings' && (
        <SettingsScreen navigation={createMockNavigation(handleNavigate) as any} route={{} as any} />
      )}
    </SafeAreaView>
  );
}

// PIN Setup Screen
function PinSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleContinue = async () => {
    if (step === 'enter') {
      if (pin.length < 4) {
        Alert.alert('Error', 'PIN must be at least 4 digits');
        return;
      }
      setStep('confirm');
    } else {
      if (pin !== confirmPin) {
        Alert.alert('Error', 'PINs do not match');
        setConfirmPin('');
        return;
      }
      await StorageService.setPIN(pin);
      await AppLockBridge.updatePIN(pin);
      Alert.alert('Success', 'PIN set successfully!');
      onComplete();
    }
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.setupContainer}>
        <LockIcon />
        <Text style={styles.setupTitle}>Set Up Parental PIN</Text>
        <Text style={styles.setupSubtitle}>
          {step === 'enter'
            ? 'Create a PIN to protect settings'
            : 'Confirm your PIN'}
        </Text>

        <TextInput
          style={styles.pinSetupInput}
          value={step === 'enter' ? pin : confirmPin}
          onChangeText={step === 'enter' ? setPin : setConfirmPin}
          secureTextEntry
          keyboardType="numeric"
          placeholder="Enter PIN"
          maxLength={6}
          autoFocus
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>
            {step === 'enter' ? 'Continue' : 'Confirm'}
          </Text>
        </TouchableOpacity>

        {step === 'confirm' && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setStep('enter');
              setConfirmPin('');
            }}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  screen: {
    flex: 1,
    padding: 20,
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  pinSetupInput: {
    width: '100%',
    height: 60,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 10,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default App;
