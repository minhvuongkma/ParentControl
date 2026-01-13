import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { StorageService } from '../services/StorageService';
import { Lock } from 'lucide-react-native';

type Props = StackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
    const [pin, setPin] = useState('');
    const isSetup = route.params?.isSetup || !StorageService.hasPIN();

    const handlePress = async () => {
        if (isSetup) {
            if (pin.length < 4) {
                Alert.alert('Error', 'PIN must be at least 4 digits');
                return;
            }
            await StorageService.savePIN(pin);
            Alert.alert('Success', 'PIN set successfully');
            navigation.replace('Home');
        } else {
            const isValid = await StorageService.verifyPIN(pin);
            if (isValid) {
                navigation.replace('Home');
            } else {
                Alert.alert('Error', 'Invalid PIN');
                setPin('');
            }
        }
    };

    return (
        <View style={styles.container}>
            <Lock size={64} color="#007AFF" style={styles.icon} />
            <Text style={styles.title}>{isSetup ? 'Set Parental PIN' : 'Enter Parental PIN'}</Text>
            <TextInput
                style={styles.input}
                value={pin}
                onChangeText={setPin}
                keyboardType="numeric"
                secureTextEntry
                placeholder="****"
                maxLength={6}
            />
            <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>{isSetup ? 'Set PIN' : 'Login'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        padding: 20,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    input: {
        backgroundColor: '#FFF',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        fontSize: 24,
        textAlign: 'center',
        paddingHorizontal: 0,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    button: {
        backgroundColor: '#007AFF',
        width: '100%',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default LoginScreen;
