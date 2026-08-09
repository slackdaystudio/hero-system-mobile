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
 * Editing one trait, on its own screen (docs/CHARACTER_AUTHORING.md).
 *
 * A trait's form is not small — a power can carry a free-text field, an option, levels, a defence
 * split, its adders, and any number of advantages and limitations, each with options and adders of
 * their own. Rendering every trait's form inline made the authoring screen scroll for a very long
 * way, so the list shows a row per trait and the form lives here.
 *
 * The draft is *not* passed in. It lives in {@link AuthoringDraftProvider}, and this screen is told
 * only the address of the trait to edit — a route can carry that without anybody having to think
 * about whether a whole character survives serialisation.
 *
 * Every field is generated from the rules templates. Nothing about Blast or Area Of Effect appears
 * in this file; the catalogue says what a trait declares and this draws it.
 */
import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {
    modifiers,
    trait as catalogueTrait,
    type AuthoredFramework,
    type AuthoredDefense,
    type AuthoredModifier,
    type AuthoredPower,
    type AuthoredTrait,
    type AuthoringEdition,
    type CatalogueAdder,
    type CatalogueTrait,
    type FieldGroup,
} from 'core/authoring';
import {Button, Card, NumberField, Screen, SegmentedControl, SelectField, Text, TextField, ToggleList} from 'app/components';
import {useAuthoringDraft, type TraitAddress} from 'app/providers/AuthoringDraftProvider';

export interface AuthorTraitScreenProps {
    /** Which trait to edit. Stale addresses render an explanation rather than crashing. */
    address: TraitAddress;
    /** The catalogue category the trait is drawn from — equipment and powers share one. */
    category: 'skills' | 'perks' | 'talents' | 'powers' | 'martialArts' | 'disadvantages';
    onDone: () => void;
}

/**
 * The form for one trait.
 *
 * An address can go stale — the trait behind it removed on the previous screen, or a draft
 * reopened after a build that dropped the entry. Both render a note and a way out rather than
 * throwing inside a screen the player cannot leave.
 */
export function AuthorTraitScreen({address, category, onDone}: AuthorTraitScreenProps): React.JSX.Element {
    const {draft, traitAt, frameworkAt, replaceFramework, replaceAt, removeAt} = useAuthoringDraft();
    const value = traitAt(address);
    const entry = useMemo(() => (value === null ? null : catalogueTrait(value.xmlid, category, draft.edition)), [value, category, draft.edition]);
    const pool = address.kind === 'pool' ? frameworkAt(address.framework) : null;
    // A slot's own address and framework, so the form can offer the things only a slot has. Read
    // here rather than off `value`, which is typed to the trait and drops them. Held as a `const`
    // so the narrowing survives into the callbacks below.
    const slotAddress = address.kind === 'slot' ? address : null;
    const holder = slotAddress === null ? null : frameworkAt(slotAddress.framework);

    // A framework's pool carries advantages and limitations but is not a trait — it has no
    // catalogue entry, no levels of its own and nothing to pick. Only the modifier editor applies.
    if (address.kind === 'pool') {
        return (
            <Screen>
                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    <Card>
                        {pool === null ? (
                            <View style={styles.fields}>
                                <Text testID="author-trait-missing">This framework is no longer part of the character.</Text>
                                <Button label="Back" onPress={onDone} testID="author-trait-done" />
                            </View>
                        ) : (
                            <Modifiers
                                id={`framework-${address.framework}`}
                                edition={draft.edition}
                                power={{xmlid: 'GENERIC_OBJECT', input: '', adders: [], modifiers: pool.modifiers} as AuthoredPower}
                                onChange={(revised) => replaceFramework(address.framework, {...pool, modifiers: (revised as AuthoredPower).modifiers})}
                            />
                        )}
                    </Card>

                    <View style={styles.actions}>
                        <Button label="Done" onPress={onDone} testID="author-trait-done" />
                    </View>
                </ScrollView>
            </Screen>
        );
    }

    if (value === null || entry === null) {
        return (
            <Screen>
                <ScrollView contentContainerStyle={styles.content}>
                    <Card>
                        <View style={styles.fields}>
                            <Text testID="author-trait-missing">This trait is no longer part of the character.</Text>
                            <Button label="Back" onPress={onDone} testID="author-trait-done" />
                        </View>
                    </Card>
                </ScrollView>
            </Screen>
        );
    }

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                <Card>
                    <TraitRow
                        index={address.index}
                        draftKey={address.kind === 'trait' ? address.key : `framework-${address.framework}-slot`}
                        edition={draft.edition}
                        entry={entry}
                        trait={value}
                        onChange={(revised) => replaceAt(address, revised)}
                        onRemove={() => {
                            removeAt(address);
                            onDone();
                        }}
                    />

                    {slotAddress !== null && holder !== null && holder.kind === 'multipower' ? (
                        <SlotKind
                            framework={holder}
                            index={slotAddress.index}
                            edition={draft.edition}
                            onChange={(revised) => replaceFramework(slotAddress.framework, revised)}
                        />
                    ) : null}
                </Card>

                <View style={styles.actions}>
                    <Button label="Done" onPress={onDone} testID="author-trait-done" />
                </View>
            </ScrollView>
        </Screen>
    );
}

/**
 * Fixed or variable, for one Multipower slot.
 *
 * **Multipower only**, which is why it is rendered from the address rather than from the trait: an
 * Elemental Control slot pays whatever it exceeds the pool by and a VPP's slots are prefabs, so
 * neither has the choice. Offering it there would be a control that changed no number — which is
 * exactly the state this whole screen was in before H13 was fixed.
 *
 * The two editions name the same two things differently, so the labels follow the edition the
 * character is being built in rather than picking one vocabulary and making half the players
 * translate.
 */
function SlotKind({
    framework,
    index,
    edition,
    onChange,
}: {
    framework: AuthoredFramework;
    index: number;
    edition: AuthoringEdition;
    onChange: (framework: AuthoredFramework) => void;
}): React.JSX.Element {
    const fifth = edition === '5E';
    const slot = framework.slots[index];

    const variable = slot?.variable === true;

    return (
        <View style={styles.fields} testID={`author-slot-kind-${index}`}>
            <Text variant="label" muted>
                SLOT
            </Text>

            <SegmentedControl
                segments={[
                    {value: 'fixed', label: fifth ? 'Ultra slot' : 'Fixed slot'},
                    {value: 'variable', label: fifth ? 'Multi slot' : 'Variable slot'},
                ]}
                value={variable ? 'variable' : 'fixed'}
                onChange={(mode) =>
                    onChange({
                        ...framework,
                        slots: framework.slots.map((entry, order) => (order === index ? {...entry, variable: mode === 'variable'} : entry)),
                    })
                }
            />

            {/* A fixed slot runs at full value and only one at a time; a variable slot can take a
                share of the reserve and run alongside its neighbours. Flexibility is what costs. */}
            <Text variant="caption" muted>
                {variable ? 'Costs a fifth of the power — the reserve splits across slots' : 'Costs a tenth of the power — one slot at full value'}
            </Text>
        </View>
    );
}

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
        const adders =
            existing === undefined ? [...trait.adders, {xmlid, ...patch}] : trait.adders.map((adder) => (adder.xmlid === xmlid ? {...adder, ...patch} : adder));

        onChange({...trait, adders});
    };

    /** Taking or dropping a yes/no adder. Present on the list *is* taken — see `emitAdder`. */
    const toggleAdder = (xmlid: string, selected: boolean): void =>
        onChange({...trait, adders: selected ? [...trait.adders, {xmlid}] : trait.adders.filter((adder) => adder.xmlid !== xmlid)});

    // Fourteen independent purchases on a Weapon Familiarity, "+½d6" on any attack, and the
    // *required* ones on Damage Negation and Possession — see `switchesOf`.
    const switches = switchesOf(entry);

    return (
        <View style={styles.complication}>
            <View style={styles.complicationHead}>
                <Text variant="label">{entry.display}</Text>
                <Button label="Remove" onPress={onRemove} variant="secondary" testID={`author-remove-${id}`} />
            </View>

            {/* Only powers are named. A skill's label is its own name; a power's is whatever the
                player called it — "Fire Bolt (Blast)". */}
            {entry.modifiable ? (
                <TextField
                    label="Name"
                    value={trait.name ?? ''}
                    onChangeText={(name) => onChange({...trait, name})}
                    maxLength={60}
                    testID={`author-name-${id}`}
                />
            ) : null}

            {entry.inputLabel === null ? null : (
                <TextField
                    label={entry.inputLabel}
                    value={trait.input}
                    onChangeText={(input) => onChange({...trait, input})}
                    maxLength={80}
                    testID={`author-input-${id}`}
                />
            )}

            {entry.fieldGroups.map((group) =>
                group.kind === 'defense' ? (
                    <DefenseFields key={group.label} id={id} group={group} trait={trait} onChange={onChange} />
                ) : (
                    <LevelFields key={group.label} id={id} group={group} trait={trait} onChange={onChange} />
                ),
            )}

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
                                : {
                                      xmlid: trait.xmlid,
                                      input: trait.input,
                                      adders: trait.adders,
                                      levels: 0,
                                      ...(entry.characteristics.length === 1 ? {characteristic: entry.characteristics[0].characteristic} : {}),
                                  },
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
                    // Levelled but optionless — "+[LVL] DCs" on Damage Negation, "+[LVL] Points of
                    // Mind Control effect" on Possession. A number, not a switch; and taking it to
                    // zero drops it, so there is one way to say "not this one".
                    if (adder.levels !== null) {
                        return (
                            <NumberField
                                key={adder.xmlid}
                                label={adder.required ? adder.display : `${adder.display} (optional)`}
                                value={String(chosen?.levels ?? 0)}
                                onChangeText={(text) => {
                                    const levels = Math.max(0, Number.parseInt(text, 10) || 0);

                                    return levels === 0 ? toggleAdder(adder.xmlid, false) : setAdder(adder.xmlid, {levels});
                                }}
                                testID={`author-adder-${id}-${adder.xmlid}`}
                            />
                        );
                    }

                    return null; // a plain yes/no — rendered together as chips, below
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

            {switches.length === 0 ? null : (
                <ToggleList
                    label={switches.some((adder) => adder.required) ? 'OPTIONS' : 'OPTIONS (ALL OPTIONAL)'}
                    items={switches.map((adder) => ({
                        key: adder.xmlid,
                        label: adder.display,
                        cost: adder.basecost,
                        selected: trait.adders.some((chosen) => chosen.xmlid === adder.xmlid),
                    }))}
                    onToggle={toggleAdder}
                    testID={`author-switches-${id}`}
                />
            )}

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
                            value={String(defense[field.key as keyof AuthoredDefense])}
                            onChangeText={(text) =>
                                onChange({...trait, defense: {...defense, [field.key]: Math.max(0, Number.parseInt(text, 10) || 0)}} as AuthoredTrait)
                            }
                            testID={`author-defense-${id}-${field.key}`}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

/**
 * The numbers a power's own decorator reads that no template describes — Barrier's dimensions,
 * Duplication's point total and count.
 *
 * The general case of {@link DefenseFields}, and it needs no translation layer: a `levels` group's
 * keys **are** the trait fields, so what the player types lands on `fields` under the name the
 * decorator will look it up by. That is why these two powers were withheld — `Barrier.cost()` sums
 * eight such fields unguarded, and one missing number prices the whole power `NaN`.
 */
function LevelFields({
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
    const fields = (trait as AuthoredPower).fields ?? {};

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
                            value={String(fields[field.key] ?? 0)}
                            onChangeText={(text) => {
                                // Width is bought in halves and a real `.hdc` carries
                                // `WIDTHLEVELS="1.5"`; everything beside it is whole units.
                                const parsed = field.fractional === true ? Number.parseFloat(text) : Number.parseInt(text, 10);

                                onChange({...trait, fields: {...fields, [field.key]: Math.max(0, Number.isFinite(parsed) ? parsed : 0)}} as AuthoredTrait);
                            }}
                            testID={`author-field-${id}-${field.key}`}
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
/**
 * The adders that are a plain yes/no: no options to pick, no levels to buy, no text to type.
 *
 * They render as one chip list rather than a control each. Before {@link ToggleList} they rendered
 * as **nothing**, on traits and modifiers alike — which is why Damage Negation could not answer its
 * own required adders, no attack could buy a half-die, and an Area Of Effect could not be made
 * Selective.
 */
const switchesOf = (entry: {adders: readonly CatalogueAdder[]}): readonly CatalogueAdder[] =>
    entry.adders.filter((adder) => !adder.freeText && adder.options.length === 0 && adder.levels === null && !isContainer(adder));

/**
 * A group header rather than a purchase: it has sub-choices and costs nothing itself.
 *
 * Weapon Familiarity is the clearest case. `COMMONMELEE` costs 2 *and* has seven weapons under it —
 * that is the real "Common Melee Weapons" purchase, so it is offered. `UNCOMMONMELEE` costs 0 and
 * has twelve; buying it would take a chip, charge nothing and grant nothing. Its weapons are the
 * purchase, one point each, and reaching them needs nested adders — which needs HERO Designer's
 * `SELECTED` semantics settled first. Until then a container is hidden rather than offered as a
 * free no-op.
 */
const isContainer = (adder: CatalogueAdder): boolean => adder.adders.length > 0 && adder.basecost === 0;

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
                                onChangeText={(text) =>
                                    update(index, {...applied, levels: text.trim() === '' ? 0 : Math.max(0, Number.parseInt(text, 10) || 0)})
                                }
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

                        {/* The same yes/no adders the trait form was missing, one level down — and
                            here they move the *multiplier*, so a power without them is not merely
                            missing a purchase, it is priced wrong. Area Of Effect's Selective,
                            Charges' Clips, Focus' Multiple Foci: all standard, none reachable. */}
                        {switchesOf(entry).length === 0 ? null : (
                            <ToggleList
                                label={`${entry.display.toUpperCase()} — OPTIONS`}
                                items={switchesOf(entry).map((adder) => ({
                                    key: adder.xmlid,
                                    label: adder.display,
                                    cost: adder.basecost,
                                    selected: applied.adders.some((candidate) => candidate.xmlid === adder.xmlid),
                                }))}
                                onToggle={(xmlid, selected) =>
                                    update(index, {
                                        ...applied,
                                        adders: selected ? [...applied.adders, {xmlid}] : applied.adders.filter((candidate) => candidate.xmlid !== xmlid),
                                    })
                                }
                                testID={`author-modifier-switches-${modifierId}`}
                            />
                        )}
                    </View>
                );
            })}

            <SelectField
                label="Add advantage or limitation"
                value=""
                options={available.map((entry) => entry.display)}
                onChange={add}
                testID={`author-add-modifier-${id}`}
            />
        </View>
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
    modifiers: {
        rowGap: 8,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        columnGap: 12,
        justifyContent: 'flex-end',
    },
});
