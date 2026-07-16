// Copyright 2018-Present Philip J. Guinchard
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {Text} from 'app/components';
import {useTheme} from 'app/theme';

export type ToastVariant = 'info' | 'warning' | 'danger';

export interface ToastApi {
    /** Show a transient message at the bottom of the screen. A new toast replaces the current one. */
    showToast: (message: string, variant?: ToastVariant) => void;
}

interface ToastState {
    id: number;
    message: string;
    variant: ToastVariant;
}

// A no-op default so `useToast` is safe anywhere — a consumer rendered outside the provider (e.g. in
// a unit test) simply drops the toast rather than throwing.
const ToastContext = createContext<ToastApi>({showToast: () => undefined});

/** How long a toast lingers before it fades out, in ms. */
const TOAST_MS = 3200;

/**
 * A lightweight, theme-styled toast host. One toast at a time, shown over everything, tap- or
 * timeout-dismissed. Owned here rather than pulled from a kit — the app styles its own UI.
 */
export function ToastProvider({children}: {children: React.ReactNode}): React.JSX.Element {
    const [toast, setToast] = useState<ToastState | null>(null);
    const nextId = useRef(0);

    const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
        nextId.current += 1;
        setToast({id: nextId.current, message, variant});
    }, []);

    const api = useMemo<ToastApi>(() => ({showToast}), [showToast]);

    return (
        <ToastContext.Provider value={api}>
            <View style={styles.host}>
                {children}
                {toast !== null ? <Toast key={toast.id} toast={toast} onDismiss={() => setToast(null)} /> : null}
            </View>
        </ToastContext.Provider>
    );
}

/** Access the toast API. Safe outside a provider (no-op). */
export function useToast(): ToastApi {
    return useContext(ToastContext);
}

function Toast({toast, onDismiss}: {toast: ToastState; onDismiss: () => void}): React.JSX.Element {
    const theme = useTheme();
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {toValue: 1, duration: 200, useNativeDriver: true}).start();
        const timer = setTimeout(() => {
            Animated.timing(anim, {toValue: 0, duration: 200, useNativeDriver: true}).start(({finished}) => {
                if (finished) {
                    onDismiss();
                }
            });
        }, TOAST_MS);

        return () => clearTimeout(timer);
        // Keyed by id upstream, so this runs once per distinct toast.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const background = toast.variant === 'danger' ? theme.colors.danger : toast.variant === 'warning' ? theme.colors.primary : theme.colors.surfaceAlt;
    const foreground = toast.variant === 'info' ? theme.colors.text : theme.colors.onPrimary;
    const bubble: ViewStyle = {backgroundColor: background, borderRadius: theme.radius.md};
    const translateY = anim.interpolate({inputRange: [0, 1], outputRange: [16, 0]});

    return (
        <Animated.View pointerEvents="box-none" style={[styles.wrap, {opacity: anim, transform: [{translateY}]}]}>
            <Pressable testID="toast" accessibilityRole="button" onPress={onDismiss} style={[styles.bubble, bubble]}>
                <Text color={foreground} style={styles.text}>
                    {toast.message}
                </Text>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    host: {
        flex: 1,
    },
    wrap: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 32,
        alignItems: 'center',
    },
    bubble: {
        maxWidth: 520,
        paddingVertical: 12,
        paddingHorizontal: 18,
    },
    text: {
        textAlign: 'center',
        fontWeight: '600',
    },
});
