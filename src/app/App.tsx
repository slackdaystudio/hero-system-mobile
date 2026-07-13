import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {CORE_MARKER} from 'core/util/version';

/**
 * Phase 0 app shell. Proves the app -> core wiring and the layered layout.
 * Real navigation, store, and screens arrive in Phases 3-4.
 */
function App(): React.JSX.Element {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={styles.content}>
                <Text style={styles.title}>HERO System Mobile</Text>
                <Text style={styles.subtitle}>clean-room rebuild — core: {CORE_MARKER}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1b1b1d',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        color: '#e8e8e8',
        fontSize: 22,
        fontWeight: '600',
    },
    subtitle: {
        color: '#8a8a8a',
        fontSize: 13,
        marginTop: 8,
    },
});

export default App;
