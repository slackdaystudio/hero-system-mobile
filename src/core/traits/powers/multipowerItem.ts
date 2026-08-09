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

import {heroDesignerCharacter} from 'core/hero';
import {roundInPlayersFavor} from 'core/util';
import type {Attribute} from '../characterTrait';
import {TraitDecorator} from '../traitDecorator';

/**
 * A multipower slot: real cost is the slot's cost divided by the pool factor.
 *
 * **H13 (docs/KNOWN_DEVIATIONS.md) — fixed here; legacy is not the oracle.** Legacy read
 * `ultraSlot` off the `CharacterTrait` *wrapper*, which never carries it, so the condition was
 * always false and every slot divided by 10. Two separate mistakes were hiding behind that:
 *
 * 1. The field lives on the **trait** (`ULTRA_SLOT="Yes"`, camel-cased by the `.hdc` parser), not
 *    on the wrapper. A cast was what stopped the compiler saying so.
 * 2. The branches were **inverted**, because legacy had the terminology backwards — its
 *    `attributes()` labels `ultraSlot: true` as "Variable"/"Flexible". An **ultra slot is the
 *    fixed kind**: one power, at full value, one at a time. 6E renamed ultra → *fixed* and multi
 *    → *variable*. Flexibility is what you pay for, so a fixed slot is the cheaper one.
 *
 * So: **fixed ÷ 10, variable ÷ 5** — the ratios legacy already had, attached to the right branch.
 * The fixed side is confirmed against the corpus rather than argued: all 75 multipower slots in
 * the 37 fixtures are `ULTRA_SLOT="Yes"`, and pricing them at ÷10 lands junkyard exactly on its
 * declared budget and greyman, starborne, spyder and twilight within a handful of points, in both
 * editions. Forcing ÷5 pushes every one of them 11–39 points over. See `multipowerSlot.test.ts`.
 *
 * Only an explicit `ULTRA_SLOT="No"` reads as variable. An absent field stays fixed — HERO
 * Designer writes the attribute on every slot it emits (174 of them across every `.hdc` on hand),
 * so absence means malformed input, and the safe answer there is the behaviour that shipped.
 */
export default class MultipowerItem extends TraitDecorator {
    realCost(): number {
        return roundInPlayersFavor(this.characterTrait.realCost() / (this.isVariable() ? 5 : 10));
    }

    /**
     * The sheet says which kind of slot this is, because the two now cost different numbers and
     * nothing else on the card would explain the difference.
     *
     * Legacy had this line and the port dropped it. It is restored with the terminology the
     * editions actually use — 5E calls them **ultra** and **multi** slots, 6E renamed those to
     * **fixed** and **variable** — rather than legacy's "Variable"/"Flexible", which named the
     * fixed kind after the flexible one and was the visible half of H13.
     */
    attributes(): Attribute[] {
        const fifth = heroDesignerCharacter.isFifth(this.characterTrait.getCharacter());
        const variable = this.isVariable();

        return [
            ...this.characterTrait.attributes(),
            {label: 'Slot Type', value: fifth ? (variable ? 'Multi' : 'Ultra') : variable ? 'Variable' : 'Fixed'},
        ];
    }

    private isVariable(): boolean {
        return this.characterTrait.trait.ultraSlot === false;
    }
}
