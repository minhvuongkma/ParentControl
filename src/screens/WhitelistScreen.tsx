import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Switch, TextInput, ActivityIndicator } from 'react-native';
import { AppLockBridge, AppInfo } from '../services/AppLockBridge';
import { StorageService } from '../services/StorageService';

const WhitelistScreen = () => {
    const [apps, setApps] = useState<AppInfo[]>([]);
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const allApps = await AppLockBridge.getInstalledApps();
            const currentWhitelist = StorageService.getWhitelist();
            setApps(allApps.sort((a, b) => a.appName.localeCompare(b.appName)));
            setWhitelist(currentWhitelist);
            setLoading(false);
        };
        fetchData();
    }, []);

    const toggleApp = (packageName: string) => {
        let newWhitelist;
        if (whitelist.includes(packageName)) {
            newWhitelist = whitelist.filter(p => p !== packageName);
        } else {
            newWhitelist = [...whitelist, packageName];
        }
        setWhitelist(newWhitelist);
        AppLockBridge.updateWhitelist(newWhitelist);
    };

    const filteredApps = apps.filter(app =>
        app.appName.toLowerCase().includes(search.toLowerCase()) ||
        app.packageName.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: { item: AppInfo }) => (
        <View style={styles.item}>
            <View style={styles.itemInfo}>
                <Text style={styles.appName}>{item.appName}</Text>
                <Text style={styles.packageName}>{item.packageName}</Text>
            </View>
            <Switch
                value={whitelist.includes(item.packageName)}
                onValueChange={() => toggleApp(item.packageName)}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.searchBar}
                placeholder="Search apps..."
                value={search}
                onChangeText={setSearch}
            />
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredApps}
                    keyExtractor={(item) => item.packageName}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    searchBar: {
        backgroundColor: '#FFF',
        padding: 12,
        margin: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#DDD',
    },
    loader: {
        flex: 1,
    },
    list: {
        paddingHorizontal: 15,
    },
    item: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1,
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    appName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    packageName: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
});

export default WhitelistScreen;
