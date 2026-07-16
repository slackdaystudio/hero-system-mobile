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

/**
 * Rolling a random character (docs/RANDOM_CHARACTER.md).
 *
 * This replaces a "Generate" link that rolled, saved and dropped an `Alert` on you. It had outgrown
 * the shape: there are two editions to choose between now, and a roll is a thing worth watching
 * arrive.
 *
 * Three states, and the middle one is deliberate:
 *
 * ```
 * choosing  edition pills          [Cancel] [Generate]
 * rolling   a bar, for 3s flat     [Cancel]
 * revealed  "You are an Ice ..."   [Roll Again] [View]
 * ```
 *
 * **The 3s hold is a floor, not a wait.** The roll itself is synchronous and takes ~45ms, so the
 * character exists before the bar has moved; the bar is not reporting progress and does not pretend
 * to. It is there because a reveal you waited for lands differently from one that blinks into
 * existence. That makes it pure drama, which is why {@link Settings.showAnimations} skips both the
 * bar and the hold rather than just the bar — someone who turned animations off is not asking for
 * a slower reveal.
 *
 * **Nothing is saved until "View".** Rolling used to write the character before the player had read
 * a word of it, so dismissing the dialog left one behind; "Roll Again" would have turned that into
 * a pile. `roll` is pure and `keep` is the only write — see `GenerateProvider`.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Modal, Pressable, StyleSheet, View, type ViewStyle} from 'react-native';
import {LOW_POWERED_5E, revealSentence, STANDARD_6E, type GeneratedCharacter, type PowerLevel} from 'core/random';
import {Button, SegmentedControl, Text, type Segment} from 'app/components';
import {useKeepCharacter, useRollCharacter, type GenerateResult} from 'app/providers/GenerateProvider';
import {useSettings} from 'app/providers/SettingsProvider';
import {useTheme} from 'app/theme';

/** How long the bar runs. Phil's "3s or so", and the only number here that is a matter of taste. */
export const ROLL_DURATION_MS = 3000;

/**
 * The levels a player may roll at — one per edition, which is why the pills say "5E" and "6E".
 *
 * `POWER_LEVELS` has four; the other two (`5e-standard`, `6e-low`) have no authored archetypes or
 * powersets, so offering them would be offering a crash. When a second level for an edition is
 * authored this stops being a two-pill control, and that is a real design decision rather than a
 * list to extend quietly.
 */
const LEVELS: readonly PowerLevel[] = [LOW_POWERED_5E, STANDARD_6E];

const SEGMENTS: Segment[] = LEVELS.map((level) => ({value: level.id, label: level.edition.toUpperCase()}));

type Phase = {kind: 'choosing'} | {kind: 'rolling'; rolled: GeneratedCharacter} | {kind: 'revealed'; rolled: GeneratedCharacter};

export interface GenerateDialogProps {
    visible: boolean;
    /** Fired when the player keeps a roll — the character is saved by then. */
    onGenerated: (result: GenerateResult) => void;
    onClose: () => void;
}

export function GenerateDialog({visible, onGenerated, onClose}: GenerateDialogProps): React.JSX.Element {
    const theme = useTheme();
    const {settings} = useSettings();
    const roll = useRollCharacter();
    const keep = useKeepCharacter();

    // The player's edition preference is already on record, and it is the same question. It only
    // seeds the pills — changing them here is not a settings change.
    const [levelId, setLevelId] = useState(() => (settings.useFifthEdition ? LOW_POWERED_5E.id : STANDARD_6E.id));
    const [phase, setPhase] = useState<Phase>({kind: 'choosing'});
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const level = useMemo(() => LEVELS.find((candidate) => candidate.id === levelId) ?? STANDARD_6E, [levelId]);

    const progress = useRef(new Animated.Value(0)).current;
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timer.current !== null) {
            clearTimeout(timer.current);
            timer.current = null;
        }
    }, []);

    // A dialog closed mid-roll must not reveal into a corpse: the timeout outlives the unmount.
    useEffect(() => clearTimer, [clearTimer]);

    // Reopening starts over. Without this, a dialog cancelled at "revealed" reopens still showing
    // the character it was told to forget.
    useEffect(() => {
        if (!visible) {
            clearTimer();
            setPhase({kind: 'choosing'});
            setError(null);
            setBusy(false);
        }
    }, [visible, clearTimer]);

    const generate = useCallback(() => {
        setError(null);

        let rolled: GeneratedCharacter;

        try {
            // Synchronous and pure. Rolling *before* the bar rather than after means a level with
            // no data fails here, in front of the player, instead of 3s into a lie.
            rolled = roll(level);
        } catch (thrown: unknown) {
            setError(thrown instanceof Error ? thrown.message : 'That character could not be rolled.');
            return;
        }

        if (!settings.showAnimations) {
            setPhase({kind: 'revealed', rolled});
            return;
        }

        setPhase({kind: 'rolling', rolled});
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: ROLL_DURATION_MS,
            // Width is not a transform, so this cannot run on the UI thread. It is a 3s linear fill
            // with nothing competing for the JS thread — the roll has already finished.
            useNativeDriver: false,
        }).start();

        clearTimer();
        timer.current = setTimeout(() => setPhase({kind: 'revealed', rolled}), ROLL_DURATION_MS);
    }, [roll, level, settings.showAnimations, progress, clearTimer]);

    const view = useCallback(() => {
        if (phase.kind !== 'revealed' || busy) {
            return;
        }

        setBusy(true);
        keep(phase.rolled)
            .then(onGenerated, (thrown: unknown) => setError(thrown instanceof Error ? thrown.message : 'That character could not be saved.'))
            .finally(() => setBusy(false));
    }, [phase, busy, keep, onGenerated]);

    const cancel = useCallback(() => {
        clearTimer();
        onClose();
    }, [clearTimer, onClose]);

    const card: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg};

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={cancel}>
            <Pressable testID="generate-backdrop" style={styles.backdrop} onPress={cancel}>
                <Pressable style={[styles.card, card]} onPress={() => undefined}>
                    <Text variant="subtitle">Random Character</Text>

                    <SegmentedControl
                        segments={SEGMENTS}
                        value={levelId}
                        onChange={(value) => {
                            // Mid-roll the pills are hidden, and at "revealed" a new edition means a
                            // new character — so this only ever fires while choosing.
                            setLevelId(value);
                            setPhase({kind: 'choosing'});
                        }}
                    />

                    <View style={styles.pane}>
                        <Pane phase={phase} level={level} progress={progress} error={error} />
                    </View>

                    <View style={styles.actions}>
                        <View style={styles.grow}>
                            <Button
                                testID="generate-cancel"
                                label={phase.kind === 'revealed' ? 'Roll Again' : 'Cancel'}
                                variant="secondary"
                                disabled={busy}
                                onPress={phase.kind === 'revealed' ? generate : cancel}
                            />
                        </View>
                        {phase.kind !== 'rolling' && (
                            <View style={styles.grow}>
                                <Button
                                    testID="generate-confirm"
                                    label={phase.kind === 'revealed' ? 'View' : 'Generate'}
                                    disabled={busy}
                                    onPress={phase.kind === 'revealed' ? view : generate}
                                />
                            </View>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/** The content pane: what the player is choosing, watching, or reading. */
function Pane({phase, level, progress, error}: {phase: Phase; level: PowerLevel; progress: Animated.Value; error: string | null}): React.JSX.Element {
    const theme = useTheme();

    if (error !== null) {
        return (
            <Text testID="generate-error" variant="body" color={theme.colors.danger}>
                {error}
            </Text>
        );
    }

    if (phase.kind === 'rolling') {
        return <RollingBar progress={progress} />;
    }

    if (phase.kind === 'revealed') {
        const {recipe, spent} = phase.rolled;

        return (
            <View style={styles.reveal}>
                <Text testID="generate-reveal" variant="title" style={styles.centered}>
                    {revealSentence(recipe)}
                </Text>
                <Text testID="generate-points" variant="caption" muted style={styles.centered}>
                    {`${recipe.powerset} · ${spent} of ${phase.rolled.level.total} points`}
                </Text>
            </View>
        );
    }

    return (
        <Text testID="generate-level" variant="body" muted style={styles.centered}>
            {`${level.name} · ${level.total} points`}
        </Text>
    );
}

/**
 * The 3s bar.
 *
 * Owned rather than a Lottie or a third-party spinner — it is two Views and an interpolation, and
 * the app draws its own icons for the same reason (see the design-system decision in the theme).
 */
function RollingBar({progress}: {progress: Animated.Value}): React.JSX.Element {
    const theme = useTheme();
    const width = progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']});

    return (
        <View style={styles.reveal}>
            <View testID="generate-progress" style={[styles.track, {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill}]}>
                <Animated.View style={[styles.fill, {width, backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill}]} />
            </View>
            <Text variant="caption" muted style={styles.centered}>
                Rolling…
            </Text>
        </View>
    );
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
    // Fixed, so the card doesn't jump between the three states.
    pane: {
        minHeight: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reveal: {
        width: '100%',
        rowGap: 12,
    },
    centered: {
        textAlign: 'center',
    },
    track: {
        height: 8,
        width: '100%',
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
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
