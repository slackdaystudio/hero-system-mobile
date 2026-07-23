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
 * Three states:
 *
 * ```
 * choosing  edition pills                     [Cancel]     [Generate]
 * dealing   a bar, ~3s                        [Cancel]
 * dealt     five cards, tap one               [Roll Again] [View]
 * ```
 *
 * **A hand, not a character.** Four players rolling on four phones cannot coordinate, so no
 * distribution can promise a table anything — deal five and let the player keep one, and the
 * coordination happens at the table instead: "I've got a Brick and a Mentalist, which do we need?"
 * A bad draw also stops mattering. See `core/random/hand.ts` for why weighting the archetypes was
 * the wrong lever (briefly: uniform is the minimum-collision distribution, so weighting makes two
 * players clashing *more* likely).
 *
 * **Nothing is saved until "View".** `deal` is pure and `keep` is the only write, so the four cards
 * the player didn't take leave no trace — there is nothing to clean up because nothing was created.
 *
 * **The 3s hold is a floor on the whole deal, not a wait bolted on after it.** Dealing five is real
 * work now (~200ms on a dev machine, more on a phone), so the bar runs for whatever is left of the
 * three seconds. It is still mostly theatre, which is why {@link Settings.showAnimations} skips the
 * hold as well as the bar — someone who turned animations off is not asking for a slower reveal.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Modal, Pressable, ScrollView, StyleSheet, View, type ViewStyle} from 'react-native';
import {describeBuild, LOW_POWERED_5E, STANDARD_6E, type Candidate, type PowerLevel} from 'core/random';
import {Button, SegmentedControl, Text, type Segment} from 'app/components';
import {useDealHand, useKeepCharacter, type GenerateResult} from 'app/providers/GenerateProvider';
import {useSettings} from 'app/providers/SettingsProvider';
import {useTheme} from 'app/theme';

/** The floor on a deal. Phil's "3s or so", and the only number here that is a matter of taste. */
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

type Phase = {kind: 'choosing'} | {kind: 'dealing'} | {kind: 'dealt'; hand: Candidate[]; selected: number | null};

export interface GenerateDialogProps {
    visible: boolean;
    /** Fired when the player keeps a card — the character is saved by then. */
    onGenerated: (result: GenerateResult) => void;
    onClose: () => void;
}

export function GenerateDialog({visible, onGenerated, onClose}: GenerateDialogProps): React.JSX.Element {
    const theme = useTheme();
    const {settings} = useSettings();
    const deal = useDealHand();
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

    // The timeout outlives the unmount, and a dialog closed mid-deal must not deal into a corpse.
    useEffect(() => clearTimer, [clearTimer]);

    // Reopening starts over. Without this, a dialog cancelled at "dealt" reopens still showing the
    // hand it was told to forget.
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

        const started = Date.now();
        let hand: Candidate[];

        try {
            // Synchronous and pure. Dealing *before* the bar rather than after means a level with no
            // data fails here, in front of the player, instead of 3s into a lie.
            hand = deal(level);
        } catch (thrown: unknown) {
            setError(thrown instanceof Error ? thrown.message : 'Those characters could not be rolled.');
            return;
        }

        if (!settings.showAnimations) {
            setPhase({kind: 'dealt', hand, selected: null});
            return;
        }

        // The hold is a floor on the whole deal: the dealing already spent some of the three
        // seconds, so the bar runs for what's left rather than adding three more on top.
        const remaining = Math.max(0, ROLL_DURATION_MS - (Date.now() - started));

        setPhase({kind: 'dealing'});
        progress.setValue(0);
        Animated.timing(progress, {
            toValue: 1,
            duration: remaining,
            // Width is not a transform, so this cannot run on the UI thread. The deal has already
            // finished by now, so nothing is competing for the JS thread while it runs.
            useNativeDriver: false,
        }).start();

        clearTimer();
        timer.current = setTimeout(() => setPhase({kind: 'dealt', hand, selected: null}), remaining);
    }, [deal, level, settings.showAnimations, progress, clearTimer]);

    const view = useCallback(() => {
        if (phase.kind !== 'dealt' || phase.selected === null || busy) {
            return;
        }

        setBusy(true);
        keep(phase.hand[phase.selected].rolled)
            .then(onGenerated, (thrown: unknown) => setError(thrown instanceof Error ? thrown.message : 'That character could not be saved.'))
            .finally(() => setBusy(false));
    }, [phase, busy, keep, onGenerated]);

    const cancel = useCallback(() => {
        clearTimer();
        onClose();
    }, [clearTimer, onClose]);

    const select = useCallback((index: number) => setPhase((prev) => (prev.kind === 'dealt' ? {...prev, selected: index} : prev)), []);

    const dealt = phase.kind === 'dealt';
    const card: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg};

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={cancel}>
            {/* accessible={false} on both: a Pressable that is itself an accessibility element
                collapses its whole subtree on iOS, hiding the dialog's content (title, pills,
                buttons) from VoiceOver and UI automation. Touch handling is unaffected, so the
                backdrop still dismisses and the card still swallows taps. */}
            <Pressable testID="generate-backdrop" style={styles.backdrop} onPress={cancel} accessible={false}>
                <Pressable style={[styles.card, card]} onPress={() => undefined} accessible={false}>
                    <Text variant="subtitle">{dealt ? 'Pick one' : 'Random Character'}</Text>

                    <SegmentedControl
                        segments={SEGMENTS}
                        value={levelId}
                        onChange={(value) => {
                            // A different edition means a different hand — keeping the old cards on
                            // screen would let the player take one from the edition they just left.
                            setLevelId(value);
                            setPhase({kind: 'choosing'});
                        }}
                    />

                    <View style={styles.pane}>
                        <Pane phase={phase} level={level} progress={progress} error={error} onSelect={select} />
                    </View>

                    <View style={styles.actions}>
                        <View style={styles.grow}>
                            <Button
                                testID="generate-cancel"
                                label={dealt ? 'Roll Again' : 'Cancel'}
                                variant="secondary"
                                disabled={busy}
                                onPress={dealt ? generate : cancel}
                            />
                        </View>
                        {phase.kind !== 'dealing' && (
                            <View style={styles.grow}>
                                <Button
                                    testID="generate-confirm"
                                    label={dealt ? 'View' : 'Generate'}
                                    // Nothing is chosen yet, so there is nothing to view.
                                    disabled={busy || (dealt && phase.selected === null)}
                                    onPress={dealt ? view : generate}
                                />
                            </View>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/** The content pane: what the player is choosing, watching, or picking from. */
function Pane({
    phase,
    level,
    progress,
    error,
    onSelect,
}: {
    phase: Phase;
    level: PowerLevel;
    progress: Animated.Value;
    error: string | null;
    onSelect: (index: number) => void;
}): React.JSX.Element {
    const theme = useTheme();

    if (error !== null) {
        return (
            <Text testID="generate-error" variant="body" color={theme.colors.danger}>
                {error}
            </Text>
        );
    }

    if (phase.kind === 'dealing') {
        return <DealingBar progress={progress} />;
    }

    if (phase.kind === 'dealt') {
        return (
            <ScrollView style={styles.hand} contentContainerStyle={styles.handContent}>
                {phase.hand.map((candidate, index) => (
                    <CandidateCard
                        key={candidate.rolled.recipe.archetype}
                        candidate={candidate}
                        index={index}
                        selected={phase.selected === index}
                        onSelect={onSelect}
                    />
                ))}
            </ScrollView>
        );
    }

    return (
        <Text testID="generate-level" variant="body" muted style={styles.centered}>
            {`${level.name} · ${level.total} points`}
        </Text>
    );
}

/**
 * One option, with enough of its numbers to argue about.
 *
 * The stat line is read off the built character (`Candidate.stats`) rather than the recipe — the
 * point of a hand is choosing, and "a Fire Brick Soldier" alone doesn't tell a new player what
 * they'd be signing up for. These are the Rule of X's own inputs, so they cost nothing to obtain.
 */
function CandidateCard({
    candidate,
    index,
    selected,
    onSelect,
}: {
    candidate: Candidate;
    index: number;
    selected: boolean;
    onSelect: (index: number) => void;
}): React.JSX.Element {
    const theme = useTheme();
    const {recipe, spent, level} = candidate.rolled;
    const {dc, spd, ocv, dcv, def} = candidate.stats;

    const chrome: ViewStyle = {
        backgroundColor: selected ? theme.colors.active : theme.colors.surfaceAlt,
        borderColor: selected ? theme.colors.primary : 'transparent',
        borderRadius: theme.radius.md,
    };

    return (
        <Pressable
            testID={`candidate-${index}`}
            accessibilityRole="button"
            accessibilityState={{selected}}
            onPress={() => onSelect(index)}
            style={[styles.candidate, chrome]}>
            <Text testID={`candidate-${index}-name`} variant="body">
                {/* Capitalised: it opens the card, where the reveal sentence used to open a line. */}
                {capitalise(describeBuild(recipe))}
            </Text>
            <Text testID={`candidate-${index}-set`} variant="caption" muted>
                {`${recipe.powerset} · ${spent} of ${level.total} points`}
            </Text>
            <Text testID={`candidate-${index}-stats`} variant="caption" color={theme.colors.primary}>
                {`${dc}d6 · SPD ${spd} · OCV ${ocv} / DCV ${dcv} · DEF ${def}`}
            </Text>
        </Pressable>
    );
}

const capitalise = (phrase: string): string => phrase.charAt(0).toUpperCase() + phrase.slice(1);

/**
 * The bar.
 *
 * Owned rather than a Lottie or a third-party spinner — it is two Views and an interpolation, and
 * the app draws its own icons for the same reason.
 */
function DealingBar({progress}: {progress: Animated.Value}): React.JSX.Element {
    const theme = useTheme();
    const width = progress.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']});

    return (
        <View style={styles.reveal}>
            <View testID="generate-progress" style={[styles.track, {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.pill}]}>
                <Animated.View style={[styles.fill, {width, backgroundColor: theme.colors.primary, borderRadius: theme.radius.pill}]} />
            </View>
            <Text variant="caption" muted style={styles.centered}>
                Dealing…
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
    // Tall enough for the hand, floored so the card doesn't jump between the three states.
    pane: {
        minHeight: 120,
        maxHeight: 380,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hand: {
        width: '100%',
    },
    handContent: {
        rowGap: 8,
    },
    candidate: {
        padding: 12,
        rowGap: 2,
        borderWidth: 2,
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
