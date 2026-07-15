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

/** Phase 3 of docs/RANDOM_CHARACTER.md — the structured complication packages. */
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator} from 'core/traits';
import {ARCHETYPES_5E} from '../allocate';
import {buildCharacteristics} from '../characteristics';
import {attachComplications, COMPLICATION_SETS_5E, type ComplicationSet} from '../complications';
import {LOW_POWERED_5E} from '../powerLevel';

type Obj = Record<string, any>;

const build = (set: ComplicationSet): Obj => {
    const archetype = ARCHETYPES_5E.find((candidate) => candidate.name === 'Energy Projector')!;
    const parsed = attachComplications(buildCharacteristics(archetype.characteristics, LOW_POWERED_5E.template, 'Test'), set);

    return heroDesignerCharacter.getCharacter(parsed) as unknown as Obj;
};

const rows = (character: Obj): Array<{label: string; cost: number}> =>
    (character.disadvantages as Obj[]).map((disadvantage) => ({
        label: String(disadvantage.input ?? disadvantage.alias),
        cost: characterTraitDecorator.decorate(disadvantage, 'disadvantages', () => character).cost(),
    }));

const total = (character: Obj): number => rows(character).reduce((sum, row) => sum + row.cost, 0);

describe('complication packages — 5E Low Powered', () => {
    it('lifted all four', () => {
        expect(COMPLICATION_SETS_5E.map((set) => set.label)).toEqual(['Hunted Hero', 'Code Of The Hero', 'Code Versus Killing', 'Honorable']);
    });

    /**
     * The check that matters: disadvantages are taken at the level's **fixed limit**, so a package
     * must total exactly it. Nothing in the data states a cost — each disadvantage is priced from
     * its adders by the engine.
     */
    it.each(COMPLICATION_SETS_5E.map((set) => [set.label, set] as const))('%s totals exactly the limit', (_label, set) => {
        expect(total(build(set))).toBe(LOW_POWERED_5E.limit);
        expect(LOW_POWERED_5E.limit).toBe(100);
    });

    it('prices each disadvantage the way the legacy prose described it', () => {
        const byLabel = new Map(rows(build(COMPLICATION_SETS_5E[0])).map((row) => [row.label, row.cost]));

        // Legacy: "DNPC: Loved One (Normal) 8-", 10 — Appears 8- (5) + Normal usefulness (5).
        expect(byLabel.get('Loved One')).toBe(10);

        // "Hunted: Arch Enemy (As Powerful) 8-", 10 — 8- (0) + As Powerful (10).
        expect(byLabel.get('Arch Enemy')).toBe(10);

        // "Hunted: Government Agency (More Powerful/NCI/Watch) 8-", 10 — the interesting one:
        // More Powerful (15) + NCI (5) − Watching (10) nets back to 10.
        expect(byLabel.get('Government Agency')).toBe(10);

        // "PsyL: Code Of The Hero (Very Common/Strong)", 20 — Very Common (15) + Strong (5).
        expect(byLabel.get('Code Of The Hero')).toBe(20);

        // "PsyL: Overconfidence (Very Common/Moderate)", 15 — Moderate adds nothing.
        expect(byLabel.get('Overconfidence')).toBe(15);

        // "SocL: Secret Identity (Occasionally/Major)", 10 — Occasionally (5) + Major (5).
        expect(byLabel.get('Secret Identity')).toBe(10);

        // "Vuln: ... (Very Common)", 15 — a single adder.
        expect(byLabel.get('Ambushes/Treacherous Attacks, 1 1/2x STUN')).toBe(15);
    });

    it('carries the description in `input`, so the sheet can name it', () => {
        const character = build(COMPLICATION_SETS_5E[0]);

        expect((character.disadvantages as Obj[]).every((disadvantage) => disadvantage.xmlid === 'NCM' || typeof disadvantage.input === 'string')).toBe(true);
        expect(rows(character).map((row) => row.label)).toContain('Code Of The Hero');
    });

    it('states no cost anywhere in the data — every price is derived', () => {
        const stated = JSON.stringify(COMPLICATION_SETS_5E);

        expect(stated).not.toContain('"cost"');
        expect(stated).not.toContain('"disadvantagePackages"');
    });
});
