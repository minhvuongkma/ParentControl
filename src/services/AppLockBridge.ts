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
    updateWhitelist: (whitelist: string[]) => {
        StorageService.setWhitelist(whitelist);
        if (AppLockModule?.setWhitelist) {
            AppLockModule.setWhitelist(whitelist.join(','));
        }
    },
    updateNotificationSetting: (enabled: boolean) => {
        StorageService.setNotificationTimerEnabled(enabled);
        if (AppLockModule?.setNotificationEnabled) {
            AppLockModule.setNotificationEnabled(enabled);
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
    hasUsageStatsPermission: async (): Promise<boolean> => {
        if (AppLockModule?.hasUsageStatsPermission) {
            return await AppLockModule.hasUsageStatsPermission();
        }
        return false;
    },
    requestUsageStatsPermission: () => {
        if (AppLockModule?.requestUsageStatsPermission) {
            AppLockModule.requestUsageStatsPermission();
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
    minimizeApp: () => {
        if (AppLockModule?.minimizeApp) {
            AppLockModule.minimizeApp();
        } else {
            console.warn('Native minimizeApp not found. Rebuild required.');
        }
    },
    getInstalledApps: async (): Promise<AppInfo[]> => {
        if (AppLockModule?.getInstalledApps) {
            return await AppLockModule.getInstalledApps();
        }
        return [];
    },
};
