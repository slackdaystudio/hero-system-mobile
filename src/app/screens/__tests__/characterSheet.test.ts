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

import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import type {Obj} from 'core/traits';
import sample from '../../composition/sampleCharacter.json';
import {alternateIdentities, asHeroCharacter, buildCharacterSheet, buildCombatSheet, hasAlternateForm, isOnlyInAlternateId} from '../characterSheet';

const processed = (): CharacterDocument => heroDesignerCharacter.getCharacter(sample as unknown as ParsedCharacter) as unknown as CharacterDocument;

const heroOf = (fixture: string): Obj =>
    heroDesignerCharacter.getCharacter(JSON.parse(JSON.stringify(require(`../../../core/hero/__tests__/fixtures/${fixture}.json`))) as ParsedCharacter) as unknown as Obj;

describe('characterSheet', () => {
    it('recognises a processed character and rejects a thin document', () => {
        expect(asHeroCharacter(processed())).not.toBeNull();
        expect(asHeroCharacter({characteristics: [{definition: '(6E)'}]} as unknown as CharacterDocument)).toBeNull();
        expect(asHeroCharacter({powers: [{name: 'X'}]} as unknown as CharacterDocument)).toBeNull();
    });

    it('builds characteristics with numeric totals and skill-style rolls', () => {
        const hero = asHeroCharacter(processed());
        const sheet = buildCharacterSheet(hero!);

        expect(sheet.characteristics.length).toBeGreaterThan(0);
        expect(sheet.characteristics.every((c) => Number.isFinite(c.total))).toBe(true);
        // At least one characteristic (STR/DEX/...) yields a roll like "13-".
        expect(sheet.characteristics.some((c) => typeof c.roll === 'string' && c.roll.endsWith('-'))).toBe(true);
        expect(sheet.characteristics.some((c) => /strength/i.test(c.name))).toBe(true);
    });

    it('builds decorated trait sections with labels and costs', () => {
        const sheet = buildCharacterSheet(asHeroCharacter(processed())!);

        expect(sheet.sections.length).toBeGreaterThan(0);
        const allTraits = sheet.sections.flatMap((section) => section.traits);
        expect(allTraits.length).toBeGreaterThan(0);
        expect(allTraits.every((t) => typeof t.label === 'string' && t.label.length > 0)).toBe(true);
        expect(allTraits.every((t) => Number.isFinite(t.realCost))).toBe(true);
    });

    it('attaches a mechanical writeup (costs + advantages/limitations) to each trait', () => {
        const aoe = heroOf('aoe');
        const powers = buildCharacterSheet(aoe, true).sections.find((s) => s.title === 'Powers')!.traits;

        // Every trait carries a writeup with numeric base/active/real costs.
        expect(powers.every((t) => Number.isFinite(t.writeup.cost.base) && Number.isFinite(t.writeup.cost.active) && Number.isFinite(t.writeup.cost.real))).toBe(true);

        // Some power lists an Area Of Effect advantage in its writeup.
        expect(powers.some((t) => t.writeup.advantages.some((a) => a.includes('Area Of Effect')))).toBe(true);
    });

    describe('alternate identity (showSecondary)', () => {
        it('detects the alternate (super) form only when a trait is only-in-alternate-ID', () => {
            // Both carry OIHID nested inside multipower frameworks, so the detection has to
            // descend into framework slots rather than only splicing `type: 'list'` containers.
            expect(hasAlternateForm(heroOf('stone-archon'))).toBe(true);
            expect(hasAlternateForm(heroOf('spyder2022'))).toBe(true);

            // Secondary characteristics alone are not an alternate identity: these have powers
            // that affect total-but-not-primary, but no OIHID trait and so no second identity.
            expect(hasAlternateForm(heroOf('gravity-girl'))).toBe(false);
            expect(hasAlternateForm(heroOf('twilight'))).toBe(false);

            expect(hasAlternateForm(heroOf('champions-9-11-teen-supers-blank'))).toBe(false);
        });

        it('reads the alias / alternate identity from the character info', () => {
            expect(alternateIdentities(heroOf('gravity-girl') as unknown as CharacterDocument)).toBe('Jane Smith');
            expect(alternateIdentities(heroOf('defensor') as unknown as CharacterDocument)).toBeNull();
        });

        it('changes characteristic totals when the alternate-ID form is toggled on', () => {
            const gg = heroOf('gravity-girl');
            const inForm = buildCharacterSheet(gg, true).characteristics.map((c) => c.total);
            const baseForm = buildCharacterSheet(gg, false).characteristics.map((c) => c.total);

            expect(inForm).not.toEqual(baseForm);
        });

        it('changes the derived defenses with the form too', () => {
            const gg = heroOf('gravity-girl');
            const inForm = buildCombatSheet(gg, true).defenses.map((d) => d.value);
            const baseForm = buildCombatSheet(gg, false).defenses.map((d) => d.value);

            expect(inForm).not.toEqual(baseForm);
        });

        it('detects the alternate form for a character with OIHID-limited traits', () => {
            expect(hasAlternateForm(heroOf('spyder2022'))).toBe(true);
        });

        it('suppresses "Only In Alternate ID" traits when the form is off, and restores them when on', () => {
            const spyder = heroOf('spyder2022');
            const count = (secondary: boolean): number => buildCharacterSheet(spyder, secondary).sections.reduce((n, s) => n + s.traits.length, 0);

            const shown = count(true);
            const hidden = count(false);

            expect(hidden).toBeLessThan(shown); // OIHID-tagged traits are dropped in the base (secret-ID) form
        });

        it('drops OIHID contributions from the combat/movement values in the base form', () => {
            const spyder = heroOf('spyder2022');
            const snapshot = (secondary: boolean): string => {
                const combat = buildCombatSheet(spyder, secondary);
                return JSON.stringify([combat.movement, combat.defenses, combat.combatValues, combat.info]);
            };

            // Its OIHID Running/Swimming/Teleport powers stop counting out of the alternate ID.
            expect(snapshot(false)).not.toEqual(snapshot(true));
        });

        it('builds a maneuver combat line (strike/evasion/range/damage/notes) for martial arts', () => {
            const aoe = heroOf('aoe');
            const section = buildCharacterSheet(aoe, true).sections.find((s) => s.title === 'Martial Arts');
            expect(section).toBeDefined();

            const choke = section!.traits.find((t) => t.label === 'Choke Hold');
            expect(choke?.maneuver?.ocv).toBe('-2');
            expect(choke?.maneuver?.dcv).toBe('+0');
            expect(choke?.maneuver?.range).toBeNull();

            // Non-maneuver traits carry no maneuver line.
            const powers = buildCharacterSheet(aoe, true).sections.find((s) => s.title === 'Powers');
            expect(powers?.traits.every((t) => t.maneuver === undefined)).toBe(true);
        });

        it('keeps a simple damage code in the Damage column but pushes a complex effect to notes', () => {
            const traits = buildCharacterSheet(heroOf('aoe'), true).sections.find((s) => s.title === 'Martial Arts')!.traits;
            const move = (label: string) => traits.find((t) => t.label === label)?.maneuver;

            // Simple: "Flash 7d6" stays in the Damage column and is not repeated in notes.
            expect(move('Martial Flash')?.damage).toBe('Flash 7d6');
            expect(move('Martial Flash')?.notes).not.toContain('Flash 7d6');

            // Complex: "Grab One Limb; 3½d6 NND" moves to notes; Damage holds just the clean dice.
            expect(move('Choke Hold')?.notes).toContain('Grab One Limb; 3½d6 NND');
            expect(move('Choke Hold')?.damage).toBe('3½d6');

            // Complex with no rollable damage: Damage is empty, effect is in the notes.
            expect(move('Martial Escape')?.damage).toBeNull();
            expect(move('Martial Escape')?.notes).toContain('87 STR vs. Grabs');

            // Notes never leads with a stray separator.
            expect(traits.every((t) => !(t.maneuver?.notes ?? '').startsWith(' '))).toBe(true);
        });

        it('isOnlyInAlternateId only fires on the OIHID limitation', () => {
            expect(isOnlyInAlternateId({modifier: {xmlid: 'OIHID'}})).toBe(true);
            expect(isOnlyInAlternateId({modifier: [{xmlid: 'FOCUS'}, {xmlid: 'OIHID'}]})).toBe(true);
            expect(isOnlyInAlternateId({modifier: {xmlid: 'AVAD'}})).toBe(false); // "Alternate" defense, not alt-ID
            expect(isOnlyInAlternateId({})).toBe(false);
        });
    });
});
