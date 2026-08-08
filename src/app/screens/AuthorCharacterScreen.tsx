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
    authorable,
    build,
    catalogue,
    characteristics as catalogueCharacteristics,
    DEFAULT_BUDGET,
    emptyDraft,
    isSaveable,
    remaining,
    spendOf,
    validate,
    modifiers,
    withheld,
    type AuthorableCategory,
    type AuthoredCharacter,
    type AuthoredFramework,
    type AuthoredModifier,
    type AuthoredPower,
    type AuthoredTrait,
    type AuthoringEdition,
    type CatalogueTrait,
    type FieldGroup,
    type FrameworkKind,
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

                <Frameworks draft={draft} onChange={setDraft} />

                {SECTIONS.map((section) => (
                    <TraitSection
                        key={section.key}
                        category={section.category}
                        draftKey={section.key}
                        title={section.title(draft.edition)}
                        draft={draft}
                        onChange={setDraft}
                    />
                ))}

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
    const entries = useMemo(() => catalogueCharacteristics(draft.edition), [draft.edition]);

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
                {entries.map((entry) => (
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

/** How each authorable category is titled and stored on the draft. */
type DraftKey = 'skills' | 'perks' | 'talents' | 'powers' | 'complications';

const SECTIONS: Array<{category: AuthorableCategory; key: DraftKey; title: (edition: AuthoringEdition) => string}> = [
    {category: 'skills', key: 'skills', title: () => 'SKILLS'},
    {category: 'perks', key: 'perks', title: () => 'PERKS'},
    {category: 'talents', key: 'talents', title: () => 'TALENTS'},
    {category: 'powers', key: 'powers', title: () => 'POWERS'},
    // The rules rename them between editions, and so does the sheet.
    {category: 'disadvantages', key: 'complications', title: (edition) => (edition === '5E' ? 'DISADVANTAGES' : 'COMPLICATIONS')},
];

/**
 * One category's list, every field of it generated from the template.
 *
 * This component is the whole of Phase B's UI. Skills, perks, talents and complications differ in
 * which fields their template entries declare, not in kind, so there is one renderer and the
 * catalogue decides what it draws.
 */
function TraitSection({
    category,
    draftKey,
    title,
    draft,
    onChange,
}: {
    category: AuthorableCategory;
    draftKey: DraftKey;
    title: string;
    draft: AuthoredCharacter;
    onChange: (draft: AuthoredCharacter) => void;
}): React.JSX.Element {
    const offered = useMemo(() => authorable(category, draft.edition), [category, draft.edition]);
    const notYet = useMemo(() => withheld(category, draft.edition), [category, draft.edition]);
    const byXmlid = useMemo(() => new Map(catalogue(category, draft.edition).map((entry) => [entry.xmlid, entry])), [category, draft.edition]);
    const taken = draft[draftKey];

    const add = (display: string): void => {
        const entry = offered.find((candidate) => candidate.display === display);

        if (entry === undefined) {
            return;
        }

        // Seeded with the only unambiguous answers: a lone characteristic choice, and levels at
        // zero. Anything the player must decide is left blank so `validate` asks for it rather
        // than the form quietly picking.
        onChange({
            ...draft,
            [draftKey]: [
                ...taken,
                {
                    xmlid: entry.xmlid,
                    input: '',
                    adders: [],
                    levels: 0,
                    ...(entry.characteristics.length === 1 ? {characteristic: entry.characteristics[0].characteristic} : {}),
                    ...(entry.modifiable ? {modifiers: []} : {}),
                    ...(entry.fieldGroup === null ? {} : {defense: {pd: 0, ed: 0, mental: 0, power: 0}}),
                },
            ],
        });
    };

    const update = (index: number, revised: AuthoredTrait): void =>
        onChange({...draft, [draftKey]: taken.map((entry, position) => (position === index ? revised : entry))});

    const remove = (index: number): void => onChange({...draft, [draftKey]: taken.filter((_, position) => position !== index)});

    return (
        <Card>
            <Text variant="label" muted>
                {title}
            </Text>

            <View style={styles.fields}>
                {taken.map((entry, index) => {
                    const catalogueEntry = byXmlid.get(entry.xmlid);

                    return catalogueEntry === undefined ? (
                        <Text key={`${entry.xmlid}-${index}`} testID={`author-${draftKey}-unknown-${index}`}>
                            {draft.edition} has no “{entry.xmlid}”.
                        </Text>
                    ) : (
                        <TraitRow
                            key={`${entry.xmlid}-${index}`}
                            index={index}
                            draftKey={draftKey}
                            edition={draft.edition}
                            entry={catalogueEntry}
                            trait={entry}
                            onChange={(revised) => update(index, revised)}
                            onRemove={() => remove(index)}
                        />
                    );
                })}

                <SelectField
                    label="Add"
                    value=""
                    options={offered.map((entry) => entry.display)}
                    onChange={add}
                    // Said rather than silently omitted: a shorter list reads as "the app lacks
                    // Weapon Familiarity", not "not yet". See docs/CHARACTER_AUTHORING.md.
                    hint={notYet.length === 0 ? undefined : `${notYet.length} more need a form of their own`}
                    testID={`author-add-${draftKey}`}
                />
            </View>
        </Card>
    );
}

/** One trait: whichever of free text, characteristic, option, levels, familiarity and adders it declares. */
function TraitRow({
    index,
    draftKey,
    edition,
    entry,
    trait,
    onChange,
    onRemove,
}: {
    index: number;
    draftKey: string;
    edition: AuthoringEdition;
    entry: CatalogueTrait;
    trait: AuthoredTrait;
    onChange: (trait: AuthoredTrait) => void;
    onRemove: () => void;
}): React.JSX.Element {
    const id = `${draftKey}-${index}`;

    const setAdder = (xmlid: string, patch: {option?: string; text?: string; levels?: number}): void => {
        const existing = trait.adders.find((adder) => adder.xmlid === xmlid);
        const adders = existing === undefined ? [...trait.adders, {xmlid, ...patch}] : trait.adders.map((adder) => (adder.xmlid === xmlid ? {...adder, ...patch} : adder));

        onChange({...trait, adders});
    };

    return (
        <View style={styles.complication}>
            <View style={styles.complicationHead}>
                <Text variant="label">{entry.display}</Text>
                <Button label="Remove" onPress={onRemove} variant="secondary" testID={`author-remove-${id}`} />
            </View>

            {/* Only powers are named. A skill's label is its own name; a power's is whatever the
                player called it — "Fire Bolt (Blast)". */}
            {entry.modifiable ? (
                <TextField label="Name" value={trait.name ?? ''} onChangeText={(name) => onChange({...trait, name})} maxLength={60} testID={`author-name-${id}`} />
            ) : null}

            {entry.inputLabel === null ? null : (
                <TextField label={entry.inputLabel} value={trait.input} onChangeText={(input) => onChange({...trait, input})} maxLength={80} testID={`author-input-${id}`} />
            )}

            {entry.fieldGroup === null ? null : <DefenseFields id={id} group={entry.fieldGroup} trait={trait} onChange={onChange} />}

            {entry.familiarity === null ? null : (
                <SegmentedControl
                    segments={[
                        {value: 'full', label: 'Full skill'},
                        {value: 'familiarity', label: `Familiarity (${entry.familiarity.roll}-)`},
                    ]}
                    value={trait.familiarity === true ? 'familiarity' : 'full'}
                    // A familiarity is a different purchase, not the skill at zero — so switching
                    // drops the characteristic and levels rather than keeping them around unused.
                    onChange={(mode) =>
                        onChange(
                            mode === 'familiarity'
                                ? {xmlid: trait.xmlid, input: trait.input, adders: trait.adders, familiarity: true}
                                : {xmlid: trait.xmlid, input: trait.input, adders: trait.adders, levels: 0, ...(entry.characteristics.length === 1 ? {characteristic: entry.characteristics[0].characteristic} : {})},
                        )
                    }
                />
            )}

            {entry.characteristics.length > 1 && trait.familiarity !== true ? (
                <SelectField
                    label="Based on"
                    value={trait.characteristic ?? ''}
                    options={entry.characteristics.map((choice) => choice.characteristic)}
                    onChange={(characteristic) => onChange({...trait, characteristic})}
                    testID={`author-characteristic-${id}`}
                />
            ) : null}

            {entry.options.length === 0 ? null : (
                <SelectField
                    label={entry.display}
                    value={entry.options.find((option) => option.xmlid === trait.option)?.display ?? ''}
                    options={entry.options.map((option) => option.display)}
                    onChange={(display) => onChange({...trait, option: entry.options.find((option) => option.display === display)?.xmlid})}
                    testID={`author-option-${id}`}
                />
            )}

            {entry.levels === null || trait.familiarity === true ? null : (
                <NumberField
                    label={entry.levels.label}
                    value={trait.levels === undefined ? '' : String(trait.levels)}
                    onChangeText={(text) => onChange({...trait, levels: text.trim() === '' ? 0 : Math.max(0, Number.parseInt(text, 10) || 0)})}
                    testID={`author-levels-${id}`}
                />
            )}

            {entry.adders.map((adder) => {
                const chosen = trait.adders.find((candidate) => candidate.xmlid === adder.xmlid);

                if (adder.freeText) {
                    return (
                        <TextField
                            key={adder.xmlid}
                            label={adder.display}
                            value={chosen?.text ?? ''}
                            onChangeText={(text) => setAdder(adder.xmlid, {text})}
                            maxLength={80}
                            testID={`author-adder-${id}-${adder.xmlid}`}
                        />
                    );
                }

                if (adder.options.length === 0) {
                    return null; // a flat yes/no adder — needs a switch, which is its own change
                }

                return (
                    <SelectField
                        key={adder.xmlid}
                        label={adder.required ? adder.display : `${adder.display} (optional)`}
                        value={adder.options.find((option) => option.xmlid === chosen?.option)?.display ?? ''}
                        options={adder.options.map((option) => option.display)}
                        onChange={(display) => setAdder(adder.xmlid, {option: adder.options.find((option) => option.display === display)?.xmlid})}
                        testID={`author-adder-${id}-${adder.xmlid}`}
                    />
                );
            })}

            {entry.modifiable ? <Modifiers id={id} edition={edition} power={trait as AuthoredPower} onChange={onChange} /> : null}
        </View>
    );
}

/**
 * The defences a Resistant Protection is split across.
 *
 * Four numbers with no template behind them — see `FieldGroup`. The power's `levels` is derived
 * from their sum at emit time, so there is nothing here for the player to keep in step.
 */
function DefenseFields({
    id,
    group,
    trait,
    onChange,
}: {
    id: string;
    group: FieldGroup;
    trait: AuthoredTrait;
    onChange: (trait: AuthoredTrait) => void;
}): React.JSX.Element {
    const defense = (trait as AuthoredPower).defense ?? {pd: 0, ed: 0, mental: 0, power: 0};

    return (
        <View>
            <Text variant="caption" muted>
                {group.label}
            </Text>
            <View style={styles.grid}>
                {group.fields.map((field) => (
                    <View key={field.key} style={styles.gridCell}>
                        <NumberField
                            label={field.label}
                            value={String(defense[field.key])}
                            onChangeText={(text) => onChange({...trait, defense: {...defense, [field.key]: Math.max(0, Number.parseInt(text, 10) || 0)}} as AuthoredTrait)}
                            testID={`author-defense-${id}-${field.key}`}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

/**
 * A power's advantages and limitations.
 *
 * One list, not two, because which is which is the sign of what a modifier ends up costing rather
 * than a property of the modifier — `ModifierCalculator` splits them on exactly that, and an
 * option can flip a modifier from one to the other.
 */
function Modifiers({
    id,
    edition,
    power,
    onChange,
}: {
    id: string;
    edition: AuthoringEdition;
    power: AuthoredPower;
    onChange: (trait: AuthoredTrait) => void;
}): React.JSX.Element {
    const available = useMemo(() => modifiers(edition), [edition]);
    const byXmlid = useMemo(() => new Map(available.map((entry) => [entry.xmlid, entry])), [available]);

    const add = (display: string): void => {
        const entry = available.find((candidate) => candidate.display === display);

        if (entry !== undefined) {
            onChange({...power, modifiers: [...power.modifiers, {xmlid: entry.xmlid, adders: []}]} as AuthoredTrait);
        }
    };

    const update = (index: number, revised: AuthoredModifier): void =>
        onChange({...power, modifiers: power.modifiers.map((entry, position) => (position === index ? revised : entry))} as AuthoredTrait);

    const remove = (index: number): void => onChange({...power, modifiers: power.modifiers.filter((_, position) => position !== index)} as AuthoredTrait);

    return (
        <View style={styles.modifiers}>
            <Text variant="caption" muted>
                Advantages &amp; limitations
            </Text>

            {power.modifiers.map((applied, index) => {
                const entry = byXmlid.get(applied.xmlid);
                const modifierId = `${id}-mod-${index}`;

                return entry === undefined ? (
                    <Text key={modifierId} testID={`author-modifier-unknown-${modifierId}`}>
                        {edition} has no “{applied.xmlid}”.
                    </Text>
                ) : (
                    <View key={modifierId} style={styles.complication}>
                        <View style={styles.complicationHead}>
                            <Text>{entry.display}</Text>
                            <Button label="Remove" onPress={() => remove(index)} variant="secondary" testID={`author-remove-${modifierId}`} />
                        </View>

                        {entry.freeText ? (
                            <TextField
                                label={entry.display}
                                value={applied.text ?? ''}
                                onChangeText={(text) => update(index, {...applied, text})}
                                maxLength={80}
                                testID={`author-modifier-text-${modifierId}`}
                            />
                        ) : null}

                        {entry.options.length === 0 ? null : (
                            <SelectField
                                label="Which"
                                value={entry.options.find((option) => option.xmlid === applied.option)?.display ?? ''}
                                options={entry.options.map((option) => option.display)}
                                onChange={(display) => update(index, {...applied, option: entry.options.find((option) => option.display === display)?.xmlid})}
                                testID={`author-modifier-option-${modifierId}`}
                            />
                        )}

                        {entry.levels === null ? null : (
                            <NumberField
                                label={entry.levels.label}
                                value={applied.levels === undefined ? '' : String(applied.levels)}
                                onChangeText={(text) => update(index, {...applied, levels: text.trim() === '' ? 0 : Math.max(0, Number.parseInt(text, 10) || 0)})}
                                testID={`author-modifier-levels-${modifierId}`}
                            />
                        )}

                        {entry.adders.map((adder) => {
                            const chosen = applied.adders.find((candidate) => candidate.xmlid === adder.xmlid);
                            const setNested = (patch: {option?: string}): void =>
                                update(index, {
                                    ...applied,
                                    adders:
                                        chosen === undefined
                                            ? [...applied.adders, {xmlid: adder.xmlid, ...patch}]
                                            : applied.adders.map((candidate) => (candidate.xmlid === adder.xmlid ? {...candidate, ...patch} : candidate)),
                                });

                            return adder.options.length === 0 ? null : (
                                <SelectField
                                    key={adder.xmlid}
                                    label={adder.display}
                                    value={adder.options.find((option) => option.xmlid === chosen?.option)?.display ?? ''}
                                    options={adder.options.map((option) => option.display)}
                                    onChange={(display) => setNested({option: adder.options.find((option) => option.display === display)?.xmlid})}
                                    testID={`author-modifier-adder-${modifierId}-${adder.xmlid}`}
                                />
                            );
                        })}
                    </View>
                );
            })}

            <SelectField label="Add advantage or limitation" value="" options={available.map((entry) => entry.display)} onChange={add} testID={`author-add-modifier-${id}`} />
        </View>
    );
}

const FRAMEWORK_KINDS: Array<{value: FrameworkKind; label: string}> = [
    {value: 'multipower', label: 'Multipower'},
    {value: 'elementalControl', label: 'Elemental Control'},
    {value: 'vpp', label: 'Variable Power Pool'},
];

/**
 * Power frameworks: a pool, and the powers drawing on it.
 *
 * Its own section rather than a kind of power, because a framework is not priced like one — the
 * container costs its reserve and each slot a fraction of what it would cost alone. Slots reuse
 * {@link TraitRow}, so a power in a pool is edited exactly like a power outside one.
 */
function Frameworks({draft, onChange}: {draft: AuthoredCharacter; onChange: (draft: AuthoredCharacter) => void}): React.JSX.Element {
    const powers = useMemo(() => authorable('powers', draft.edition), [draft.edition]);
    const byXmlid = useMemo(() => new Map(catalogue('powers', draft.edition).map((entry) => [entry.xmlid, entry])), [draft.edition]);

    const update = (index: number, revised: AuthoredFramework): void =>
        onChange({...draft, frameworks: draft.frameworks.map((entry, position) => (position === index ? revised : entry))});

    const add = (label: string): void => {
        const kind = FRAMEWORK_KINDS.find((candidate) => candidate.label === label);

        if (kind !== undefined) {
            onChange({...draft, frameworks: [...draft.frameworks, {kind: kind.value, name: '', reserve: 0, modifiers: [], slots: []}]});
        }
    };

    return (
        <Card>
            <Text variant="label" muted>
                FRAMEWORKS
            </Text>

            <View style={styles.fields}>
                {draft.frameworks.map((framework, index) => (
                    <View key={`${framework.kind}-${index}`} style={styles.complication}>
                        <View style={styles.complicationHead}>
                            <Text variant="label">{FRAMEWORK_KINDS.find((kind) => kind.value === framework.kind)?.label ?? framework.kind}</Text>
                            <Button
                                label="Remove"
                                onPress={() => onChange({...draft, frameworks: draft.frameworks.filter((_, position) => position !== index)})}
                                variant="secondary"
                                testID={`author-remove-framework-${index}`}
                            />
                        </View>

                        <TextField label="Name" value={framework.name} onChangeText={(name) => update(index, {...framework, name})} maxLength={60} testID={`author-framework-name-${index}`} />

                        <NumberField
                            label={framework.kind === 'vpp' ? 'Pool' : 'Reserve'}
                            value={String(framework.reserve)}
                            onChangeText={(text) => update(index, {...framework, reserve: Math.max(0, Number.parseInt(text, 10) || 0)})}
                            testID={`author-framework-reserve-${index}`}
                        />

                        <Modifiers
                            id={`framework-${index}`}
                            edition={draft.edition}
                            power={{xmlid: 'GENERIC_OBJECT', input: '', adders: [], modifiers: framework.modifiers} as AuthoredPower}
                            onChange={(revised) => update(index, {...framework, modifiers: (revised as AuthoredPower).modifiers})}
                        />

                        {framework.slots.map((slot, order) => {
                            const entry = byXmlid.get(slot.xmlid);

                            return entry === undefined ? null : (
                                <TraitRow
                                    key={`${slot.xmlid}-${order}`}
                                    index={order}
                                    draftKey={`framework-${index}-slot`}
                                    edition={draft.edition}
                                    entry={entry}
                                    trait={slot}
                                    onChange={(revised) => update(index, {...framework, slots: framework.slots.map((entry2, p) => (p === order ? (revised as AuthoredPower) : entry2))})}
                                    onRemove={() => update(index, {...framework, slots: framework.slots.filter((_, p) => p !== order)})}
                                />
                            );
                        })}

                        <SelectField
                            label="Add a power to this framework"
                            value=""
                            options={powers.map((entry) => entry.display)}
                            onChange={(display) => {
                                const entry = powers.find((candidate) => candidate.display === display);

                                if (entry !== undefined) {
                                    update(index, {
                                        ...framework,
                                        slots: [
                                            ...framework.slots,
                                            {xmlid: entry.xmlid, input: '', adders: [], levels: 0, modifiers: [], ...(entry.fieldGroup === null ? {} : {defense: {pd: 0, ed: 0, mental: 0, power: 0}})},
                                        ],
                                    });
                                }
                            }}
                            testID={`author-add-slot-${index}`}
                        />
                    </View>
                ))}

                <SelectField
                    label="Add"
                    value=""
                    options={FRAMEWORK_KINDS.map((kind) => kind.label)}
                    onChange={add}
                    // Fixed slots only — the variable kind's divisor is unreachable in the engine
                    // (H13 in docs/KNOWN_DEVIATIONS.md), so offering it would price a variable slot
                    // as a fixed one and say nothing about it.
                    hint="Slots are fixed slots"
                    testID="author-add-framework"
                />
            </View>
        </Card>
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
    modifiers: {
        rowGap: 8,
        marginTop: 4,
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
