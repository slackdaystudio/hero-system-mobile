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
 * The traits that came off the withheld list once the form could express a yes/no adder.
 *
 * Every one of these was withheld on the stated grounds that its decorator "reads fields no
 * template declares". Reading the decorators says otherwise: they price from options, adders,
 * `basecost` or a flat constant — the ordinary mechanisms. See `BESPOKE` in `catalogue.ts`.
 *
 * The numbers below come from the templates and, where the corpus carries the trait, from what a
 * real `.hdc` spends on it. Legacy is not an oracle here and neither is "whatever came out": each
 * expectation names its arithmetic.
 */
import {build, emptyDraft, trait as catalogueTrait, validate, withheld, type AuthorableCategory, type AuthoredCharacter, type AuthoredTrait} from '../index';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const BUCKET = {
    skills: 'skills',
    perks: 'perks',
    talents: 'talents',
    martialArts: 'martialArts',
} as const;

/** What one trait costs, on a character that has nothing else. */
const costOf = (category: keyof typeof BUCKET, value: AuthoredTrait, edition: '5E' | '6E' = '6E'): number => {
    const draft = {...emptyDraft(edition), name: 'Probe', [BUCKET[category]]: [value]} as AuthoredCharacter;
    const character = build(draft) as unknown as Obj;
    const key = category === 'martialArts' ? 'martialArts' : category;

    return (character[key] as Obj[]).reduce((total, trait) => total + characterTraitDecorator.decorate(trait, key, () => character).realCost(), 0);
};

const errorsIn = (category: keyof typeof BUCKET, value: AuthoredTrait, edition: '5E' | '6E' = '6E'): string[] =>
    validate({...emptyDraft(edition), name: 'Probe', [BUCKET[category]]: [value]} as AuthoredCharacter)
        .filter((problem) => problem.severity === 'error')
        .map((problem) => problem.message);

describe('the flat-cost skills, which read nothing at all', () => {
    it('prices Two-Weapon Fighting at 10', () => {
        // `TwoWeaponFighting.cost()` is `return 10`. There is nothing else to get wrong.
        expect(costOf('skills', {xmlid: 'TWO_WEAPON_FIGHTING_HTH', input: '', adders: []})).toBe(10);
    });

    it('prices Rapid Attack at 10', () => {
        // `RapidAttack.cost()` starts at 10 and takes 1 off for an HTH/Ranged-only limitation,
        // which a skill cannot carry in this form — so 10 is the whole story here.
        expect(costOf('skills', {xmlid: 'RAPID_ATTACK_HTH', input: '', adders: []})).toBe(10);
    });

    it('prices Cramming at its template basecost of 5', () => {
        // No decorator at all: `BaseCost` reads `trait.basecost`, which `emitTrait` copies from
        // the template. The silent-zero trap is exactly what that copy exists to avoid.
        expect(costOf('skills', {xmlid: 'CRAMMING', input: '', adders: []})).toBe(5);
    });
});

describe('the option-priced skills, which use the ordinary option mechanism', () => {
    it('prices Defense Maneuver from the option chosen, not from a flat cost', () => {
        // `DefensiveManeuver.cost()` walks `template.option` for the one matching `optionid`.
        // I is 3 points, I-II is 5 — so the option is the whole price, and picking a different
        // one has to move it.
        expect(costOf('skills', {xmlid: 'DEFENSE_MANEUVER', input: '', adders: [], option: 'ONE'})).toBe(3);
        expect(costOf('skills', {xmlid: 'DEFENSE_MANEUVER', input: '', adders: [], option: 'TWO'})).toBe(5);
    });

    it('prices Autofire Skills from its option', () => {
        // All four are 5 in 6E, so this pins the mechanism rather than a spread: the cost comes
        // from the matched option, not from the trait's own basecost, which is also 5 and would
        // have hidden a wrong answer.
        expect(costOf('skills', {xmlid: 'AUTOFIRE_SKILLS', input: '', adders: [], option: 'ACCURATE'})).toBe(5);
        expect(costOf('skills', {xmlid: 'AUTOFIRE_SKILLS', input: '', adders: [], option: 'SKIPOVER'})).toBe(5);
    });

    it('blocks a save when no option is chosen, rather than pricing it at nothing', () => {
        // Both read `optionid` unguarded, so an unanswered one throws inside the decorator and the
        // sheet degrades the row to a cost-0 stub. `validate` is what says so in words.
        expect(errorsIn('skills', {xmlid: 'DEFENSE_MANEUVER', input: '', adders: []})).toEqual([
            expect.stringContaining('Defense Maneuver needs one of'),
        ]);
    });
});

describe('the adder-priced familiarities', () => {
    it('prices Weapon Familiarity by the categories taken', () => {
        // `WeaponFamiliarity.cost()` sums its adders' basecosts. Common Melee Weapons is 2 and
        // Small Arms is 2 — the same two ConwayCostigan buys, for the same 4.
        expect(costOf('skills', {xmlid: 'WEAPON_FAMILIARITY', input: '', adders: [{xmlid: 'COMMONMELEE'}]})).toBe(2);
        expect(costOf('skills', {xmlid: 'WEAPON_FAMILIARITY', input: '', adders: [{xmlid: 'COMMONMELEE'}, {xmlid: 'SMALLARMS'}]})).toBe(4);
    });

    it('prices Transport Familiarity by the categories taken', () => {
        // `TransportFamiliarity.totalAdder` charges an adder's own basecost unless it carries
        // sub-adders of its own — and the form emits none, so each category costs its 2.
        expect(costOf('skills', {xmlid: 'TRANSPORT_FAMILIARITY', input: '', adders: [{xmlid: 'RIDINGANIMALS'}]})).toBe(2);
        expect(costOf('skills', {xmlid: 'TRANSPORT_FAMILIARITY', input: '', adders: [{xmlid: 'RIDINGANIMALS'}, {xmlid: 'COMMONMOTORIZED'}]})).toBe(4);
    });

    it('prices Weapon Element by the elements taken', () => {
        // AoE.hdc buys exactly this one, at exactly this price.
        expect(costOf('martialArts', {xmlid: 'WEAPON_ELEMENT', input: '', adders: [{xmlid: 'BAREHAND'}]})).toBe(1);
    });

    it('costs nothing when nothing is taken, which is a real state rather than an error', () => {
        // A familiarity with no categories is an empty purchase, not a malformed one — the player
        // is mid-edit. Nothing here should invent a cost or block the save on their behalf.
        expect(costOf('skills', {xmlid: 'WEAPON_FAMILIARITY', input: '', adders: []})).toBe(0);
        expect(errorsIn('skills', {xmlid: 'WEAPON_FAMILIARITY', input: '', adders: []})).toEqual([]);
    });
});

describe('the custom entries, which are a name and a number of points', () => {
    it.each([
        ['CUSTOMSKILL', 'skills'],
        ['CUSTOMPERK', 'perks'],
        ['CUSTOMTALENT', 'talents'],
    ] as const)('prices %s at its levels, one point each', (xmlid, category) => {
        // Gravity_Girl's "Defensive Attack" is a CUSTOMSKILL at LEVELS="10" — the player's own
        // trait, costing what they said it costs. That is the whole mechanism.
        expect(costOf(category, {xmlid, name: 'Defensive Attack', input: '', adders: [], levels: 10})).toBe(10);
    });
});

/**
 * An adder is never given a `template` — `getCharacter` attaches one to every *trait*, and nothing
 * attaches one to an adder. So `totalAdders` and four power decorators read `adder.lvlval` and
 * `adder.lvlcost` straight off the adder, and an emitter that omits them computes `n / undefined`.
 *
 * The result is `NaN`, which is the worst possible failure here: it is not an exception, so
 * `characterSheet.ts:333` never catches it, and the row renders with a blank cost while the meter
 * silently becomes `NaN` too.
 */
describe('a levelled adder carries the per-level pair the engine reads off it', () => {
    const costOfPower = (xmlid: string, levels: number, adders: {xmlid: string; levels?: number}[], edition: '5E' | '6E' = '6E'): number => {
        const draft = {...emptyDraft(edition), name: 'Probe', powers: [{xmlid, input: 'Probe', adders, levels, modifiers: []}]} as AuthoredCharacter;
        const character = build(draft) as unknown as Obj;

        return (character.powers as Obj[]).reduce((total, power) => total + characterTraitDecorator.decorate(power, 'powers', () => character).realCost(), 0);
    };

    it('prices Damage Negation by its DCs rather than at NaN', () => {
        // 6E charges 5 points a DC, so three physical DCs is 15. Before the pair was emitted this
        // was NaN — and Damage Negation could not be built at all, so nothing noticed.
        expect(costOfPower('DAMAGENEGATION', 0, [{xmlid: 'PHYSICAL', levels: 3}])).toBe(15);
        expect(costOfPower('DAMAGENEGATION', 0, [{xmlid: 'PHYSICAL', levels: 3}, {xmlid: 'ENERGY', levels: 3}])).toBe(30);
    });

    it('prices Multiform and Summon, which were withheld for this and not for themselves', () => {
        // Multiform is 1 point per 5 points of the alternate form: 10 levels = 2. Each extra form
        // is 5, so two is 10. Instant Change is a flat 5. Total 17.
        expect(costOfPower('MULTIFORM', 10, [{xmlid: 'INCREASENUMBER', levels: 2}, {xmlid: 'INSTANTCHANGE'}])).toBe(17);

        // Summon is the same 1-per-5 (10 levels = 2), plus 5 a being for two more. Total 12.
        expect(costOfPower('SUMMON', 10, [{xmlid: 'INCREASETOTAL', levels: 2}])).toBe(12);
    });

    it('is exactly the template pair, not a ratio standing in for it', () => {
        // `baseCost` feeds the same two fields to `getMultiplierCost`, whose arithmetic is
        // multiplicative rather than a ratio — so emitting `{lvlval: 1, lvlcost: perLevel}` would
        // price identically through `totalAdders` and wrongly through there.
        const levels = catalogueTrait('MULTIFORM', 'powers', '6E')!.adders.find((adder) => adder.xmlid === 'INCREASENUMBER')!.levels!;

        expect({lvlval: levels.lvlval, lvlcost: levels.lvlcost}).toEqual({lvlval: 1, lvlcost: 5});
        expect(levels.perLevel).toBe(levels.lvlcost / levels.lvlval);
    });
});

describe('what is left withheld', () => {
    it('is powers only, in both editions', () => {
        for (const edition of ['5E', '6E'] as const) {
            for (const category of ['skills', 'perks', 'talents', 'martialArts', 'disadvantages'] as AuthorableCategory[]) {
                expect({edition, category, withheld: withheld(category, edition).map((entry) => entry.xmlid)}).toEqual({edition, category, withheld: []});
            }
        }
    });

    it('names the powers still out, so shrinking the list stays a deliberate act', () => {
        // `unpriced` entries are sense modifiers for Enhanced Senses rather than standalone powers,
        // so they are excluded here — this pins the bespoke ones, which are the real backlog.
        expect(
            withheld('powers', '6E')
                .filter((entry) => entry.unsupported === 'bespoke')
                .map((entry) => entry.xmlid)
                .sort(),
        ).toEqual(['COMPOUNDPOWER', 'ENDURANCERESERVE', 'FLASH']);
    });
});
