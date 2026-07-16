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

import {PartialDie, RollType} from 'core/dice';
import {heroDesignerCharacter, type ParsedCharacter} from 'core/hero';
import type {CharacterDocument} from 'core/ports';
import type {Obj} from 'core/traits';
import {traitRollRequest} from 'app/dice/rollRequest';
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

    /**
     * STR damage on the sheet — a port gap: the legacy app showed this and the rebuild never did,
     * so a Brick could see his STR 60 and had no way to roll the 12d6 it does.
     */
    describe('strength damage', () => {
        const strengthOf = (fixture: string) => buildCharacterSheet(heroOf(fixture)).characteristics.find((c) => /strength/i.test(c.name))!;

        it('gives a real Brick a rollable 12d6', () => {
            const strength = strengthOf('jack-diamond');

            expect(strength.total).toBe(61);
            expect(strength.damage).toEqual({roll: '12d6', type: RollType.NormalDamage});
        });

        /**
         * A `RollDescriptor`, not a string, so the row goes through the identical `traitRollRequest`
         * path a maneuver's damage does — tap, long-press and stat recording all come free. A bare
         * string would have needed its own dispatch, and there are already two independent parsers
         * for this notation in the tree.
         */
        it('carries a descriptor the roll path already understands', () => {
            const strength = strengthOf('jack-diamond');

            expect(traitRollRequest(strength.damage, 'Strength Damage')).toEqual({mode: 'normal', dice: 12, partialDie: PartialDie.None, label: 'Strength Damage'});
        });

        it('reads a half-die through to the roller', () => {
            // 2½d6 must arrive as dice 2 + PartialDie.Half, not as "2d6" with the half quietly lost.
            expect(traitRollRequest({roll: '2½d6', type: RollType.NormalDamage}, 'Strength Damage')).toEqual({
                mode: 'normal',
                dice: 2,
                partialDie: PartialDie.Half,
                label: 'Strength Damage',
            });
        });

        it('is STR and nothing else — DEX does not punch', () => {
            const sheet = buildCharacterSheet(heroOf('jack-diamond'));
            const withDamage = sheet.characteristics.filter((c) => c.damage !== null);

            expect(withDamage).toHaveLength(1);
            expect(withDamage[0].name).toMatch(/strength/i);
        });

        /**
         * The damage has to obey the same alternate-identity filter as the total printed above it.
         * Otherwise a STR bought Only In Alternate Identity would show a total of 10 and a punch of
         * 12d6 on the same line, which is worse than showing neither.
         */
        it('agrees with the total it sits under, in both identities', () => {
            for (const fixture of ['jack-diamond', 'adamantinerebuild210109']) {
                for (const showSecondary of [false, true]) {
                    const strength = buildCharacterSheet(heroOf(fixture), showSecondary).characteristics.find((c) => /strength/i.test(c.name))!;
                    const expected = `${Math.trunc(strength.total / 5)}`;

                    // Same STR the row prints, every time — the dice are just that number over 5.
                    expect({fixture, showSecondary, roll: strength.damage?.roll}).toEqual({
                        fixture,
                        showSecondary,
                        roll: expect.stringMatching(new RegExp(`^${expected}(½)?d6$`)),
                    });
                }
            }
        });
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

    it('prices each power’s END cost, leaving framework containers and non-powers at 0', () => {
        const sheet = buildCharacterSheet(heroOf('twilight'), true);
        const powers = sheet.sections.find((s) => s.title === 'Powers')!.traits;

        // At least one attack costs END (1 per 10 Active Points).
        expect(powers.some((t) => t.endurance > 0)).toBe(true);
        // A multipower/VPP container is not itself used — it costs no END (its slots do).
        const framework = powers.find((t) => /multipower|variable power pool/i.test(t.label));
        if (framework !== undefined) {
            expect(framework.endurance).toBe(0);
        }
        // Skills, perks, and talents never cost END.
        for (const title of ['Skills', 'Perks', 'Talents']) {
            const section = sheet.sections.find((s) => s.title === title);
            expect((section?.traits ?? []).every((t) => t.endurance === 0)).toBe(true);
        }
    });

    it('charges STR its own END cost (1 per 10), and no other characteristic', () => {
        const sheet = buildCharacterSheet(heroOf('twilight'), true);
        const str = sheet.characteristics.find((c) => /strength/i.test(c.name))!;
        expect(str.endurance).toBe(Math.max(1, Math.round(str.total / 10)));
        expect(sheet.characteristics.filter((c) => !/strength/i.test(c.name)).every((c) => c.endurance === null)).toBe(true);
    });

    it('charges STR END at 1 per 10 in 5E too (same rate as 6E)', () => {
        const str = buildCharacterSheet(heroOf('spyder2022'), true).characteristics.find((c) => /strength/i.test(c.name))!;
        expect(str.total).toBe(20);
        expect(str.endurance).toBe(2);
    });

    it('charges 5E movement END on the metre-equivalent distance (1" = 2m)', () => {
        const running = buildCombatSheet(heroOf('bridget')).movement.find((m) => /running/i.test(m.name))!;
        // 10" of Running is 20m → 2 END, not the 1 a raw-inch reading would give.
        expect(running.combat).toBe('10"');
        expect(running.endurance).toBe(2);
    });

    it('leaves 6E movement END on its metre distance unchanged', () => {
        const running = buildCombatSheet(heroOf('twilight')).movement.find((m) => /running/i.test(m.name))!;
        expect(running.combat).toBe('12m');
        expect(running.endurance).toBe(1);
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
