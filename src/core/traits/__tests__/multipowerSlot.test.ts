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
 * H13 (docs/KNOWN_DEVIATIONS.md) — a Multipower slot's divisor.
 *
 * **The corpus cannot supply this test.** All 75 multipower slots in the 37 fixtures are
 * `ULTRA_SLOT="Yes"`, as is every slot in all 82 `.hdc` files on hand — HERO Designer defaults a
 * new slot to fixed and players rarely change it. So a variable slot has to be built here, and no
 * golden master can see any of this.
 *
 * **Legacy is not the oracle.** Legacy read `ultraSlot` off the `CharacterTrait` wrapper, which
 * never carries it, so the branch was dead and every slot divided by 10. It also had the
 * terminology inverted — its `attributes()` calls `ultraSlot: true` "Variable"/"Flexible" — so the
 * ratios were right and attached to the wrong branch. An **ultra slot is the fixed kind**: one
 * power, at full value, one at a time. 6E renamed ultra → fixed, multi → variable.
 *
 * The fixed side is not argued, it is measured: pricing the corpus at ÷10 lands junkyard exactly
 * on its declared budget and greyman (−7), starborne (−4), spyder2022 (−2) and twilight (+7)
 * within a handful of points, across both editions. Forcing ÷5 puts every one of them 11–39 points
 * over. That is what pins ÷10 as fixed, and it leaves ÷5 for the flexible kind — the number
 * legacy already had, on the branch it belongs to.
 */
import {build, emit, emptyDraft, parseSource, toSource, type AuthoredCharacter, type AuthoredSlot} from 'core/authoring';
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';

type Obj = Record<string, any>;

const blast = (over: Partial<AuthoredSlot> = {}): AuthoredSlot => ({xmlid: 'ENERGYBLAST', name: 'Bolt', input: 'ED', adders: [], levels: 12, modifiers: [], ...over});

const multipower = (slots: readonly AuthoredSlot[], reserve = 75): AuthoredCharacter => ({
    ...emptyDraft('6E'),
    name: 'Probe',
    frameworks: [{kind: 'multipower', name: 'Fire Tricks', reserve, modifiers: [], slots}],
});

const container = (character: Obj): Obj => (character.powers as Obj[]).find((power) => power.type === 'list')!;
const cost = (trait: Obj, character: Obj): number => characterTraitDecorator.decorate(trait, 'powers', () => character).realCost();
const slotCosts = (character: Obj): number[] => ((container(character).powers ?? []) as Obj[]).map((slot) => cost(slot, character));

describe('a Multipower slot is priced by its kind', () => {
    it('charges a fixed slot a tenth of what the power would cost alone', () => {
        // A 12d6 Blast is 5 points a die, so 60 alone. 60 / 10 = 6.
        expect(slotCosts(build(multipower([blast()])))).toEqual([6]);
    });

    it('charges a variable slot a fifth — twice a fixed one, because flexibility is what you pay for', () => {
        // Same 60-point power, allocated a share of the reserve rather than all of it. 60 / 5 = 12.
        expect(slotCosts(build(multipower([blast({variable: true})])))).toEqual([12]);
    });

    it('prices the two kinds side by side in one pool', () => {
        const character = build(multipower([blast({name: 'Fixed Bolt'}), blast({name: 'Variable Bolt', variable: true})]));

        // The rules let a Multipower mix them, and nothing about one slot's kind touches another's.
        expect(slotCosts(character)).toEqual([6, 12]);
        expect(cost(container(character), character)).toBe(75);
    });

    it('rounds in the player favor after dividing, not before', () => {
        // A 15d6 Blast is 75 alone. 75 / 10 = 7.5, which truncates DOWN to 7 — `roundInPlayersFavor`
        // sends a fraction in .50-.59 the player's way. The variable slot lands on 15 exactly, so
        // the two do not simply differ by a factor of two once rounding is in play.
        expect(slotCosts(build(multipower([blast({levels: 15})])))).toEqual([7]);
        expect(slotCosts(build(multipower([blast({levels: 15, variable: true})])))).toEqual([15]);
    });
});

describe('the flag is read off the trait, which is what H13 got wrong', () => {
    it('moves the number at all — the wrapper read was dead, so both kinds priced the same', () => {
        // The regression guard proper. Before the fix these two were both 6, and no test in the
        // suite could tell that the choice did nothing.
        expect(slotCosts(build(multipower([blast()])))).not.toEqual(slotCosts(build(multipower([blast({variable: true})]))));
    });

    it('writes the flag onto the emitted slot, where the decorator looks for it', () => {
        const slots = (emit(multipower([blast(), blast({variable: true})])) as unknown as Obj).powers.power as Obj[];

        // `ULTRA_SLOT="Yes"` is the fixed kind. The emitter states it on every slot rather than
        // only the fixed ones, because that is what HERO Designer writes.
        expect(slots.map((slot) => slot.ultraSlot)).toEqual([true, false]);
    });

    it('treats a slot with no flag at all as fixed', () => {
        // HERO Designer writes `ULTRA_SLOT` on every slot it emits, so absence means malformed
        // input rather than a variable slot — and the safe answer there is the behaviour that
        // shipped for the whole life of the port.
        const parsed = emit(multipower([blast()])) as unknown as Obj;
        delete parsed.powers.power[0].ultraSlot;

        expect(slotCosts(heroDesignerCharacter.getCharacter(parsed as never) as unknown as Obj)).toEqual([6]);
    });
});

describe('the choice survives being stored', () => {
    it('round-trips through the source column', () => {
        // `toSource` is a whitelist, not a spread — a field nobody lists is dropped on save. A
        // variable slot silently coming back fixed would make the character cheaper than the
        // player left it, and nothing on screen would say why.
        const original = multipower([blast({name: 'Fixed Bolt'}), blast({name: 'Variable Bolt', variable: true})]);
        const reopened = parseSource(JSON.parse(JSON.stringify(toSource(original))));

        expect(reopened).toEqual(original);
        expect(slotCosts(build(reopened!))).toEqual([6, 12]);
    });

    it('reads a slot stored before the kind existed as fixed', () => {
        // Every slot written by 2.8.0 was emitted fixed, and none of them carry the key.
        const stored = JSON.parse(JSON.stringify(toSource(multipower([blast()])))) as Obj;
        delete stored.frameworks[0].slots[0].variable;

        expect(slotCosts(build(parseSource(stored)!))).toEqual([6]);
    });

    it('refuses a source whose slot kind is not a boolean', () => {
        const stored = JSON.parse(JSON.stringify(toSource(multipower([blast()])))) as Obj;
        stored.frameworks[0].slots[0].variable = 'yes';

        // Fails safe like every other malformed field: the character still opens and still renders,
        // it just stops being editable rather than being rebuilt from something misread.
        expect(parseSource(stored)).toBeNull();
    });
});

describe('the other two frameworks have no such choice', () => {
    it('ignores the flag on an Elemental Control slot, which pays what it exceeds the pool by', () => {
        const ec = (slots: readonly AuthoredSlot[]): Obj =>
            build({...emptyDraft('6E'), name: 'Probe', frameworks: [{kind: 'elementalControl', name: 'Psychic Powers', reserve: 22, modifiers: [], slots}]});

        // 60 active - 22 pool = 38, whichever way the flag is set. Asserted rather than assumed:
        // `emit` deliberately withholds `ultraSlot` from a non-Multipower, and this is what would
        // catch it being written anyway.
        expect(slotCosts(ec([blast()]))).toEqual([38]);
        expect(slotCosts(ec([blast({variable: true})]))).toEqual([38]);
    });

    it('emits no slot-kind field outside a Multipower', () => {
        const slots = (emit({
            ...emptyDraft('6E'),
            name: 'Probe',
            frameworks: [{kind: 'elementalControl', name: 'EC', reserve: 22, modifiers: [], slots: [blast({variable: true})]}],
        }) as unknown as Obj).powers.power as Obj[];

        expect(slots[0].ultraSlot).toBeUndefined();
    });
});
