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
 * Authoring a character (docs/CHARACTER_AUTHORING.md).
 *
 * The screen holds a draft in local state and rebuilds the character on every change, so the
 * points meter is the engine's own answer rather than a running tally kept alongside it. That
 * costs a `getCharacter` per keystroke-commit, which at this size is far cheaper than the class of
 * bug where the meter and the sheet disagree.
 *
 * **Every field here is generated from the rules templates.** The complication list, the prompts,
 * the option pickers and their costs all come from `core/authoring`'s catalogue — nothing about
 * Psychological Complications or Hunteds is written into this file. That is what makes Phase B
 * (skills, powers) mostly a matter of pointing the same components at more catalogue.
 */
import React, {useCallback, useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, View} from 'react-native';
import {
    build,
    complications as catalogueComplications,
    characteristics as catalogueCharacteristics,
    DEFAULT_BUDGET,
    emptyDraft,
    isSaveable,
    remaining,
    spendOf,
    validate,
    type AuthoredCharacter,
    type AuthoredComplication,
    type AuthoringEdition,
    type CatalogueComplication,
    type Problem,
} from 'core/authoring';
import {Button, Card, NumberField, Screen, SegmentedControl, SelectField, Text, TextField} from 'app/components';
import {useSaveAuthored} from 'app/providers/AuthoringProvider';
import {useTheme} from 'app/theme';

export interface AuthorCharacterScreenProps {
    /** Re-open an existing authored character instead of starting fresh. */
    initial?: AuthoredCharacter;
    /** The row being edited, when there is one — a save without it creates a new character. */
    characterId?: string;
    onSaved: (id: string) => void;
    onCancel: () => void;
}

const EDITIONS: Array<{value: AuthoringEdition; label: string}> = [
    {value: '6E', label: '6th Edition'},
    {value: '5E', label: '5th Edition'},
];

export function AuthorCharacterScreen({initial, characterId, onSaved, onCancel}: AuthorCharacterScreenProps): React.JSX.Element {
    const save = useSaveAuthored();
    const [draft, setDraft] = useState<AuthoredCharacter>(initial ?? emptyDraft('6E'));
    const [busy, setBusy] = useState(false);

    // The engine's answer, not a tally kept beside it. Rebuilt whenever the draft changes.
    const {spend, problems} = useMemo(() => {
        const validated = validate(draft);

        // A draft with errors may not be buildable at all — an unknown characteristic throws
        // rather than pricing at 0 — so the meter reads zero rather than crashing the screen.
        if (!isSaveable(validated)) {
            return {spend: null, problems: validated};
        }

        return {spend: spendOf(build(draft)), problems: validated};
    }, [draft]);

    const budget = DEFAULT_BUDGET[draft.edition];
    const left = spend === null ? null : remaining(spend, budget, draft.edition);

    const commit = useCallback(() => {
        // Guarded here as well as on the button. Disabling a control is a UI affordance; refusing
        // to write a character the engine cannot price is the actual rule, and it belongs on the
        // path that does the writing.
        if (busy || !isSaveable(problems)) {
            return;
        }

        setBusy(true);
        save(draft, characterId)
            .then((result) => onSaved(result.id), (error: unknown) => Alert.alert('Could not save', error instanceof Error ? error.message : 'That character could not be saved.'))
            .finally(() => setBusy(false));
    }, [busy, problems, save, draft, characterId, onSaved]);

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card>
                    <View style={styles.fields}>
                        <Text variant="label" muted>
                            {characterId === undefined ? 'NEW CHARACTER' : 'EDITING'}
                        </Text>

                        <TextField label="Name" value={draft.name} onChangeText={(name) => setDraft({...draft, name})} maxLength={60} testID="author-name" />
                        <TextField label="Player" value={draft.player} onChangeText={(player) => setDraft({...draft, player})} maxLength={60} testID="author-player" />

                        <EditionPicker draft={draft} onChange={setDraft} locked={characterId !== undefined} />
                    </View>
                </Card>

                <SpendMeter left={left} complications={spend?.complications ?? 0} limit={budget.complicationLimit} edition={draft.edition} />

                <Characteristics draft={draft} onChange={setDraft} />

                <Complications draft={draft} onChange={setDraft} />

                <Problems problems={problems} />

                <View style={styles.actions}>
                    <Button label="Cancel" onPress={onCancel} variant="secondary" testID="author-cancel" />
                    <Button label={busy ? 'Saving…' : 'Save'} onPress={commit} disabled={busy || !isSaveable(problems)} testID="author-save" />
                </View>
            </ScrollView>
        </Screen>
    );
}

/**
 * Changing edition resets the build.
 *
 * It has to: the two editions do not define the same characteristics (COM is 5E-only, the combat
 * values 6E-only) and do not share complication entries, so carrying a 6E draft into 5E would
 * produce a character referring to things that no longer exist. Locked once saved, because the
 * stored document was priced by one rulebook and re-pricing it under the other is a new character,
 * not an edit.
 */
function EditionPicker({draft, onChange, locked}: {draft: AuthoredCharacter; onChange: (draft: AuthoredCharacter) => void; locked: boolean}): React.JSX.Element | null {
    if (locked) {
        return (
            <View>
                <Text variant="caption" muted>
                    Edition
                </Text>
                <Text testID="author-edition-locked">{draft.edition === '5E' ? '5th Edition' : '6th Edition'}</Text>
            </View>
        );
    }

    return (
        <View>
            <Text variant="caption" muted>
                Edition
            </Text>
            <SegmentedControl
                segments={EDITIONS.map((edition) => ({value: edition.value, label: edition.label}))}
                value={draft.edition}
                onChange={(edition) => onChange({...emptyDraft(edition as AuthoringEdition), name: draft.name, player: draft.player})}
            />
        </View>
    );
}

/** The running total: what is spent, what is left, and how the complications count. */
function SpendMeter({
    left,
    complications,
    limit,
    edition,
}: {
    left: ReturnType<typeof remaining> | null;
    complications: number;
    limit: number;
    edition: AuthoringEdition;
}): React.JSX.Element {
    const theme = useTheme();

    if (left === null) {
        return (
            <Card>
                <Text testID="author-spend">Points unavailable until the errors below are fixed.</Text>
            </Card>
        );
    }

    return (
        <Card>
            <View style={styles.meter}>
                <Text variant="label" muted>
                    POINTS
                </Text>
                <Text testID="author-spend">
                    {left.spent} spent of {left.total}
                </Text>
                <Text color={left.left < 0 ? theme.colors.danger : theme.colors.textMuted} testID="author-remaining">
                    {left.left < 0 ? `${-left.left} over budget` : `${left.left} remaining`}
                </Text>
                <Text variant="caption" muted testID="author-complications-total">
                    {/* The edition fork stated in words, because the same number means opposite
                        things: 5E disadvantages buy points, 6E complications are a requirement. */}
                    {edition === '5E'
                        ? `Disadvantages ${complications} of ${limit} (they fund the build)`
                        : `Complications ${complications} of ${limit} required (they grant no points)`}
                </Text>
            </View>
        </Card>
    );
}

/** Characteristic spinners, one per characteristic the edition defines. */
function Characteristics({draft, onChange}: {draft: AuthoredCharacter; onChange: (draft: AuthoredCharacter) => void}): React.JSX.Element {
    const catalogue = useMemo(() => catalogueCharacteristics(draft.edition), [draft.edition]);

    const set = (key: string, text: string): void => {
        const characteristics = {...draft.characteristics};

        // An empty field means "leave it at base", which is not the same as zero — and typing over
        // a value goes through empty on the way, so this must not be an error state.
        if (text.trim() === '') {
            delete characteristics[key];
        } else {
            const total = Number.parseInt(text, 10);

            if (Number.isNaN(total)) {
                return;
            }

            characteristics[key] = total;
        }

        onChange({...draft, characteristics});
    };

    return (
        <Card>
            <Text variant="label" muted>
                CHARACTERISTICS
            </Text>
            <View style={styles.grid}>
                {catalogue.map((entry) => (
                    <View key={entry.key} style={styles.gridCell}>
                        <NumberField
                            label={`${entry.name} (${entry.base})`}
                            value={draft.characteristics[entry.key] === undefined ? '' : String(draft.characteristics[entry.key])}
                            onChangeText={(text) => set(entry.key, text)}
                            placeholder={String(entry.base)}
                            testID={`author-char-${entry.key}`}
                        />
                    </View>
                ))}
            </View>
        </Card>
    );
}

/** The complications list, every field of it generated from the template. */
function Complications({draft, onChange}: {draft: AuthoredCharacter; onChange: (draft: AuthoredCharacter) => void}): React.JSX.Element {
    const catalogue = useMemo(() => catalogueComplications(draft.edition), [draft.edition]);
    const byXmlid = useMemo(() => new Map(catalogue.map((entry) => [entry.xmlid, entry])), [catalogue]);

    const add = (display: string): void => {
        const entry = catalogue.find((candidate) => candidate.display === display);

        if (entry === undefined) {
            return;
        }

        onChange({...draft, complications: [...draft.complications, {xmlid: entry.xmlid, input: '', adders: []}]});
    };

    const update = (index: number, complication: AuthoredComplication): void =>
        onChange({...draft, complications: draft.complications.map((entry, position) => (position === index ? complication : entry))});

    const remove = (index: number): void => onChange({...draft, complications: draft.complications.filter((_, position) => position !== index)});

    return (
        <Card>
            <Text variant="label" muted>
                {draft.edition === '5E' ? 'DISADVANTAGES' : 'COMPLICATIONS'}
            </Text>

            <View style={styles.fields}>
                {draft.complications.map((complication, index) => {
                    const entry = byXmlid.get(complication.xmlid);

                    return entry === undefined ? (
                        <Text key={`${complication.xmlid}-${index}`} testID={`author-complication-unknown-${index}`}>
                            {draft.edition} has no “{complication.xmlid}”.
                        </Text>
                    ) : (
                        <ComplicationRow
                            key={`${complication.xmlid}-${index}`}
                            index={index}
                            entry={entry}
                            complication={complication}
                            onChange={(revised) => update(index, revised)}
                            onRemove={() => remove(index)}
                        />
                    );
                })}

                <SelectField
                    label="Add"
                    value=""
                    options={catalogue.map((entry) => entry.display)}
                    onChange={add}
                    hint={draft.edition === '5E' ? 'Disadvantages fund the build' : 'Complications are required, and grant no points'}
                    testID="author-add-complication"
                />
            </View>
        </Card>
    );
}

/** One complication: its free text, then a control per adder the template declares. */
function ComplicationRow({
    index,
    entry,
    complication,
    onChange,
    onRemove,
}: {
    index: number;
    entry: CatalogueComplication;
    complication: AuthoredComplication;
    onChange: (complication: AuthoredComplication) => void;
    onRemove: () => void;
}): React.JSX.Element {
    const setAdder = (xmlid: string, patch: {option?: string; text?: string; levels?: number}): void => {
        const existing = complication.adders.find((adder) => adder.xmlid === xmlid);
        const adders = existing === undefined ? [...complication.adders, {xmlid, ...patch}] : complication.adders.map((adder) => (adder.xmlid === xmlid ? {...adder, ...patch} : adder));

        onChange({...complication, adders});
    };

    return (
        <View style={styles.complication}>
            <View style={styles.complicationHead}>
                <Text variant="label">{entry.display}</Text>
                <Button label="Remove" onPress={onRemove} variant="secondary" testID={`author-remove-complication-${index}`} />
            </View>

            {entry.inputLabel === null ? null : (
                <TextField
                    label={entry.inputLabel}
                    value={complication.input}
                    onChangeText={(input) => onChange({...complication, input})}
                    maxLength={80}
                    testID={`author-complication-input-${index}`}
                />
            )}

            {entry.levels === null ? null : (
                <NumberField
                    label={entry.levels.label}
                    value={complication.levels === undefined ? '' : String(complication.levels)}
                    onChangeText={(text) => onChange({...complication, levels: text.trim() === '' ? undefined : Number.parseInt(text, 10) || 0})}
                    testID={`author-complication-levels-${index}`}
                />
            )}

            {entry.adders.map((adder) => {
                const chosen = complication.adders.find((candidate) => candidate.xmlid === adder.xmlid);

                if (adder.freeText) {
                    return (
                        <TextField
                            key={adder.xmlid}
                            label={adder.display}
                            value={chosen?.text ?? ''}
                            onChangeText={(text) => setAdder(adder.xmlid, {text})}
                            maxLength={80}
                            testID={`author-adder-${index}-${adder.xmlid}`}
                        />
                    );
                }

                if (adder.options.length === 0) {
                    return null; // a flat yes/no adder — Phase B, alongside the same control on powers
                }

                return (
                    <SelectField
                        key={adder.xmlid}
                        label={adder.required ? adder.display : `${adder.display} (optional)`}
                        value={adder.options.find((option) => option.xmlid === chosen?.option)?.display ?? ''}
                        options={adder.options.map((option) => option.display)}
                        onChange={(display) => setAdder(adder.xmlid, {option: adder.options.find((option) => option.display === display)?.xmlid})}
                        testID={`author-adder-${index}-${adder.xmlid}`}
                    />
                );
            })}
        </View>
    );
}

/** Errors first, then advice. Errors block the save; warnings never do. */
function Problems({problems}: {problems: readonly Problem[]}): React.JSX.Element | null {
    const theme = useTheme();

    if (problems.length === 0) {
        return null;
    }

    return (
        <Card>
            <View style={styles.fields}>
                {problems.map((problem, index) => (
                    <Text
                        key={`${problem.path}-${index}`}
                        color={problem.severity === 'error' ? theme.colors.danger : theme.colors.textMuted}
                        testID={`author-problem-${problem.severity}-${index}`}
                    >
                        {problem.message}
                    </Text>
                ))}
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 16,
        rowGap: 16,
    },
    fields: {
        rowGap: 12,
    },
    meter: {
        rowGap: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 12,
        rowGap: 12,
        marginTop: 8,
    },
    gridCell: {
        width: '30%',
    },
    complication: {
        rowGap: 8,
    },
    complicationHead: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    actions: {
        flexDirection: 'row',
        columnGap: 12,
        justifyContent: 'flex-end',
    },
});
