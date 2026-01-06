import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AppLockBridge } from '../services/AppLockBridge';
import { Shield, Layout, Settings as SettingsIcon, AppWindow, Lock, Clock } from 'lucide-react-native';
import { StorageService } from '../services/StorageService';
import { Modal, TextInput } from 'react-native';

type Props = StackScreenProps<RootStackParamList, 'Settings'>;

const POSITIONS = [
    { label: 'Top Left', value: 'top-left' },
    { label: 'Top Right', value: 'top-right' },
    { label: 'Bottom Left', value: 'bottom-left' },
    { label: 'Bottom Right', value: 'bottom-right' },
];

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
    const [permissions, setPermissions] = useState({
        usage: false,
        overlay: false,
        admin: false,
    });

    const checkPermissions = async () => {
        const usage = await AppLockBridge.hasUsageStatsPermission();
        const overlay = await AppLockBridge.hasOverlayPermission();
        const admin = await AppLockBridge.isDeviceAdminActive();
        setPermissions({ usage, overlay, admin });
    };

    const [floatingEnabled, setFloatingEnabled] = useState(StorageService.getFloatingTimerEnabled());
    const [floatingPos, setFloatingPos] = useState(StorageService.getFloatingPosition());

    useEffect(() => {
        checkPermissions();
        const unsubscribe = navigation.addListener('focus', () => {
            checkPermissions();
            setFloatingEnabled(StorageService.getFloatingTimerEnabled());
            setFloatingPos(StorageService.getFloatingPosition());
        });
        return unsubscribe;
    }, [navigation]);

    const toggleFloating = (value: boolean) => {
        setFloatingEnabled(value);
        AppLockBridge.updateFloatingSetting(value);
    };

    const changePosition = (pos: string) => {
        setFloatingPos(pos);
        AppLockBridge.updateFloatingPosition(pos);
    };

    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState('');

    const handlePINChangeRequest = () => {
        setPinInput('');
        setShowPinModal(true);
    };

    const verifyAndChange = async () => {
        const isValid = await StorageService.verifyPIN(pinInput);
        if (isValid) {
            setShowPinModal(false);
            setPinInput('');
            navigation.navigate('Login', { isSetup: true });
        } else {
            Alert.alert('Error', 'Incorrect PIN');
            setPinInput('');
        }
    };

    const PermissionItem = ({ title, status, onPress, icon: Icon }: any) => (
        <View style={styles.item}>
            <View style={styles.itemLeft}>
                <Icon size={24} color="#007AFF" />
                <Text style={styles.itemTitle}>{title}</Text>
            </View>
            <TouchableOpacity
                style={[styles.statusBadge, status ? styles.statusOk : styles.statusMissing]}
                onPress={onPress}
            >
                <Text style={styles.statusText}>{status ? 'Enabled' : 'Grant'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <View style={styles.card}>
                <PermissionItem
                    title="Usage Access"
                    status={permissions.usage}
                    onPress={() => AppLockBridge.requestUsageStatsPermission()}
                    icon={Layout}
                />
                <PermissionItem
                    title="Overlay Permission"
                    status={permissions.overlay}
                    onPress={() => AppLockBridge.requestOverlayPermission()}
                    icon={AppWindow}
                />
                <PermissionItem
                    title="Device Admin"
                    status={permissions.admin}
                    onPress={() => AppLockBridge.requestDeviceAdmin()}
                    icon={Shield}
                />
            </View>

            <Text style={styles.sectionTitle}>App Configuration</Text>
            <View style={styles.card}>
                <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('Whitelist')}>
                    <View style={styles.itemLeft}>
                        <AppWindow size={24} color="#007AFF" />
                        <Text style={styles.itemTitle}>Manage Whitelist</Text>
                    </View>
                    <Text style={styles.chevron}>&gt;</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.item} onPress={handlePINChangeRequest}>
                    <View style={styles.itemLeft}>
                        <SettingsIcon size={24} color="#007AFF" />
                        <Text style={styles.itemTitle}>Change Parent PIN</Text>
                    </View>
                    <Text style={styles.chevron}>&gt;</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Timer Display Settings</Text>
            <View style={styles.card}>
                <View style={styles.item}>
                    <View style={styles.itemLeft}>
                        <Clock size={24} color="#007AFF" />
                        <Text style={styles.itemTitle}>Floating Timer Overlay</Text>
                    </View>
                    <Switch
                        value={floatingEnabled}
                        onValueChange={toggleFloating}
                        trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                    />
                </View>

                {floatingEnabled && (
                    <View style={styles.positionSelector}>
                        <Text style={styles.selectorLabel}>Timer Position:</Text>
                        <View style={styles.positionGrid}>
                            {POSITIONS.map((pos) => (
                                <TouchableOpacity
                                    key={pos.value}
                                    style={[
                                        styles.posBadge,
                                        floatingPos === pos.value && styles.posBadgeActive
                                    ]}
                                    onPress={() => changePosition(pos.value)}
                                >
                                    <Text style={[
                                        styles.posBadgeText,
                                        floatingPos === pos.value && styles.posBadgeTextActive
                                    ]}>{pos.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <Modal
                visible={showPinModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowPinModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Lock size={40} color="#007AFF" style={{ marginBottom: 15 }} />
                        <Text style={styles.modalTitle}>Enter Current PIN</Text>
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
                                onPress={() => setShowPinModal(false)}
                            >
                                <Text style={{ color: '#666' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.confirmBtn]}
                                onPress={verifyAndChange}
                            >
                                <Text style={{ color: '#FFF' }}>Verify</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        padding: 15,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 10,
        marginTop: 10,
        marginLeft: 5,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        overflow: 'hidden',
        marginBottom: 20,
        elevation: 2,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemTitle: {
        fontSize: 16,
        marginLeft: 15,
        color: '#333',
    },
    statusBadge: {
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 15,
    },
    statusOk: { backgroundColor: '#34C759' },
    statusMissing: { backgroundColor: '#FF9500' },
    statusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    chevron: {
        fontSize: 20,
        color: '#CCC',
    },
    serviceButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    serviceButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    hint: {
        textAlign: 'center',
        color: '#999',
        marginTop: 10,
        fontSize: 12,
        paddingBottom: 30,
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
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    pinInput: {
        width: '100%',
        height: 50,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 24,
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
    positionSelector: {
        padding: 15,
        backgroundColor: '#F9F9F9',
    },
    selectorLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    positionGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    posBadge: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#E5E5EA',
        borderWidth: 1,
        borderColor: '#D1D1D6',
    },
    posBadgeActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    posBadgeText: {
        fontSize: 12,
        color: '#333',
    },
    posBadgeTextActive: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default SettingsScreen;
