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

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {
    addStatus,
    adjustCombatValue,
    clearStatuses,
    describeStatus,
    removeStatus,
    resetCombatValues,
    resetVital,
    setVital,
    startNewTurn,
    takeRecovery,
    togglePhaseAborted,
    togglePhaseUsed,
    updateStatus,
    type CombatState,
    type CombatStatus,
    type CombatValueKey,
    type Vital,
} from 'core/combat';
import {heroDesignerCharacter} from 'core/hero';
import type {Obj} from 'core/traits';
import {Button, Card, NumberField, SpendChip, Text} from 'app/components';
import {StatusDialog} from './StatusDialog';
import type {RollRequest} from 'app/dice/rollRequest';
import {describeSpend, useCombatState} from 'app/providers/CombatStateProvider';
import {useTheme} from 'app/theme';
import type {CombatSheet, MovementRow} from './characterSheet';

type RollHandler = (request: RollRequest, immediate: boolean) => void;

interface CombatValueRow {
    key: CombatValueKey;
    label: string;
    attack: boolean;
}

const SIX_E_VALUES: CombatValueRow[] = [
    {key: 'ocv', label: 'OCV', attack: true},
    {key: 'dcv', label: 'DCV', attack: false},
    {key: 'omcv', label: 'OMCV', attack: true},
    {key: 'dmcv', label: 'DMCV', attack: false},
];

const FIFTH_VALUES: CombatValueRow[] = [
    {key: 'ocv', label: 'OCV', attack: true},
    {key: 'dcv', label: 'DCV', attack: false},
];

const VITALS: Array<{key: Vital; label: string}> = [
    {key: 'stun', label: 'STUN'},
    {key: 'body', label: 'BODY'},
    {key: 'endurance', label: 'END'},
];

type HealthText = Record<Vital, string>;

const healthText = (state: CombatState): HealthText => ({stun: String(state.stun), body: String(state.body), endurance: String(state.endurance)});

/**
 * The live combat tracker for a character: editable health with Recovery, combat
 * values with modifiers, and the tap-to-use / long-press-to-abort phase chart.
 * State is seeded from the character's derived maximums, persisted per-character
 * through the combat-state repository, and every edit goes through a pure reducer.
 */
export function CombatTracker({character, combat, onRoll}: {character: Obj; combat: CombatSheet; onRoll: RollHandler}): React.JSX.Element {
    const combatApi = useCombatState();
    const state = combatApi?.state ?? null;
    const valueRows = useMemo(() => (heroDesignerCharacter.isFifth(character) ? FIFTH_VALUES : SIX_E_VALUES), [character]);

    const [health, setHealth] = useState<HealthText>({stun: '', body: '', endurance: ''});
    const [spendText, setSpendText] = useState('');
    const [burnNote, setBurnNote] = useState<string | null>(null);
    const [editing, setEditing] = useState<{status: CombatStatus; index: number | null} | null>(null);

    // Keep the editable health mirror in step with the shared pool — after Recovery, a reset, or a
    // spend from the sheet — but never clobber a value the user is mid-typing (guarded by the ref).
    const typingRef = useRef(false);
    useEffect(() => {
        if (state !== null && !typingRef.current) {
            setHealth(healthText(state));
        }
        typingRef.current = false;
    }, [state]);

    const apply = useCallback((next: CombatState) => combatApi?.apply(next), [combatApi]);

    const onHealthChange = useCallback(
        (vital: Vital) => (text: string) => {
            typingRef.current = true;
            setHealth((prev) => ({...prev, [vital]: text}));
            const parsed = Number.parseInt(text, 10);
            if (!Number.isNaN(parsed) && state !== null) {
                apply(setVital(state, vital, parsed));
            }
        },
        [state, apply],
    );

    /** Spend END from the shared pool (burning STUN for any shortfall) and report what happened. */
    const spendEnd = useCallback(
        (amount: number) => {
            const outcome = combatApi?.spend(amount);
            if (outcome !== null && outcome !== undefined) {
                setBurnNote(describeSpend(outcome));
            }
        },
        [combatApi],
    );

    const applyStatus = (status: CombatStatus) => {
        if (state === null || editing === null) {
            return;
        }
        apply(editing.index === null ? addStatus(state, status) : updateStatus(state, editing.index, status));
        setEditing(null);
    };

    if (combatApi === null || state === null) {
        return (
            <Card>
                <Text muted>Loading combat state…</Text>
            </Card>
        );
    }

    const max = combatApi.max;
    const phases = Object.keys(state.phases)
        .map(Number)
        .sort((a, b) => a - b);

    return (
        <View style={styles.tracker}>
            <Section title="Health">
                <Card>
                    {VITALS.map((vital) => (
                        <View key={vital.key} style={styles.vitalRow}>
                            <View style={styles.vitalField}>
                                <NumberField
                                    testID={`vital-${vital.key}`}
                                    label={`${vital.label}  /  ${max[vital.key]}`}
                                    value={health[vital.key]}
                                    onChangeText={onHealthChange(vital.key)}
                                />
                            </View>
                            <Button testID={`reset-${vital.key}`} label="Max" variant="secondary" onPress={() => apply(resetVital(state, vital.key, max))} />
                        </View>
                    ))}

                    <View style={styles.spendHeader}>
                        <Text variant="label" muted>
                            SPEND END
                        </Text>
                        {burnNote !== null ? (
                            <Text variant="caption" muted>
                                {burnNote}
                            </Text>
                        ) : null}
                    </View>
                    <View style={styles.spendRow}>
                        <View style={styles.grow}>
                            <Button testID="spend-end-1" label="–1" variant="secondary" onPress={() => spendEnd(1)} />
                        </View>
                        <View style={styles.grow}>
                            <Button testID="spend-end-5" label="–5" variant="secondary" onPress={() => spendEnd(5)} />
                        </View>
                        <View style={styles.grow}>
                            <Button testID="spend-end-10" label="–10" variant="secondary" onPress={() => spendEnd(10)} />
                        </View>
                    </View>
                    <View style={styles.spendRow}>
                        <View style={styles.vitalField}>
                            <NumberField testID="spend-end-amount" label="Amount" value={spendText} onChangeText={setSpendText} />
                        </View>
                        <Button
                            testID="spend-end"
                            label="Spend"
                            onPress={() => {
                                const amount = Number.parseInt(spendText, 10);
                                if (!Number.isNaN(amount)) {
                                    spendEnd(amount);
                                    setSpendText('');
                                }
                            }}
                        />
                    </View>

                    <View style={styles.recovery}>
                        <Button testID="recovery" label={`Recovery (+${max.recovery} STUN & END)`} onPress={() => apply(takeRecovery(state, max))} />
                    </View>
                </Card>
            </Section>

            <Section title="Combat Values">
                <Card>
                    {valueRows.map((row) => (
                        <CombatValueRowView key={row.key} row={row} value={state[row.key]} onAdjust={(delta) => apply(adjustCombatValue(state, row.key, delta))} onRoll={onRoll} />
                    ))}
                    <View style={styles.recovery}>
                        <Button testID="reset-cvs" label="Reset modifiers" variant="secondary" onPress={() => apply(resetCombatValues(state, character))} />
                    </View>
                </Card>
            </Section>

            <Section title="Phases">
                <Card>
                    <Text variant="caption" muted style={styles.phaseHint}>
                        {`SPD ${heroDesignerCharacter.getCharacteristicTotal('SPD', character)} · DEX ${heroDesignerCharacter.getCharacteristicTotal('DEX', character)} · tap = acted, hold = aborted`}
                    </Text>
                    <View style={styles.phaseChart}>
                        {phases.map((phase) => (
                            <PhaseChip
                                key={phase}
                                phase={phase}
                                flags={state.phases[String(phase)]}
                                onToggleUsed={() => apply(togglePhaseUsed(state, String(phase)))}
                                onToggleAborted={() => apply(togglePhaseAborted(state, String(phase)))}
                            />
                        ))}
                    </View>
                    <View style={styles.recovery}>
                        <Button testID="new-turn" label="New Turn" variant="secondary" onPress={() => apply(startNewTurn(state))} />
                    </View>
                </Card>
            </Section>

            <Section title="Status Effects">
                <Card>
                    {state.statuses.length === 0 ? (
                        <Text muted>No active status effects.</Text>
                    ) : (
                        state.statuses.map((status, index) => (
                            <StatusRow
                                key={index}
                                text={describeStatus(status)}
                                index={index}
                                onEdit={() => setEditing({status, index})}
                                onRemove={() => apply(removeStatus(state, index))}
                            />
                        ))
                    )}
                    <View style={styles.statusActions}>
                        <View style={styles.grow}>
                            <Button testID="add-status" label="Add" onPress={() => setEditing({status: {name: 'Aid', label: ''}, index: null})} />
                        </View>
                        {state.statuses.length > 0 ? (
                            <View style={styles.grow}>
                                <Button testID="clear-statuses" label="Clear All" variant="secondary" onPress={() => apply(clearStatuses(state))} />
                            </View>
                        ) : null}
                    </View>
                </Card>
            </Section>

            <Section title="Defenses">
                <Card>
                    {combat.defenses.map((stat) => (
                        <StaticRow key={stat.label} label={stat.label} value={stat.value} />
                    ))}
                    <Text variant="caption" muted style={styles.phaseHint}>
                        Shown as total / resistant
                    </Text>
                </Card>
            </Section>

            {combat.movement.length > 0 ? (
                <Section title="Movement">
                    <Card>
                        {combat.movement.map((row) => (
                            <MovementRowView key={row.name} row={row} onSpend={() => spendEnd(row.endurance)} />
                        ))}
                    </Card>
                </Section>
            ) : null}

            <StatusDialog initial={editing?.status ?? null} onApply={applyStatus} onClose={() => setEditing(null)} />
        </View>
    );
}

function MovementRowView({row, onSpend}: {row: MovementRow; onSpend: () => void}): React.JSX.Element {
    const theme = useTheme();

    return (
        <View style={styles.staticRow}>
            <Text muted>{row.name}</Text>
            <View style={styles.moveRight}>
                <Text>{`${row.combat}  ·  NC ${row.nonCombat}`}</Text>
                <SpendChip testID={`spend-end-move-${row.name}`} accessibilityLabel={`Spend ${row.endurance} END to move with ${row.name}`} onSpend={onSpend}>
                    <Text variant="caption" color={theme.colors.primary}>{`END ${row.endurance}`}</Text>
                </SpendChip>
            </View>
        </View>
    );
}

function StatusRow({text, index, onEdit, onRemove}: {text: string; index: number; onEdit: () => void; onRemove: () => void}): React.JSX.Element {
    const theme = useTheme();

    return (
        <View style={styles.statusRow}>
            <Text style={styles.statusText}>{text}</Text>
            <Pressable testID={`edit-status-${index}`} accessibilityRole="button" onPress={onEdit}>
                <Text variant="caption" color={theme.colors.primary}>
                    Edit
                </Text>
            </Pressable>
            <Pressable testID={`remove-status-${index}`} accessibilityRole="button" onPress={onRemove}>
                <Text variant="caption" color={theme.colors.danger}>
                    Remove
                </Text>
            </Pressable>
        </View>
    );
}

function CombatValueRowView({row, value, onAdjust, onRoll}: {row: CombatValueRow; value: number; onAdjust: (delta: number) => void; onRoll: RollHandler}): React.JSX.Element {
    const theme = useTheme();
    const request: RollRequest = {mode: 'hit', ocv: value, dcv: 3, label: row.label};

    return (
        <View style={styles.cvRow}>
            <Text style={styles.cvLabel}>{row.label}</Text>
            <Stepper testID={`cv-dec-${row.key}`} label="–" onPress={() => onAdjust(-1)} />
            {row.attack ? (
                <Pressable testID={`roll-cv-${row.key}`} style={styles.cvValue} onPress={() => onRoll(request, false)} onLongPress={() => onRoll(request, true)}>
                    <Text variant="title" color={theme.colors.primary}>
                        {value}
                    </Text>
                </Pressable>
            ) : (
                <View style={styles.cvValue}>
                    <Text variant="title">{value}</Text>
                </View>
            )}
            <Stepper testID={`cv-inc-${row.key}`} label="+" onPress={() => onAdjust(1)} />
        </View>
    );
}

function Stepper({label, onPress, testID}: {label: string; onPress: () => void; testID: string}): React.JSX.Element {
    const theme = useTheme();
    const style: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.sm};

    return (
        <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={[styles.stepper, style]}>
            <Text variant="title">{label}</Text>
        </Pressable>
    );
}

function PhaseChip({phase, flags, onToggleUsed, onToggleAborted}: {phase: number; flags: {used: boolean; aborted: boolean}; onToggleUsed: () => void; onToggleAborted: () => void}): React.JSX.Element {
    const theme = useTheme();
    const background = flags.aborted ? theme.colors.danger : flags.used ? theme.colors.active : theme.colors.surfaceAlt;
    const foreground = flags.aborted || flags.used ? theme.colors.onPrimary : theme.colors.text;
    const chip: ViewStyle = {backgroundColor: background, borderRadius: theme.radius.pill};

    return (
        <Pressable testID={`phase-${phase}`} accessibilityRole="button" onPress={onToggleUsed} onLongPress={onToggleAborted} style={[styles.chip, chip]}>
            <Text variant="label" color={foreground}>
                {phase}
            </Text>
        </Pressable>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
    return (
        <View style={styles.section}>
            <Text variant="label" muted>
                {title.toUpperCase()}
            </Text>
            {children}
        </View>
    );
}

function StaticRow({label, value}: {label: string; value: string}): React.JSX.Element {
    return (
        <View style={styles.staticRow}>
            <Text muted>{label}</Text>
            <Text>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    tracker: {
        rowGap: 16,
    },
    section: {
        rowGap: 6,
    },
    vitalRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        columnGap: 12,
        paddingVertical: 4,
    },
    vitalField: {
        flex: 1,
    },
    recovery: {
        marginTop: 12,
    },
    spendHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        columnGap: 12,
    },
    spendRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        columnGap: 8,
        marginTop: 8,
    },
    cvRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 12,
        paddingVertical: 4,
    },
    cvLabel: {
        flex: 1,
    },
    cvValue: {
        minWidth: 44,
        alignItems: 'center',
    },
    stepper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseHint: {
        paddingBottom: 10,
    },
    phaseChart: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        minWidth: 40,
        height: 40,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    staticRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    moveRight: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 14,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 12,
        paddingVertical: 6,
    },
    statusText: {
        flex: 1,
    },
    statusActions: {
        flexDirection: 'row',
        columnGap: 12,
        marginTop: 12,
    },
    grow: {
        flex: 1,
    },
});
