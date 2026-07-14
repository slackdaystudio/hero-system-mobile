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
import {ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, View, type ViewStyle} from 'react-native';
import type {LastRoll} from 'core/dice';
import type {Character} from 'core/ports';
import type {Obj} from 'core/traits';
import {Button, Card, Screen, SegmentedControl, Text, type Segment} from 'app/components';
import {characteristicRollRequest, describeRoll, performRoll, recordRoll, traitRollRequest, type RollRequest} from 'app/dice/rollRequest';
import {useDieRoller} from 'app/providers/DiceProvider';
import {useRepositories} from 'app/providers/RepositoriesProvider';
import {useTheme} from 'app/theme';
import {asHeroCharacter, buildCharacterSheet, buildCombatSheet, type CharacterSheet, type CombatSheet, type SheetCharacteristic, type SheetTrait} from './characterSheet';
import {CombatTracker} from './CombatTracker';

type LoadState = {status: 'loading'} | {status: 'ready'; character: Character} | {status: 'not-found'} | {status: 'error'; message: string};

type RollFlashState = {request: RollRequest; title: string; lines: string[]; dice: number[]};

type RollHandler = (request: RollRequest, immediate: boolean) => void;

export interface CharacterDetailScreenProps {
    characterId: string;
    /** Fired once the character loads — the navigator uses it to set the header title. */
    onReady?: (character: Character) => void;
    /** Tap a roll → open the dice roller pre-filled. Long-press rolls it inline. */
    onRollRequest?: (request: RollRequest) => void;
}

const AVATAR = 96;

export function CharacterDetailScreen({characterId, onReady, onRollRequest}: CharacterDetailScreenProps): React.JSX.Element {
    const {characters: repository, statistics} = useRepositories();
    const roller = useDieRoller();
    const theme = useTheme();
    const [state, setState] = useState<LoadState>({status: 'loading'});

    const onReadyRef = useRef(onReady);
    onReadyRef.current = onReady;

    const load = useCallback(async () => {
        try {
            const character = await repository.get(characterId);
            if (character === null) {
                setState({status: 'not-found'});
                return;
            }
            setState({status: 'ready', character});
            onReadyRef.current?.(character);
        } catch (error) {
            setState({status: 'error', message: error instanceof Error ? error.message : 'Failed to load character'});
        }
    }, [repository, characterId]);

    useEffect(() => {
        load();
    }, [load]);

    // Decorate the whole sheet once per character (engine work), not per render.
    const character = state.status === 'ready' ? state.character : null;
    const sheet = useMemo<{hero: Obj; character: CharacterSheet; combat: CombatSheet} | null>(() => {
        if (character === null) {
            return null;
        }
        const hero = asHeroCharacter(character.document);
        return hero === null ? null : {hero, character: buildCharacterSheet(hero), combat: buildCombatSheet(hero)};
    }, [character]);

    const [flash, setFlash] = useState<RollFlashState | null>(null);

    const rollNow = useCallback(
        async (request: RollRequest) => {
            const result: LastRoll = performRoll(roller, request);
            setFlash({request, ...describeRoll(result)});
            const stats = await statistics.get();
            await statistics.save(recordRoll(stats, result));
        },
        [roller, statistics],
    );

    const handleRoll = useCallback<RollHandler>(
        (request, immediate) => {
            if (immediate) {
                rollNow(request);
            } else {
                onRollRequest?.(request);
            }
        },
        [rollNow, onRollRequest],
    );

    if (state.status === 'loading') {
        return (
            <Screen style={styles.centered}>
                <ActivityIndicator testID="loading" color={theme.colors.primary} />
            </Screen>
        );
    }

    if (state.status === 'not-found') {
        return (
            <Screen style={styles.centered}>
                <Text variant="subtitle">Character not found</Text>
            </Screen>
        );
    }

    if (state.status === 'error') {
        return (
            <Screen style={styles.centered}>
                <Text muted>{state.message}</Text>
            </Screen>
        );
    }

    const loaded = state.character;
    const avatarStyle: ViewStyle = {backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md};
    const content: ViewStyle = {padding: theme.spacing(4), rowGap: theme.spacing(4)};

    return (
        <Screen>
            <ScrollView contentContainerStyle={content}>
                <View style={styles.header}>
                    <View style={[styles.avatar, avatarStyle]}>
                        {loaded.portraitUri ? (
                            <Image testID="portrait" source={{uri: loaded.portraitUri}} style={styles.avatarImage} />
                        ) : (
                            <Text variant="title" muted>
                                {(loaded.name.trim()[0] ?? '?').toUpperCase()}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerText}>
                        <Text variant="title">{loaded.name}</Text>
                        <Text variant="caption" muted>
                            {loaded.player ? `${loaded.edition} · ${loaded.player}` : loaded.edition}
                        </Text>
                        {loaded.isActive ? (
                            <Text variant="caption" color={theme.colors.active}>
                                Active
                            </Text>
                        ) : null}
                    </View>
                </View>

                {sheet !== null ? (
                    <SheetTabs sheet={sheet.character} combat={sheet.combat} hero={sheet.hero} characterId={characterId} onRoll={handleRoll} />
                ) : (
                    <BasicBody character={loaded} />
                )}
            </ScrollView>
            <RollFlash flash={flash} onClose={() => setFlash(null)} onRollAgain={rollNow} />
        </Screen>
    );
}

type SheetTab = 'character' | 'combat';

const SHEET_TABS: Segment[] = [
    {value: 'character', label: 'Character'},
    {value: 'combat', label: 'Combat'},
];

function SheetTabs({
    sheet,
    combat,
    hero,
    characterId,
    onRoll,
}: {
    sheet: CharacterSheet;
    combat: CombatSheet;
    hero: Obj;
    characterId: string;
    onRoll: RollHandler;
}): React.JSX.Element {
    const [tab, setTab] = useState<SheetTab>('character');

    return (
        <View style={styles.tabbed}>
            <SegmentedControl segments={SHEET_TABS} value={tab} onChange={(value) => setTab(value as SheetTab)} />
            {tab === 'character' ? <SheetBody sheet={sheet} onRoll={onRoll} /> : <CombatTracker character={hero} characterId={characterId} combat={combat} onRoll={onRoll} />}
        </View>
    );
}

function SheetBody({sheet, onRoll}: {sheet: CharacterSheet; onRoll: RollHandler}): React.JSX.Element {
    return (
        <>
            <Section title="Characteristics">
                {sheet.characteristics.map((characteristic, index) => (
                    <CharacteristicRow key={index} characteristic={characteristic} onRoll={onRoll} />
                ))}
            </Section>
            {sheet.sections.map((section) => (
                <Section key={section.title} title={section.title}>
                    {section.traits.map((trait, index) => (
                        <TraitRow key={index} trait={trait} onRoll={onRoll} />
                    ))}
                </Section>
            ))}
        </>
    );
}

function CharacteristicRow({characteristic, onRoll}: {characteristic: SheetCharacteristic; onRoll: RollHandler}): React.JSX.Element {
    const theme = useTheme();
    const request = characteristicRollRequest(characteristic.roll, characteristic.name);

    return (
        <View style={styles.charRow}>
            <Text style={styles.charName}>{characteristic.name}</Text>
            <Text style={styles.charTotal}>{String(characteristic.total)}</Text>
            {request !== null ? (
                <Pressable testID={`roll-char-${characteristic.name}`} style={styles.charRoll} onPress={() => onRoll(request, false)} onLongPress={() => onRoll(request, true)}>
                    <Text variant="caption" color={theme.colors.primary} style={styles.rollText}>
                        {characteristic.roll}
                    </Text>
                </Pressable>
            ) : (
                <Text variant="caption" muted style={[styles.charRoll, styles.rollText]}>
                    {characteristic.roll ?? ''}
                </Text>
            )}
            <Text variant="caption" muted style={styles.charCost}>
                {`${characteristic.cost}`}
            </Text>
        </View>
    );
}

function TraitRow({trait, onRoll}: {trait: SheetTrait; onRoll: RollHandler}): React.JSX.Element {
    const theme = useTheme();
    const indent: ViewStyle = {paddingLeft: trait.depth * 16};
    const request = traitRollRequest(trait.roll, trait.label);

    return (
        <View style={[styles.trait, indent]}>
            <View style={styles.traitHead}>
                <Text style={styles.traitLabel}>{trait.label}</Text>
                {trait.roll !== null && request !== null ? (
                    <Pressable testID={`roll-trait-${trait.label}`} onPress={() => onRoll(request, false)} onLongPress={() => onRoll(request, true)}>
                        <Text variant="caption" color={theme.colors.primary}>
                            {trait.roll.roll}
                        </Text>
                    </Pressable>
                ) : null}
                <Text variant="caption" muted style={styles.traitCost}>
                    {`${trait.realCost}`}
                </Text>
            </View>
            {trait.definition.length > 0 ? (
                <Text variant="caption" muted>
                    {trait.definition}
                </Text>
            ) : null}
        </View>
    );
}

function RollFlash({flash, onClose, onRollAgain}: {flash: RollFlashState | null; onClose: () => void; onRollAgain: (request: RollRequest) => void}): React.JSX.Element | null {
    const theme = useTheme();
    if (flash === null) {
        return null;
    }
    const card: ViewStyle = {backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg};

    return (
        <Modal transparent visible animationType="fade" onRequestClose={onClose}>
            <Pressable testID="flash-backdrop" style={styles.backdrop} onPress={onClose}>
                <Pressable style={[styles.modalCard, card]} onPress={() => undefined}>
                    <Text variant="subtitle">{flash.title}</Text>
                    {flash.lines.map((line, index) => (
                        <Text key={index} variant="title">
                            {line}
                        </Text>
                    ))}
                    <Text variant="caption" muted>
                        {flash.dice.join('  ·  ')}
                    </Text>
                    <View style={styles.modalActions}>
                        <View style={styles.grow}>
                            <Button label="Roll again" variant="secondary" onPress={() => onRollAgain(flash.request)} />
                        </View>
                        <View style={styles.grow}>
                            <Button testID="flash-close" label="Close" onPress={onClose} />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const asObjects = (value: unknown): Array<Record<string, unknown>> =>
    Array.isArray(value) ? value.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null) : [];

/** Fallback for thin/legacy documents that aren't a processed HeroDesigner character. */
function BasicBody({character}: {character: Character}): React.JSX.Element {
    const characteristics = asObjects(character.document.characteristics);
    const powers = asObjects(character.document.powers);

    return (
        <>
            <Section title="Details">
                <Row label="Edition" value={character.edition} />
                <Row label="Slot" value={character.slot === null ? 'Unassigned' : `Slot ${character.slot + 1}`} />
                <Row label="File" value={character.filename ?? '—'} />
            </Section>
            {characteristics.length > 0 ? (
                <Section title="Characteristics">
                    {characteristics.map((entry, index) => (
                        <Row key={index} label={String(entry.name ?? entry.shortName ?? entry.xmlid ?? '?')} value={entry.value === undefined ? '—' : String(entry.value)} />
                    ))}
                </Section>
            ) : null}
            {powers.length > 0 ? (
                <Section title="Powers">
                    {powers.map((power, index) => (
                        <Text key={index}>{String(power.name ?? power.alias ?? power.xmlid ?? 'Power')}</Text>
                    ))}
                </Section>
            ) : null}
        </>
    );
}

function Section({title, children}: {title: string; children: React.ReactNode}): React.JSX.Element {
    return (
        <View style={styles.section}>
            <Text variant="label" muted>
                {title.toUpperCase()}
            </Text>
            <Card>{children}</Card>
        </View>
    );
}

function Row({label, value}: {label: string; value: string}): React.JSX.Element {
    return (
        <View style={styles.row}>
            <Text muted>{label}</Text>
            <Text>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 16,
    },
    avatar: {
        width: AVATAR,
        height: AVATAR,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: AVATAR,
        height: AVATAR,
    },
    headerText: {
        flex: 1,
        rowGap: 2,
    },
    tabbed: {
        rowGap: 16,
    },
    section: {
        rowGap: 6,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    charRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 3,
        columnGap: 8,
    },
    charName: {
        flex: 1,
    },
    charTotal: {
        width: 44,
        textAlign: 'right',
        fontWeight: '600',
    },
    charRoll: {
        width: 44,
        alignItems: 'flex-end',
    },
    rollText: {
        textAlign: 'right',
    },
    charCost: {
        width: 40,
        textAlign: 'right',
    },
    trait: {
        paddingVertical: 5,
    },
    traitHead: {
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 10,
    },
    traitLabel: {
        flex: 1,
    },
    traitCost: {
        width: 44,
        textAlign: 'right',
    },
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalCard: {
        width: '100%',
        maxWidth: 340,
        padding: 20,
        rowGap: 6,
        alignItems: 'flex-start',
    },
    modalActions: {
        flexDirection: 'row',
        columnGap: 12,
        alignSelf: 'stretch',
        marginTop: 12,
    },
    grow: {
        flex: 1,
    },
});
