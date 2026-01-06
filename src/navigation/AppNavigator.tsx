import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import WhitelistScreen from '../screens/WhitelistScreen';
import { StorageService } from '../services/StorageService';

export type RootStackParamList = {
    Login: { isSetup?: boolean };
    Home: undefined;
    Settings: undefined;
    Whitelist: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
    const hasPIN = StorageService.hasPIN();

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={hasPIN ? "Login" : "Login"}
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#007AFF',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ title: 'Parental Login', headerShown: false }}
                    initialParams={{ isSetup: !hasPIN }}
                />
                <Stack.Screen
                    name="Home"
                    component={HomeScreen}
                    options={{ title: 'Parental Control', headerLeft: () => null }}
                />
                <Stack.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{ title: 'Settings' }}
                />
                <Stack.Screen
                    name="Whitelist"
                    component={WhitelistScreen}
                    options={{ title: 'Manage Whitelist' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
