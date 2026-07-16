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
 * Reading {@link RuleOfXStats} off a built character.
 *
 * Kept apart from `ruleOfX` on purpose. The formula is a faithful port of a spreadsheet and is
 * checked against Excel's own numbers to six decimals — it is either right or wrong. **This file is
 * not like that.** The spreadsheet's inputs are prose written for a human filling cells in by hand
 * ("the maximum DC a character can generate", "the largest defensive power"), and a human reading
 * their own character sheet resolves that with judgement. Automating it means making those calls
 * explicitly, and they are marked below.
 *
 * So: a wrong number here is a judgement to argue with, not a bug. Keeping it out of `ruleOfX.ts`
 * keeps the part that *can* be verified verifiable.
 */
import {heroDesignerCharacter} from 'core/hero';
import {characterTraitDecorator, type Obj} from 'core/traits';
import type {RuleOfXStats} from './ruleOfX';

/**
 * HERO Designer classifies its own powers, and its word is better than a list of ours.
 *
 * Every power template carries a `type`: Entangle is `["STANDARD","ATTACK"]`, Resistant Protection
 * is `["STANDARD","DEFENSE"]`, Flight is neither. Two hand-maintained sets used to live here and
 * both were wrong — they had Missile Deflection and Knockback Resistance out on the reasoning that
 * they avoid damage rather than add defence, and HD calls both DEFENSE.
 *
 * **ATTACK and `doesdamage` are different questions, and both are needed.** Entangle is an attack
 * that deals no damage: it counts for oAP ("the largest attack power") and contributes nothing to
 * DC. Reading `doesdamage` for oAP is what made an Entangle specialist score as unarmed.
 */
const typesOf = (power: Obj): string[] => {
    const type: unknown = power.template?.type;

    return Array.isArray(type) ? type.map(String) : typeof type === 'string' ? [type] : [];
};

const isAttack = (power: Obj): boolean => typesOf(power).includes('ATTACK');

const isDefensive = (power: Obj): boolean => typesOf(power).includes('DEFENSE');

/** Whether a power actually deals damage — only these can raise a character's DC. */
const doesDamage = (power: Obj): boolean => power.template?.doesdamage === true;

/**
 * Movement powers that count toward velocity.
 *
 * These aren't typed by HD (they're neither ATTACK nor DEFENSE), so this list is ours.
 * `TELEPORTATION` is absent by instruction — "DO NOT include Teleportation". It moves you without
 * ever giving you a speed to hit something with.
 */
const MOVEMENT_POWERS: ReadonlySet<string> = new Set(['RUNNING', 'SWIMMING', 'LEAPING', 'FLIGHT', 'GLIDING', 'SWINGING', 'TUNNELING', 'FTL', 'EXTRADIMENSIONALMOVEMENT']);

/**
 * The three modes everyone already has, which a power of the same name **adds to**.
 *
 * Flight starts at nothing, so a Flight power's levels *are* its metres. Running starts at 12, so a
 * Running +24 power is a 36m character — reading the power alone under-reads them by the base.
 */
const BASE_MOVEMENT: ReadonlySet<string> = new Set(['RUNNING', 'SWIMMING', 'LEAPING']);

const toArray = (value: unknown): Obj[] => (Array.isArray(value) ? (value as Obj[]) : value === undefined || value === null ? [] : [value as Obj]);

/** `getTotalDefense` hands back `"total/resistant"`; `getTotalUnusualDefense` does the same. */
function splitDefense(value: string): {total: number; resistant: number} {
    const [total, resistant] = String(value).split('/');

    return {total: parseFloat(total) || 0, resistant: parseFloat(resistant) || 0};
}

/**
 * Dice out of a roll string: `"12½d6"` → 12.5, `"3d6+1"` → 3⅓, `"2d6"` → 2.
 *
 * A pip is a third of a die and a half-die is a half, which is how HERO counts damage classes.
 */
export function diceOf(roll: string | null | undefined): number {
    if (typeof roll !== 'string') {
        return 0;
    }

    const match = /^(\d+)(½)?d6(?:([+-])1)?/.exec(roll.trim());

    if (match === null) {
        return 0;
    }

    const [, whole, half, pip] = match;

    return parseInt(whole, 10) + (half ? 0.5 : 0) + (pip === '+' ? 1 / 3 : pip === '-' ? -1 / 3 : 0);
}

/**
 * A trait's damage classes, from the dice the engine says it throws.
 *
 * `roll()` is the authority and is used rather than any arithmetic here, because it already folds in
 * everything that moves a number: STR into a hand-to-hand power, and **Extra DCs into a martial
 * maneuver**. Reading `maneuver.dc` alone under-reads a martial artist badly — their damage is
 * mostly technique, and Extra DCs are where the technique is bought.
 */
function damageClassesOf(trait: Obj, key: string, character: Obj): number {
    let roll: string | null = null;

    try {
        roll = (characterTraitDecorator.decorate(trait, key, () => character).roll()?.roll as string) ?? null;
    } catch {
        return 0; // a trait the engine can't roll contributes nothing rather than throwing
    }

    return diceOf(roll) * (trait.template?.killing === true ? 3 : 1);
}

const activeCostOf = (trait: Obj, key: string, character: Obj): number => {
    try {
        return characterTraitDecorator.decorate(trait, key, () => character).activeCost();
    } catch {
        return 0;
    }
};

/**
 * Read the Rule of X inputs off a character the engine has already built.
 *
 * Where the spreadsheet's prose needed a decision, the decision is commented. The rest is the
 * engine's own numbers — characteristics and defences are asked of it rather than recomputed, so
 * 5E's figured stats and 6E's bought ones both come out right without an edition branch here.
 */
export function ruleOfXStats(built: Obj): RuleOfXStats {
    /**
     * **`showSecondary` is not optional here.** An Only-In-Alternate-Identity trait is
     * `affectsPrimary: false, affectsTotal: true`, and the engine correctly hides it unless the
     * character is in that identity — so a costumed hero read flat comes out with no defences at
     * all. starborne is the proof: PD 8/0 as parsed, PD 20/12 with this set, because its Resistant
     * Protection is OIHID.
     *
     * The spreadsheet settles it: "All input variables assume the highest possible values a
     * character can generate (without pushing)". In costume is the highest.
     */
    const character: Obj = {...built, showSecondary: true};
    const total = (name: string): number => heroDesignerCharacter.getCharacteristicTotal(name, character);

    const pd = splitDefense(heroDesignerCharacter.getTotalDefense(character, 'PD'));
    const ed = splitDefense(heroDesignerCharacter.getTotalDefense(character, 'ED'));

    const powers = toArray(character.powers);
    const attacks = powers.filter(isAttack);
    const defences = powers.filter(isDefensive);

    // "Characters EGO, include Mental Defense in this total".
    const ego = total('EGO') + splitDefense(heroDesignerCharacter.getTotalUnusualDefense(character, 'MENTALDEFENSE')).total;

    /**
     * "Characters DEX, include Lightning Reflexes" — a talent, and only ever an initiative bonus.
     *
     * The xmlid is `LIGHTNING_REFLEXES_ALL` even for a single-action buy: 5E had a separate
     * `_SINGLE` xmlid, and 6E folded that into an *option* of the one talent. Matching on
     * `LIGHTNING_REFLEXES` exactly, as this did, matched nothing at all.
     */
    const lightningReflexes = toArray(character.talents)
        .filter((talent) => String(talent.xmlid).toUpperCase().startsWith('LIGHTNING_REFLEXES'))
        .reduce((best, talent) => Math.max(best, Number(talent.levels) || 0), 0);

    // "All Combat Skill Levels the character owns". Skill Levels and Penalty Skill Levels are not
    // Combat Skill Levels, whatever their xmlid looks like.
    const csl = toArray(character.skills)
        .filter((skill) => String(skill.xmlid).toUpperCase() === 'COMBAT_LEVELS')
        .reduce((sum, skill) => sum + (Number(skill.levels) || 0), 0);

    /**
     * "The maximum DC a character can generate ... DO include martial maneuvers."
     *
     * Three sources and the largest wins. Only traits that actually *do damage* count — an Entangle
     * is an attack but deals none, so it raises oAP and not this. Every one is priced by the
     * engine's own `roll()`, which folds in STR and Extra DCs alike: a martial artist with STR 18
     * punches for 3, and reaches the campaign's 12 through Offensive Strike and five Extra DCs.
     *
     * The bare punch is the floor, for a Brick with no attack power at all.
     */
    const punch = Math.floor(total('STR') / 5);
    const maneuvers = toArray(character.martialArts).filter(doesDamage);
    const dc = Math.max(
        punch,
        ...attacks.filter(doesDamage).map((power) => damageClassesOf(power, 'powers', character)),
        ...maneuvers.map((maneuver) => damageClassesOf(maneuver, 'martialArts', character)),
    );

    /**
     * "The maximum velocity the character can generate."
     *
     * `character.movement` only carries the base modes (Running/Swimming/Leaping) — a Flight power
     * never reaches it — so the movement powers are read separately. starborne is the proof: 12m of
     * Running on the movement rows, 40m of Flight in the powers.
     */
    const modes = toArray(character.movement);
    const baseOf = (mode: string): number => Number(modes.find((row) => String(row.shortName).toUpperCase() === mode)?.value) || 0;
    const movementPowers = powers
        .filter((power) => MOVEMENT_POWERS.has(String(power.xmlid).toUpperCase()))
        .map((power) => {
            const mode = String(power.xmlid).toUpperCase();

            // A Running power adds to the 12m everyone walks; a Flight power is all there is.
            return (Number(power.levels) || 0) + (BASE_MOVEMENT.has(mode) ? baseOf(mode) : 0);
        });
    const velocity = Math.max(0, ...modes.map((mode) => Number(mode.value) || 0), ...movementPowers);

    return {
        ego,
        con: total('CON'),
        dex: total('DEX') + lightningReflexes,
        spd: total('SPD'),
        csl,
        ocv: total('OCV'),
        dcv: total('DCV'),
        omcv: total('OMCV'),
        dmcv: total('DMCV'),
        dc: Math.floor(dc),
        oap: Math.max(0, ...attacks.map((power) => activeCostOf(power, 'powers', character))),
        // "(PD + ED) / 2" and "(rPD + rED) / 2" — the engine's totals, so powers are already in them.
        def: (pd.total + ed.total) / 2,
        rdef: (pd.resistant + ed.resistant) / 2,
        stun: total('STUN'),
        body: total('BODY'),
        dap: Math.max(0, ...defences.map((power) => activeCostOf(power, 'powers', character))),
        velocity,
    };
}
