import { NativeModules } from 'react-native';
import { StorageService } from './StorageService';

const { AppLockModule } = NativeModules;

export interface AppInfo {
    packageName: string;
    appName: string;
}

export const AppLockBridge = {
    startLockingService: () => {
        if (AppLockModule?.startService) {
            AppLockModule.startService();
        } else {
            console.warn('Native startService not found.');
        }
    },
    stopLockingService: () => {
        if (AppLockModule?.stopService) {
            AppLockModule.stopService();
        }
    },
    updateLockStatus: async (isLocked: boolean) => {
        StorageService.setIsLocked(isLocked);
        if (AppLockModule?.setLocked) {
            await AppLockModule.setLocked(isLocked);
        }
    },
    getLockStatus: async (): Promise<boolean> => {
        if (AppLockModule?.getLocked) {
            return await AppLockModule.getLocked();
        }
        return false;
    },
    updateTimerEndTime: async (endTime: number | null) => {
        if (AppLockModule?.setTimerEndTime) {
            await AppLockModule.setTimerEndTime(endTime || 0);
        }
    },
    getTimerEndTime: async (): Promise<number | null> => {
        if (AppLockModule?.getTimerEndTime) {
            const time = await AppLockModule.getTimerEndTime();
            return time > 0 ? time : null;
        }
        return null;
    },
    isDeviceAdminActive: async (): Promise<boolean> => {
        if (AppLockModule?.isDeviceAdminActive) {
            return await AppLockModule.isDeviceAdminActive();
        }
        return false;
    },
    requestDeviceAdmin: () => {
        if (AppLockModule?.requestDeviceAdmin) {
            AppLockModule.requestDeviceAdmin();
        }
    },
    updateFloatingSetting: (enabled: boolean) => {
        StorageService.setFloatingTimerEnabled(enabled);
        if (AppLockModule?.setFloatingEnabled) {
            AppLockModule.setFloatingEnabled(enabled);
        }
    },
    updateFloatingPosition: (position: string) => {
        StorageService.setFloatingPosition(position);
        if (AppLockModule?.setFloatingPosition) {
            AppLockModule.setFloatingPosition(position);
        }
    },
    hasOverlayPermission: async (): Promise<boolean> => {
        if (AppLockModule?.hasOverlayPermission) {
            return await AppLockModule.hasOverlayPermission();
        }
        return false;
    },
    requestOverlayPermission: () => {
        if (AppLockModule?.requestOverlayPermission) {
            AppLockModule.requestOverlayPermission();
        }
    },
    updateNotificationSetting: (enabled: boolean) => {
        StorageService.setNotificationTimerEnabled(enabled);
        if (AppLockModule?.setNotificationEnabled) {
            AppLockModule.setNotificationEnabled(enabled);
        }
    },
    updatePIN: async (pin: string) => {
        if (AppLockModule?.setPIN) {
            await AppLockModule.setPIN(pin);
        }
    },
};
