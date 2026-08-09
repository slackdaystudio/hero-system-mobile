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
import {Alert, Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {
    authorable,
    build,
    characteristics as catalogueCharacteristics,
    allowanceFor,
    allowancesFor,
    emptyDraft,
    frameworkSummaries,
    isSaveable,
    remaining,
    spendOf,
    summaries,
    validate,
    withheld,
    type AuthorableCategory,
    type AuthoredCharacter,
    type AuthoredFramework,
    type AuthoredSlot,
    type AuthoringEdition,
    type CatalogueTrait,
    type FrameworkKind,
    type Problem,
} from 'core/authoring';
import {Button, Card, NumberField, Screen, SegmentedControl, SelectField, Text, TextField} from 'app/components';
import {useAuthoringDraft, type TraitAddress} from 'app/providers/AuthoringDraftProvider';
import {useSaveAuthored} from 'app/providers/AuthoringProvider';
import {useTheme} from 'app/theme';

/** The engine's built character — a dynamic object graph, as everywhere else it is handled. */
type Obj = Record<string, any>;

export interface AuthorCharacterScreenProps {
    /** Re-open an existing authored character instead of starting fresh. */
    initial?: AuthoredCharacter;
    /** The row being edited, when there is one — a save without it creates a new character. */
    characterId?: string;
    onSaved: (id: string) => void;
    onCancel: () => void;
    /**
     * Open the form for one trait. Absent when there is nowhere to go — the rows then do nothing
     * rather than the screen having to know whether it is inside a navigator.
     */
    onEditTrait?: (address: TraitAddress, category: AuthorableCategory) => void;
    /** Open the advantages-and-limitations form for a framework's pool. */
    onEditFramework?: (index: number) => void;
}

const EDITIONS: Array<{value: AuthoringEdition; label: string}> = [
    {value: '6E', label: '6th Edition'},
    {value: '5E', label: '5th Edition'},
];

export function AuthorCharacterScreen({initial, characterId, onSaved, onCancel, onEditTrait, onEditFramework}: AuthorCharacterScreenProps): React.JSX.Element {
    const save = useSaveAuthored();
    const {draft, setDraft, beginSession} = useAuthoringDraft();
    const [busy, setBusy] = useState(false);

    // The draft lives above this screen so the trait form can share it, which means *this* screen
    // has to say when a new character is being started. Keyed on the row being edited, so coming
    // back from the trait form is not a new session and does not wipe what was typed.
    beginSession(characterId ?? 'new', initial);

    // Built once per change, and everything on the screen reads it: the meter, and the cost on
    // every row. One build means a row and the total can never tell different stories.
    const {character, spend, problems} = useMemo(() => {
        const validated = validate(draft);

        // A draft with errors may not be buildable at all — an unknown characteristic throws
        // rather than pricing at 0 — so the meter says so rather than crashing the screen.
        if (!isSaveable(validated)) {
            return {character: null, spend: null, problems: validated};
        }

        const built = build(draft);

        return {character: built, spend: spendOf(built), problems: validated};
    }, [draft]);

    const edit = useCallback((address: TraitAddress, category: AuthorableCategory) => onEditTrait?.(address, category), [onEditTrait]);

    const left = spend === null ? null : remaining(spend, draft.budget, draft.edition);

    const commit = useCallback(() => {
        // Guarded here as well as on the button. Disabling a control is a UI affordance; refusing
        // to write a character the engine cannot price is the actual rule, and it belongs on the
        // path that does the writing.
        if (busy || !isSaveable(problems)) {
            return;
        }

        setBusy(true);
        save(draft, characterId)
            .then(
                (result) => onSaved(result.id),
                (error: unknown) => Alert.alert('Could not save', error instanceof Error ? error.message : 'That character could not be saved.'),
            )
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
                        <TextField
                            label="Player"
                            value={draft.player}
                            onChangeText={(player) => setDraft({...draft, player})}
                            maxLength={60}
                            testID="author-player"
                        />

                        <EditionPicker draft={draft} onChange={setDraft} locked={characterId !== undefined} />
                    </View>
                </Card>

                <SpendMeter left={left} complications={spend?.complications ?? 0} limit={draft.budget.complicationLimit} edition={draft.edition} />

                <Allowance draft={draft} onChange={setDraft} />

                <Characteristics draft={draft} onChange={setDraft} />

                <Frameworks draft={draft} onChange={setDraft} character={character} onEdit={edit} onEditPool={(index) => onEditFramework?.(index)} />

                {SECTIONS.map((section) => (
                    <TraitSection
                        key={section.key}
                        category={section.category}
                        draftKey={section.key}
                        title={section.title(draft.edition)}
                        draft={draft}
                        onChange={setDraft}
                        character={character}
                        onEdit={edit}
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
function EditionPicker({
    draft,
    onChange,
    locked,
}: {
    draft: AuthoredCharacter;
    onChange: (draft: AuthoredCharacter) => void;
    locked: boolean;
}): React.JSX.Element | null {
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

const CUSTOM = 'Custom';

/**
 * What the campaign allows.
 *
 * Named levels for the common cases, and both numbers editable for a campaign the rulebooks have
 * no name for. Editing either number puts the picker on "Custom" by itself — the label is derived
 * from the numbers rather than stored, so it can never claim a level the numbers do not match.
 *
 * The two editions are quoted in different units and the labels say so, because "400" means the
 * whole allowance in 6E and a pre-disadvantage base in 5E. Getting that backwards is the single
 * easiest mistake here — see `POINT_ALLOWANCES`.
 */
function Allowance({draft, onChange}: {draft: AuthoredCharacter; onChange: (draft: AuthoredCharacter) => void}): React.JSX.Element {
    const offered = useMemo(() => allowancesFor(draft.edition), [draft.edition]);
    const named = allowanceFor(draft.budget, draft.edition);

    const set = (patch: Partial<AuthoredCharacter['budget']>): void => onChange({...draft, budget: {...draft.budget, ...patch}});

    return (
        <Card>
            <View style={styles.fields}>
                <Text variant="label" muted>
                    CAMPAIGN
                </Text>

                <SelectField
                    label="Power level"
                    value={named?.name ?? CUSTOM}
                    options={[...offered.map((allowance) => allowance.name), CUSTOM]}
                    onChange={(name) => {
                        const allowance = offered.find((candidate) => candidate.name === name);

                        // "Custom" selects nothing — it is what the numbers already say. Picking it
                        // and having the budget jump would be the opposite of what it means.
                        if (allowance !== undefined) {
                            set({base: allowance.base, complicationLimit: allowance.complicationLimit});
                        }
                    }}
                    testID="author-power-level"
                />

                <View style={styles.grid}>
                    <View style={styles.budgetCell}>
                        <NumberField
                            label={draft.edition === '5E' ? 'Base points' : 'Total points'}
                            value={String(draft.budget.base)}
                            onChangeText={(text) => set({base: Math.max(0, Number.parseInt(text, 10) || 0)})}
                            testID="author-budget-base"
                        />
                    </View>
                    <View style={styles.budgetCell}>
                        <NumberField
                            label={draft.edition === '5E' ? 'Disadvantage limit' : 'Complication limit'}
                            value={String(draft.budget.complicationLimit)}
                            onChangeText={(text) => set({complicationLimit: Math.max(0, Number.parseInt(text, 10) || 0)})}
                            testID="author-budget-limit"
                        />
                    </View>
                </View>
            </View>
        </Card>
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
                {/* Past the allowance is not an overspend — it is earned experience, and the
                    sheet's nameplate prints it beside the base. So it reads as a fact, not a fault. */}
                <Text color={left.experience > 0 ? theme.colors.primary : theme.colors.textMuted} testID="author-remaining">
                    {left.experience > 0 ? `${left.experience} experience` : `${left.left} remaining`}
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
type DraftKey = 'skills' | 'perks' | 'talents' | 'powers' | 'martialArts' | 'equipment' | 'complications';

const SECTIONS: Array<{category: AuthorableCategory; key: DraftKey; title: (edition: AuthoringEdition) => string}> = [
    {category: 'skills', key: 'skills', title: () => 'SKILLS'},
    {category: 'perks', key: 'perks', title: () => 'PERKS'},
    {category: 'talents', key: 'talents', title: () => 'TALENTS'},
    {category: 'powers', key: 'powers', title: () => 'POWERS'},
    {category: 'martialArts', key: 'martialArts', title: () => 'MARTIAL ARTS'},
    // Equipment draws on the powers catalogue: an item is a power in a different bucket, which is
    // exactly how `populateTrait` reads it.
    {category: 'powers', key: 'equipment', title: () => 'EQUIPMENT'},
    // The rules rename them between editions, and so does the sheet.
    {category: 'disadvantages', key: 'complications', title: (edition) => (edition === '5E' ? 'DISADVANTAGES' : 'COMPLICATIONS')},
];

/**
 * One category's list: a row per trait, and a way to add another.
 *
 * The form for a trait is not here — a power's can run to a defence split, a dozen adders and any
 * number of advantages, and rendering every one inline made this screen scroll for a very long
 * way. Each row says what the trait is and what it costs, and opens {@link AuthorTraitScreen}.
 *
 * The costs come from {@link summaries}, which prices the *built* character — so a row and the
 * meter above it can never disagree.
 */
function TraitSection({
    category,
    draftKey,
    title,
    draft,
    onChange,
    character,
    onEdit,
}: {
    category: AuthorableCategory;
    draftKey: DraftKey;
    title: string;
    draft: AuthoredCharacter;
    onChange: (draft: AuthoredCharacter) => void;
    character: Obj | null;
    onEdit: (address: TraitAddress, category: AuthorableCategory) => void;
}): React.JSX.Element {
    const offered = useMemo(() => authorable(category, draft.edition), [category, draft.edition]);
    const notYet = useMemo(() => withheld(category, draft.edition), [category, draft.edition]);
    const taken = draft[draftKey];
    const rows = character === null ? [] : summaries(character, draftKey === 'complications' ? 'disadvantages' : draftKey);

    const add = (display: string): void => {
        const entry = offered.find((candidate) => candidate.display === display);

        if (entry === undefined) {
            return;
        }

        // Seeded with the only unambiguous answers: a lone characteristic choice, and levels at
        // zero. Anything the player must decide is left blank so `validate` asks for it rather
        // than the form quietly picking. Then straight into the form — adding a trait and never
        // being shown its options is how you end up with a row that says it needs something.
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
                    ...seedFields(entry),
                },
            ],
        });

        onEdit({kind: 'trait', key: draftKey, index: taken.length}, category);
    };

    return (
        <Card>
            <Text variant="label" muted>
                {title}
            </Text>

            <View style={styles.fields}>
                {taken.map((entry, index) => (
                    <TraitListRow
                        key={`${entry.xmlid}-${index}`}
                        label={rows[index]?.label ?? entry.xmlid}
                        cost={rows[index]?.cost ?? 0}
                        onPress={() => onEdit({kind: 'trait', key: draftKey, index}, category)}
                        testID={`author-row-${draftKey}-${index}`}
                    />
                ))}

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

/** One line in a category list: what it is, what it costs, and a tap to open it. */
function TraitListRow({
    label,
    cost,
    onPress,
    testID,
    indented = false,
}: {
    label: string;
    cost: number;
    onPress: () => void;
    testID: string;
    indented?: boolean;
}): React.JSX.Element {
    const theme = useTheme();

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${cost} points`}
            onPress={onPress}
            testID={testID}
            style={[styles.row, indented ? styles.rowIndented : null, {borderColor: theme.colors.border}]}>
            <Text style={styles.rowLabel} numberOfLines={2}>
                {label}
            </Text>
            <Text variant="label" muted>
                {cost}
            </Text>
        </Pressable>
    );
}

/** One trait: whichever of free text, characteristic, option, levels, familiarity and adders it declares. */
const FRAMEWORK_KINDS: Array<{value: FrameworkKind; label: string}> = [
    {value: 'multipower', label: 'Multipower'},
    {value: 'elementalControl', label: 'Elemental Control'},
    {value: 'vpp', label: 'Variable Power Pool'},
];

/**
 * The declared-field answers a freshly-added trait starts with, all zero.
 *
 * Seeded rather than left absent because the decorators that read these add them up unguarded:
 * a Barrier missing one of its eight prices `NaN`, and `NaN` is not an exception, so
 * `characterSheet.ts:333` never catches it and the row simply renders blank. `emit` defaults them
 * too — this is the belt to that pair of braces, and it also means the form opens showing zeros
 * rather than empty boxes.
 */
const seedFields = (entry: CatalogueTrait): Record<string, unknown> => {
    const seeded: Record<string, unknown> = {};

    for (const group of entry.fieldGroups) {
        if (group.kind === 'defense') {
            seeded.defense = {pd: 0, ed: 0, mental: 0, power: 0};
        } else {
            seeded.fields = {...((seeded.fields as Record<string, number>) ?? {}), ...Object.fromEntries(group.fields.map((field) => [field.key, 0]))};
        }
    }

    return seeded;
};

/**
 * A slot's row label, with its kind when the kind is a choice.
 *
 * 5E and 6E name the same two things differently — ultra/multi became fixed/variable — so the
 * suffix follows the edition the character is being built in. A fixed slot says nothing: it is the
 * default, and labelling the common case only adds noise to every row.
 */
const slotLabel = (label: string, framework: AuthoredFramework, slot: AuthoredSlot, edition: AuthoringEdition): string =>
    framework.kind === 'multipower' && slot.variable === true ? `${label} · ${edition === '5E' ? 'multi' : 'variable'}` : label;

/**
 * Power frameworks: a pool, and the powers drawing on it.
 *
 * The pool's own fields stay here — a name and a reserve are two lines, and a framework is mostly
 * its contents. Each slot is a row that opens the same trait form a standalone power uses.
 */
function Frameworks({
    draft,
    onChange,
    character,
    onEdit,
    onEditPool,
}: {
    draft: AuthoredCharacter;
    onChange: (draft: AuthoredCharacter) => void;
    character: Obj | null;
    onEdit: (address: TraitAddress, category: AuthorableCategory) => void;
    onEditPool: (index: number) => void;
}): React.JSX.Element {
    const powers = useMemo(() => authorable('powers', draft.edition), [draft.edition]);
    const rows = character === null ? [] : frameworkSummaries(character);

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

                        <TextField
                            label="Name"
                            value={framework.name}
                            onChangeText={(name) => update(index, {...framework, name})}
                            maxLength={60}
                            testID={`author-framework-name-${index}`}
                        />

                        <NumberField
                            label={framework.kind === 'vpp' ? 'Pool' : 'Reserve'}
                            value={String(framework.reserve)}
                            onChangeText={(text) => update(index, {...framework, reserve: Math.max(0, Number.parseInt(text, 10) || 0)})}
                            testID={`author-framework-reserve-${index}`}
                        />

                        <Button
                            label="Advantages & limitations"
                            onPress={() => onEditPool(index)}
                            variant="secondary"
                            testID={`author-edit-framework-${index}`}
                        />

                        {framework.slots.map((slot, order) => (
                            <TraitListRow
                                key={`${slot.xmlid}-${order}`}
                                // The kind rides on the label so the list shows it without the
                                // player opening every slot — two slots of the same power at
                                // different costs is otherwise unreadable. Only a Multipower has
                                // the distinction, so only a Multipower says anything.
                                label={slotLabel(rows[index]?.slots[order]?.label ?? slot.xmlid, framework, slot, draft.edition)}
                                cost={rows[index]?.slots[order]?.cost ?? 0}
                                onPress={() => onEdit({kind: 'slot', framework: index, index: order}, 'powers')}
                                testID={`author-row-framework-${index}-slot-${order}`}
                                indented
                            />
                        ))}

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
                                            {
                                                xmlid: entry.xmlid,
                                                input: '',
                                                adders: [],
                                                levels: 0,
                                                modifiers: [],
                                                ...seedFields(entry),
                                            },
                                        ],
                                    });
                                    onEdit({kind: 'slot', framework: index, index: framework.slots.length}, 'powers');
                                }
                            }}
                            testID={`author-add-slot-${index}`}
                        />
                    </View>
                ))}

                <SelectField label="Add" value="" options={FRAMEWORK_KINDS.map((kind) => kind.label)} onChange={add} testID="author-add-framework" />
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
                        testID={`author-problem-${problem.severity}-${index}`}>
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
    budgetCell: {
        width: '46%',
    },
    complication: {
        rowGap: 8,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rowIndented: {
        paddingLeft: 16,
    },
    rowLabel: {
        flex: 1,
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
