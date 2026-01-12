// Simple icon components to replace lucide-react-native
import React from 'react';
import { Text, StyleSheet } from 'react-native';

const iconStyles = StyleSheet.create({
    icon: {
        fontSize: 24,
    },
});

export const Shield = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>🛡️</Text>
);

export const ShieldOff = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>⚠️</Text>
);

export const Lock = ({ size = 24, color = '#000', style }: { size?: number; color?: string; style?: any }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }, style]}>🔒</Text>
);

export const Unlock = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>🔓</Text>
);

export const Play = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>▶️</Text>
);

export const Settings = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>⚙️</Text>
);

export const AppWindow = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>📱</Text>
);

export const Clock = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>⏱️</Text>
);

export const Layout = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>📐</Text>
);

export const ArrowLeft = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
    <Text style={[iconStyles.icon, { fontSize: size, color }]}>←</Text>
);
