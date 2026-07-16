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
 * Editing a **generated** character (docs/RANDOM_CHARACTER.md).
 *
 * An imported `.hdc` is a faithful view of a file the player owns and stays read-only — the app has
 * no business rewriting it. A generated character is the app's own, so its recipe can be revised
 * and the character rebuilt from it.
 *
 * Every edit is the same operation: revise the recipe, rebuild, save. A recipe fully determines a
 * character, so there is no partial-mutation path here that could leave a build half-changed —
 * whatever comes out is exactly what rolling those choices would have produced.
 */
import React, {useCallback, useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import type {Character} from 'core/ports';
import {
    autoName,
    changeProfession,
    changeSpecialFx,
    fittableSkillsets,
    generatableArchetypes,
    namedSkillSlots,
    nameSkill,
    parseRecipe,
    recipeEdition,
    renameRecipe,
    rerollArchetype,
    SPECIAL_FX,
    type CharacterRecipe,
    type PlayerDefinedSlot,
} from 'core/random';
import {Card, SelectField, Text, TextField} from 'app/components';
import {useGeneratorRng, useReviseCharacter} from 'app/providers/GenerateProvider';

/**
 * The recipe a character may be edited through, or null if it may not be.
 *
 * Two gates, and both matter. `origin` keeps imports read-only. {@link parseRecipe} then re-resolves
 * the recipe against the current data: one naming an archetype a later build dropped returns null,
 * so the character quietly stops being editable rather than failing to open. The sheet still
 * renders either way — it reads the document, not the recipe.
 */
export const editableRecipe = (character: Character): CharacterRecipe | null => (character.origin === 'generated' ? parseRecipe(character.recipe) : null);

export interface CharacterEditorProps {
    character: Character;
    recipe: CharacterRecipe;
    /** Fired after a successful save, so the sheet can reload and show the rebuilt character. */
    onRevised: () => void;
}

const confirm = (title: string, message: string, confirmLabel: string, onConfirm: () => void): void =>
    Alert.alert(title, message, [
        {text: 'Cancel', style: 'cancel'},
        {text: confirmLabel, onPress: onConfirm},
    ]);

export function CharacterEditor({character, recipe, onRevised}: CharacterEditorProps): React.JSX.Element {
    const revise = useReviseCharacter();
    const rng = useGeneratorRng();
    const [name, setName] = useState(recipe.name);
    const [busy, setBusy] = useState(false);
    // The lists a 6E character may be edited through are 6E's. Both editions name the same eleven
    // archetypes and professions, so offering the wrong edition's would look right and rebuild the
    // character out of the other edition's data.
    const edition = recipeEdition(recipe);

    const apply = useCallback(
        (revised: CharacterRecipe) => {
            if (busy) {
                return;
            }
            setBusy(true);
            revise(character, revised)
                .then(onRevised, (error: unknown) => {
                    setName(recipe.name); // the save failed, so put the field back
                    Alert.alert('Could not save', error instanceof Error ? error.message : 'That change could not be saved.');
                })
                .finally(() => setBusy(false));
        },
        [busy, revise, character, recipe.name, onRevised],
    );

    // Committed on blur, not per keystroke: each save rebuilds the character and writes the row.
    const commitName = useCallback(() => {
        const trimmed = name.trim();

        if (trimmed === '' || trimmed === recipe.name) {
            setName(recipe.name); // an empty name isn't a rename, it's a slip
            return;
        }

        apply(renameRecipe(recipe, trimmed));
    }, [name, recipe, apply]);

    const pickArchetype = (archetype: string): void =>
        confirm(`Re-roll ${recipe.name} as ${archetype}?`, 'Powers and characteristics will be replaced. Skills and complications stay.', 'Re-roll', () =>
            apply(rerollArchetype(rng, recipe, archetype)),
        );

    const pickProfession = (profession: string): void =>
        confirm(`Retrain ${recipe.name} as ${profession}?`, 'Skills will be replaced. Powers and characteristics stay.', 'Retrain', () =>
            apply(changeProfession(recipe, profession)),
        );

    return (
        <Card>
            <View style={styles.fields}>
                <Text variant="label" muted>
                    GENERATED CHARACTER
                </Text>

                <TextField label="Name" value={name} onChangeText={setName} onBlur={commitName} testID="edit-name" maxLength={60} />

                <SelectField
                    label="Archetype"
                    value={recipe.archetype}
                    options={generatableArchetypes(edition).map((archetype) => archetype.name)}
                    onChange={pickArchetype}
                    hint="Re-rolls powers and characteristics"
                    disabled={busy}
                    testID="edit-archetype"
                />

                <SelectField
                    label="Profession"
                    value={recipe.profession}
                    options={fittableSkillsets(edition).map((skillset) => skillset.profession)}
                    onChange={pickProfession}
                    hint="Re-rolls skills"
                    disabled={busy}
                    testID="edit-profession"
                />

                <SelectField
                    label="Special FX"
                    value={recipe.specialFx}
                    options={SPECIAL_FX}
                    onChange={(specialFx) => apply(changeSpecialFx(recipe, specialFx))}
                    // Nothing but the name reads SFX, and only while the name is still the rolled
                    // one — so this is silent on a character the player has named.
                    hint={recipe.name === autoName(recipe) ? 'Renames the character' : 'Flavour only'}
                    disabled={busy}
                    testID="edit-sfx"
                />

                <PlayerDefinedSkills recipe={recipe} onName={(slot, value) => apply(nameSkill(recipe, slot, value))} />
            </View>
        </Card>
    );
}

/** The sheet's short name for a player-defined skill, and what to prompt for. */
const SKILL_FIELDS: Record<string, {label: string; placeholder: string}> = {
    LANGUAGES: {label: 'Language', placeholder: 'Name a language'},
    SCIENCE_SKILL: {label: 'Science Skill', placeholder: 'Name a science'},
};

const fieldFor = (slot: PlayerDefinedSlot): {label: string; placeholder: string} =>
    SKILL_FIELDS[slot.xmlid] ?? {label: slot.alias, placeholder: `Name a ${slot.alias.toLowerCase()}`};

/**
 * The skills this profession leaves blank on purpose — the prose's `Lang:` and `SS[INT]:` named no
 * language and no science, so only the player can say.
 *
 * They render on the sheet as "Language: Player Defined" until answered. An answer replaces that
 * text and nothing else, so the skill keeps its cost and roll either way.
 */
function PlayerDefinedSkills({recipe, onName}: {recipe: CharacterRecipe; onName: (slot: string, value: string) => void}): React.JSX.Element | null {
    const slots = namedSkillSlots(recipe);

    if (slots.length === 0) {
        return null;
    }

    // Only number them when there's more than one to tell apart — the Scientist's three sciences.
    const counts = slots.reduce<Record<string, number>>((tally, slot) => ({...tally, [slot.xmlid]: (tally[slot.xmlid] ?? 0) + 1}), {});
    const ordinals: Record<string, number> = {};

    return (
        <>
            {slots.map((slot) => {
                const field = fieldFor(slot);
                ordinals[slot.xmlid] = (ordinals[slot.xmlid] ?? 0) + 1;
                const label = counts[slot.xmlid] > 1 ? `${field.label} ${ordinals[slot.xmlid]}` : field.label;

                return <NamedSkillField key={slot.slot} label={label} placeholder={field.placeholder} value={recipe.skills?.[slot.slot] ?? ''} onCommit={(value) => onName(slot.slot, value)} testID={`edit-skill-${slot.slot}`} />;
            })}
        </>
    );
}

/** One player-defined skill. Committed on blur — each save rebuilds the character. */
function NamedSkillField({
    label,
    placeholder,
    value,
    onCommit,
    testID,
}: {
    label: string;
    placeholder: string;
    value: string;
    onCommit: (value: string) => void;
    testID: string;
}): React.JSX.Element {
    const [draft, setDraft] = useState(value);

    return (
        <TextField
            label={label}
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder}
            maxLength={40}
            onBlur={() => {
                if (draft.trim() !== value) {
                    onCommit(draft);
                }
            }}
            testID={testID}
        />
    );
}

const styles = StyleSheet.create({
    fields: {
        rowGap: 12,
    },
});
