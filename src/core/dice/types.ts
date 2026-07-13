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
 * Kind of roll being made. Numeric values are load-bearing: they are persisted
 * in results and matched by downstream consumers (statistics, "roll again"), so
 * they must stay identical to the legacy `DieRoller` constants.
 */
export enum RollType {
    SkillCheck = 1,
    ToHit = 2,
    NormalDamage = 3,
    KillingDamage = 4,
    Effect = 5,
    HitLocations = 6,
    Knockback = 7,
}

/** Fractional die appended to a damage/effect roll. Values match legacy. */
export enum PartialDie {
    None = 0,
    PlusOne = 1,
    Half = 2,
    MinusOne = 3,
}

/** Inclusive die-face bounds. */
export const ROLL_MIN = 1;
export const D6_MAX = 6;
export const D3_MAX = 3;

/** Hit-location modifiers looked up from a 3d6 location roll. */
export interface HitLocationDetails {
    location: string;
    stunX: number;
    nStun: number;
    bodyX: number;
}

/** Input describing a damage roll (formerly the Redux `damageForm`). */
export interface DamageForm {
    dice: number;
    damageType: RollType.NormalDamage | RollType.KillingDamage;
    partialDie: PartialDie;
    stunMultiplier: number;
    useHitLocations: boolean;
    useFifthEdition?: boolean;
    isMartialManeuver: boolean;
    isTargetFlying: boolean;
    isTargetInZeroG: boolean;
    isTargetUnderwater: boolean;
    rollWithPunch: boolean;
    isUsingClinging: boolean;
    isExplosion: boolean;
    fadeRate: number;
    sfx: string | null;
}

/** Input describing an effect roll (formerly the Redux `effectForm`). */
export interface EffectForm {
    dice: number;
    partialDie: PartialDie;
    effectType?: string;
    sfx?: string | null;
    [key: string]: unknown;
}

/** One ring of an explosion's fade-out table. */
export interface ExplosionRing {
    distance: number;
    stun: number;
    body: number;
    knockback: number;
}

/** The raw dice component shared by every roll result. */
export interface DiceRoll {
    rollType: RollType;
    total: number;
    rolls: number[];
    partialDieType: PartialDie;
}

export interface SkillCheckResult extends DiceRoll {
    rollType: RollType.SkillCheck;
    /** Target number (string, sans trailing '-'), or -1 when none supplied. */
    threshold: string | number;
}

export interface ToHitResult extends DiceRoll {
    rollType: RollType.ToHit;
    hitCv: number;
    cv: number | string;
    isAutofire: boolean;
    targetDcv: number;
    /** Present only for autofire rolls. */
    hits?: number;
}

export interface ToHitResults {
    results: ToHitResult[];
}

export interface DamageResult extends DiceRoll {
    rollType: RollType.NormalDamage | RollType.KillingDamage;
    damageForm: DamageForm;
    sfx: string | null;
    stunMultiplier?: number;
    stunModifier?: number;
    hitLocationDetails: HitLocationDetails;
    body: number;
    stun: number;
    knockback: number;
    knockbackRollTotal?: number;
    explosion?: ExplosionRing[];
}

export interface EffectResult extends DiceRoll {
    rollType: RollType.Effect;
    effectForm: EffectForm;
}

export type LastRoll = SkillCheckResult | ToHitResults | DamageResult | EffectResult;
