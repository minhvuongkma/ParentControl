import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react-native';

type Props = StackScreenProps<RootStackParamList, 'DeviceAdminInstructions'>;

const DeviceAdminInstructions: React.FC<Props> = ({ navigation }) => {
    const steps = [
        "Go to your phone's Settings",
        "Search for 'Device Admin Apps' or 'Special App Access'",
        "Look for 'Parent Control' in the list",
        "Toggle it to 'On' or 'Activate'",
        "Confirm the activation in the system popup"
    ];

    return (
        <SafeAreaView style={styles.mainWrapper}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Device Admin Setup</Text>
            </View>

            <ScrollView style={styles.container}>
                <View style={[styles.card, styles.introCard]}>
                    <Shield size={48} color="#007AFF" style={{ marginBottom: 15 }} />
                    <Text style={styles.title}>Why Device Admin?</Text>
                    <Text style={styles.description}>
                        Device Admin permission is required to prevent the app from being easily bypassed or uninstalled during lockdown.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Activation Steps</Text>
                <View style={styles.card}>
                    {steps.map((step, index) => (
                        <View key={index} style={styles.stepRow}>
                            <View style={styles.stepNumber}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>

                <View style={[styles.card, styles.noteCard]}>
                    <CheckCircle2 size={20} color="#34C759" style={{ marginRight: 10 }} />
                    <Text style={styles.noteText}>
                        Once activated, return to this app to confirm the status has updated to 'Enabled'.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.primaryButtonText}>I Understand</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    mainWrapper: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#333',
    },
    container: {
        flex: 1,
        padding: 20,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    introCard: {
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        color: '#444',
        textAlign: 'center',
        lineHeight: 22,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 12,
        marginLeft: 4,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    stepNumberText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    noteCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FFF4',
        borderColor: '#34C759',
        borderWidth: 1,
    },
    noteText: {
        flex: 1,
        fontSize: 14,
        color: '#1A531B',
    },
    footer: {
        padding: 20,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    primaryButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DeviceAdminInstructions;
