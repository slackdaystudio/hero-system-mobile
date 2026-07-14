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

import React, {useEffect, useState} from 'react';
import {Modal, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {STATUS_NAMES, type CombatStatus, type StatusName} from 'core/combat';
import {Button, NumberField, SegmentedControl, Text, TextField, type Segment} from 'app/components';
import {useTheme} from 'app/theme';

const TYPE_SEGMENTS: Segment[] = STATUS_NAMES.map((name) => ({value: name, label: name}));

interface FormState {
    name: StatusName;
    label: string;
    activePoints: string;
    targetTrait: string;
    body: string;
    pd: string;
    ed: string;
    segments: string;
}

const toForm = (status: CombatStatus): FormState => ({
    name: status.name,
    label: status.label ?? '',
    activePoints: String(status.activePoints ?? 0),
    targetTrait: status.targetTrait ?? '',
    body: String(status.body ?? 0),
    pd: String(status.pd ?? 0),
    ed: String(status.ed ?? 0),
    segments: String(status.segments ?? 0),
});

const toInt = (value: string): number => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
};

const build = (form: FormState): CombatStatus => {
    const base: CombatStatus = {name: form.name, label: form.label.trim()};

    switch (form.name) {
        case 'Aid':
        case 'Drain':
            return {...base, activePoints: toInt(form.activePoints), targetTrait: form.targetTrait.trim()};
        case 'Entangle':
            return {...base, body: toInt(form.body), pd: toInt(form.pd), ed: toInt(form.ed)};
        case 'Flash':
            return {...base, segments: toInt(form.segments)};
    }
};

/**
 * Add/edit a combat status effect. `initial` non-null opens the modal seeded with
 * that status; `onApply` returns the built status to the caller (which appends or
 * replaces). Type-specific fields follow the selected status name.
 */
export function StatusDialog({initial, onApply, onClose}: {initial: CombatStatus | null; onApply: (status: CombatStatus) => void; onClose: () => void}): React.JSX.Element {
    const theme = useTheme();
    const [form, setForm] = useState<FormState>(() => toForm(initial ?? {name: 'Aid', label: ''}));

    useEffect(() => {
        if (initial !== null) {
            setForm(toForm(initial));
        }
    }, [initial]);

    const set = (key: keyof FormState) => (value: string) => setForm((prev) => ({...prev, [key]: value}));

    const card: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg};

    return (
        <Modal transparent visible={initial !== null} animationType="fade" onRequestClose={onClose}>
            <Pressable testID="status-backdrop" style={styles.backdrop} onPress={onClose}>
                <Pressable style={[styles.card, card]} onPress={() => undefined}>
                    <Text variant="subtitle">Status Effect</Text>

                    <SegmentedControl segments={TYPE_SEGMENTS} value={form.name} onChange={(value) => set('name')(value)} />

                    <TextField testID="status-label" label="Label (optional)" value={form.label} onChangeText={set('label')} maxLength={32} placeholder={form.name} />

                    <SecondaryFields form={form} set={set} />

                    <View style={styles.actions}>
                        <View style={styles.grow}>
                            <Button testID="status-cancel" label="Cancel" variant="secondary" onPress={onClose} />
                        </View>
                        <View style={styles.grow}>
                            <Button testID="status-apply" label="Apply" onPress={() => onApply(build(form))} />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function SecondaryFields({form, set}: {form: FormState; set: (key: keyof FormState) => (value: string) => void}): React.JSX.Element | null {
    if (form.name === 'Aid' || form.name === 'Drain') {
        return (
            <>
                <TextField testID="status-activePoints" label="Active Points" value={form.activePoints} onChangeText={set('activePoints')} keyboardType="numbers-and-punctuation" />
                <TextField testID="status-targetTrait" label="Affected trait(s)" value={form.targetTrait} onChangeText={set('targetTrait')} placeholder="e.g. STR, Force Field" />
            </>
        );
    }
    if (form.name === 'Entangle') {
        return (
            <View style={styles.row}>
                <NumberField testID="status-body" label="BODY" value={form.body} onChangeText={set('body')} />
                <NumberField testID="status-pd" label="PD" value={form.pd} onChangeText={set('pd')} />
                <NumberField testID="status-ed" label="ED" value={form.ed} onChangeText={set('ed')} />
            </View>
        );
    }
    return <NumberField testID="status-segments" label="Segments" value={form.segments} onChangeText={set('segments')} />;
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    card: {
        width: '100%',
        maxWidth: 380,
        padding: 20,
        rowGap: 12,
    },
    row: {
        flexDirection: 'row',
        columnGap: 12,
    },
    actions: {
        flexDirection: 'row',
        columnGap: 12,
        marginTop: 4,
    },
    grow: {
        flex: 1,
    },
});
