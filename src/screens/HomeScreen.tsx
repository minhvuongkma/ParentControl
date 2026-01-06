import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Modal } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService } from '../services/StorageService';
import { AppLockBridge } from '../services/AppLockBridge';
import { Settings, Shield, ShieldOff, Play, Square, Activity, Lock, Unlock } from 'lucide-react-native';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

type PendingAction = 'startTimer' | 'unlock' | 'openSettings' | null;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isLocked, setIsLocked] = useState<boolean>(false);
    const [customMinutes, setCustomMinutes] = useState<string>('15');
    const [showPinModal, setShowPinModal] = useState<boolean>(false);
    const [pinInput, setPinInput] = useState<string>('');

    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [pendingMinutes, setPendingMinutes] = useState<number | null>(null);

    // The critical reference for the countdown
    const timerEndTimeRef = useRef<number>(0);
    // Flag to prevent sync from overwriting a fresh user action
    const isUpdatingRef = useRef<boolean>(false);

    const syncWithNative = useCallback(async () => {
        // Skip sync if we just performed a manual action (prevent race conditions)
        if (isUpdatingRef.current) return;

        try {
            const nativeEndTime = await AppLockBridge.getTimerEndTime();
            const nativeLocked = await AppLockBridge.getLockStatus();

            // Re-check flag after async call
            if (isUpdatingRef.current) return;

            timerEndTimeRef.current = nativeEndTime || 0;
            setIsLocked(nativeLocked);

            if (nativeEndTime && nativeEndTime > Date.now()) {
                setTimeLeft(Math.floor((nativeEndTime - Date.now()) / 1000));
            } else {
                setTimeLeft(0);
            }
        } catch (e) {
            console.error('Sync failed:', e);
        }
    }, []);

    useEffect(() => {
        // Initial sync on mount
        syncWithNative();

        // One stable interval for the countdown
        const interval = setInterval(() => {
            const now = Date.now();
            const endTime = timerEndTimeRef.current;

            if (endTime > 0) {
                const diff = Math.floor((endTime - now) / 1000);
                if (diff <= 0) {
                    // TIMER EXPIRED
                    timerEndTimeRef.current = 0;
                    setTimeLeft(0);
                    // Force the lock state
                    setIsLocked(true);
                    AppLockBridge.updateLockStatus(true);
                    AppLockBridge.updateTimerEndTime(null);
                } else {
                    // UPDATE UI
                    setTimeLeft(diff);
                }
            } else {
                // Not counting down, but ensures timeLeft matches 0
                if (timeLeft !== 0) setTimeLeft(0);
            }
        }, 1000);

        // Occasional sync from native (every 10s)
        const syncInterval = setInterval(syncWithNative, 10000);

        return () => {
            clearInterval(interval);
            clearInterval(syncInterval);
        };
    }, [syncWithNative, timeLeft]);

    const executeStartTimer = async (minutes: number) => {
        isUpdatingRef.current = true;

        const endTime = Date.now() + minutes * 60 * 1000;

        // Update LOCAL UI immediately
        timerEndTimeRef.current = endTime;
        setTimeLeft(minutes * 60);
        setIsLocked(false);

        // Persist to native side
        await AppLockBridge.updateLockStatus(false);
        await AppLockBridge.updateTimerEndTime(endTime);
        AppLockBridge.startLockingService();

        // Longer protection
        setTimeout(() => {
            isUpdatingRef.current = false;
        }, 5000);
    };

    const executeUnlock = async () => {
        isUpdatingRef.current = true;

        timerEndTimeRef.current = 0;
        setTimeLeft(0);
        setIsLocked(false);

        await AppLockBridge.updateLockStatus(false);
        await AppLockBridge.updateTimerEndTime(null);

        setTimeout(() => {
            isUpdatingRef.current = false;
        }, 5000);
    };

    const executeLock = async () => {
        isUpdatingRef.current = true;

        timerEndTimeRef.current = 0;
        setTimeLeft(0);
        setIsLocked(true);

        await AppLockBridge.updateLockStatus(true);
        await AppLockBridge.updateTimerEndTime(null);
        AppLockBridge.startLockingService();

        setTimeout(() => {
            isUpdatingRef.current = false;
        }, 5000);
    };

    const handleTimerRequest = (minutes: number) => {
        setPendingAction('startTimer');
        setPendingMinutes(minutes);
        setPinInput('');
        setShowPinModal(true);
    };

    const handleToggleLock = () => {
        if (isLocked) {
            setPendingAction('unlock');
            setPinInput('');
            setShowPinModal(true);
        } else {
            executeLock();
        }
    };

    const verifyAndExecute = async () => {
        const isValid = await StorageService.verifyPIN(pinInput);
        if (isValid) {
            const action = pendingAction;
            // Clear modal state first to avoid flicker
            setShowPinModal(false);
            setPinInput('');
            setPendingAction(null);

            if (action === 'startTimer' && pendingMinutes) {
                executeStartTimer(pendingMinutes);
                setPendingMinutes(null);
            } else if (action === 'unlock') {
                executeUnlock();
            } else if (action === 'openSettings') {
                navigation.navigate('Settings');
            }
        } else {
            Alert.alert('Error', 'Incorrect PIN. Try again.');
            setPinInput('');
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartCustom = () => {
        const mins = parseInt(customMinutes, 10);
        if (isNaN(mins) || mins <= 0) {
            Alert.alert('Error', 'Please enter a valid number of minutes');
            return;
        }
        handleTimerRequest(mins);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.statusCard}>
                {isLocked ? (
                    <ShieldOff size={80} color="#FF3B30" />
                ) : (
                    <Shield size={80} color="#34C759" />
                )}
                <Text style={styles.statusTitle}>{isLocked ? 'Lockdown Active' : 'Access Allowed'}</Text>
                <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>

            <View style={styles.controls}>
                <Text style={styles.sectionTitle}>Manual Control</Text>
                <TouchableOpacity
                    style={[styles.actionButton, isLocked ? styles.unlockBtn : styles.lockBtn]}
                    onPress={handleToggleLock}
                >
                    {isLocked ? <Unlock color="#FFF" /> : <Lock color="#FFF" />}
                    <Text style={styles.actionButtonText}>{isLocked ? 'Unlock Now' : 'Lock Now'}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.controls}>
                <Text style={styles.sectionTitle}>Set Timer Duration</Text>

                <View style={styles.customInputContainer}>
                    <TextInput
                        style={styles.customInput}
                        value={customMinutes}
                        onChangeText={setCustomMinutes}
                        keyboardType="numeric"
                        placeholder="Minutes"
                    />
                    <TouchableOpacity
                        style={styles.customStartBtn}
                        onPress={handleStartCustom}
                    >
                        <Play size={20} color="#FFF" />
                        <Text style={styles.customStartBtnText}>Start</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.buttonGrid}>
                    {[15, 30, 60].map((min) => (
                        <TouchableOpacity
                            key={min}
                            style={styles.timerOption}
                            onPress={() => handleTimerRequest(min)}
                        >
                            <Text style={styles.timerOptionText}>{min}m</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.controls}>
                <Text style={styles.sectionTitle}>Service Control</Text>
                <TouchableOpacity
                    style={styles.serviceControlBtn}
                    onPress={() => {
                        AppLockBridge.startLockingService();
                        AppLockBridge.minimizeApp();
                    }}
                >
                    <Activity color="#FFF" />
                    <Text style={styles.actionButtonText}>Start Background Service</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => {
                    const isTimerRunning = timerEndTimeRef.current > Date.now();
                    if (isTimerRunning || isLocked) {
                        setPendingAction('openSettings');
                        setPinInput('');
                        setShowPinModal(true);
                    } else {
                        navigation.navigate('Settings');
                    }
                }}
            >
                <Settings color="#666" />
                <Text style={styles.settingsButtonText}>Settings & Permissions</Text>
            </TouchableOpacity>

            <Modal
                visible={showPinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShowPinModal(false);
                    setPendingAction(null);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Lock size={40} color="#007AFF" style={{ marginBottom: 15 }} />
                        <Text style={styles.modalTitle}>Parental PIN Required</Text>
                        <Text style={styles.modalSubtitle}>
                            {pendingAction === 'unlock' ? 'Enter PIN to unlock device' :
                                pendingAction === 'openSettings' ? 'Enter PIN to access settings' :
                                    'Enter PIN to start a new timer'}
                        </Text>
                        <TextInput
                            style={styles.pinInput}
                            value={pinInput}
                            onChangeText={setPinInput}
                            secureTextEntry
                            keyboardType="numeric"
                            placeholder="****"
                            placeholderTextColor="#CCC"
                            autoFocus
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => {
                                    setShowPinModal(false);
                                    setPendingAction(null);
                                }}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={verifyAndExecute}
                            >
                                <Text style={styles.confirmBtnText}>Verify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    statusCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statusTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 15,
        color: '#333',
    },
    timerText: {
        fontSize: 48,
        fontWeight: '600',
        color: '#007AFF',
        marginTop: 10,
    },
    controls: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#666',
    },
    buttonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    timerOption: {
        backgroundColor: '#E5E5EA',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        width: '30%',
        alignItems: 'center',
    },
    timerOptionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    actionButton: {
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    lockBtn: { backgroundColor: '#FF3B30' },
    unlockBtn: { backgroundColor: '#34C759' },
    actionButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    settingsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
    },
    settingsButtonText: {
        color: '#666',
        fontSize: 16,
        marginLeft: 10,
    },
    customInputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 10,
    },
    customInput: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#333',
        height: 50,
    },
    customStartBtn: {
        backgroundColor: '#007AFF',
        borderRadius: 10,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    customStartBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    serviceControlBtn: {
        backgroundColor: '#5856D6',
        flexDirection: 'row',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 30,
        width: '100%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    pinInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 24,
        letterSpacing: 10,
        marginBottom: 25,
        color: '#000',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        height: 50,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F0F0F0',
    },
    confirmBtn: {
        backgroundColor: '#007AFF',
    },
    cancelBtnText: {
        color: '#666',
        fontWeight: 'bold',
    },
    confirmBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default HomeScreen;
