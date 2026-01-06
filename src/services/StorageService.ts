import { MMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';

let storage: MMKV | null = null;

const getStorage = () => {
  if (!storage) {
    try {
      const { MMKV: MMKVClass } = require('react-native-mmkv');
      storage = new MMKVClass();
    } catch (e) {
      console.warn('MMKV failed to initialize:', e);
    }
  }
  return storage;
};

export const StorageKeys = {
  WHITELIST: 'app_whitelist',
  IS_LOCKED: 'is_locked',
  HAS_PIN: 'has_pin',
  SHOW_NOTIFICATION_TIMER: 'show_notification_timer',
  SHOW_FLOATING_TIMER: 'show_floating_timer',
  FLOATING_POSITION: 'floating_position',
};

export const StorageService = {
  // Whitelist
  getWhitelist: (): string[] => {
    const s = getStorage();
    const whitelist = s?.getString(StorageKeys.WHITELIST);
    return whitelist ? JSON.parse(whitelist) : [];
  },
  setWhitelist: (whitelist: string[]) => {
    getStorage()?.set(StorageKeys.WHITELIST, JSON.stringify(whitelist));
  },

  // Lock Status
  setIsLocked: (isLocked: boolean) => {
    getStorage()?.set(StorageKeys.IS_LOCKED, isLocked);
  },
  getIsLocked: (): boolean => {
    return getStorage()?.getBoolean(StorageKeys.IS_LOCKED) || false;
  },

  // PIN (Secure)
  savePIN: async (pin: string) => {
    try {
      await Keychain.setGenericPassword('parental_pin', pin, { service: 'com.parentcontrol.pin' });
      getStorage()?.set(StorageKeys.HAS_PIN, true);
    } catch (e) {
      console.error('Keychain save error:', e);
      throw e;
    }
  },
  verifyPIN: async (pin: string): Promise<boolean> => {
    try {
      const credentials = await Keychain.getGenericPassword({ service: 'com.parentcontrol.pin' });
      if (credentials) {
        return credentials.password === pin;
      }
    } catch (e) {
      console.error('Keychain verify error:', e);
    }
    return false;
  },
  hasPIN: (): boolean => {
    return getStorage()?.getBoolean(StorageKeys.HAS_PIN) || false;
  },

  // UI Settings
  getNotificationTimerEnabled: (): boolean => {
    return getStorage()?.getBoolean(StorageKeys.SHOW_NOTIFICATION_TIMER) ?? true;
  },
  setNotificationTimerEnabled: (enabled: boolean) => {
    getStorage()?.set(StorageKeys.SHOW_NOTIFICATION_TIMER, enabled);
  },
  getFloatingTimerEnabled: (): boolean => {
    return getStorage()?.getBoolean(StorageKeys.SHOW_FLOATING_TIMER) ?? false;
  },
  setFloatingTimerEnabled: (enabled: boolean) => {
    getStorage()?.set(StorageKeys.SHOW_FLOATING_TIMER, enabled);
  },
  getFloatingPosition: (): string => {
    return getStorage()?.getString(StorageKeys.FLOATING_POSITION) ?? 'top-right';
  },
  setFloatingPosition: (position: string) => {
    getStorage()?.set(StorageKeys.FLOATING_POSITION, position);
  },
};
