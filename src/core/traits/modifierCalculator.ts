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

import {isEmptyObject, roundInPlayersFavor} from 'core/util';
import {heroDesignerCharacter, SKILL_ENHANCERS} from 'core/hero';
import {CharacterTrait, hasOwn, type Obj} from './characterTrait';
import {TraitDecorator} from './traitDecorator';
import {modifierDecorator} from './modifiers/modifierDecorator';

interface TotalModifier {
    xmlid: string;
    label: string;
    cost: number;
}

/**
 * The universal advantage/limitation layer wrapped around *every* trait, ported
 * from legacy `decorators/ModifierCalculator.js`. Defines `activeCost` (cost ×
 * (1 + Σ advantages)) and `realCost` (activeCost / (1 − Σ limitations), plus the
 * skill-enhancer discount). The single most important numeric class in the stack.
 */
export default class ModifierCalculator extends TraitDecorator {
    private modifiers: TotalModifier[];

    constructor(characterTrait: CharacterTrait) {
        super(characterTrait);

        this.modifiers = this.getItemTotalModifiers(characterTrait as CharacterTrait & Obj);
    }

    activeCost(): number {
        // Characteristics with 0 levels with advantages are calculated like naked advantages.
        if (heroDesignerCharacter.isCharacteristic(this.characterTrait.trait) && this.characterTrait.trait.levels === 0) {
            return roundInPlayersFavor(this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0))) - this.cost();
        }

        const activeCost = this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0));

        return roundInPlayersFavor(activeCost);
    }

    realCost(): number {
        let realCost = roundInPlayersFavor(this.activeCost() / (1 - this.limitations().reduce((a, b) => a + b.cost, 0)));

        // A Skill Enhancer reduces each related Skill's cost by 1, to a minimum of 1 — but only for
        // Skills the character actually pays for. A free Skill (a native/everyman language, cost 0)
        // has nothing to reduce and must stay 0: the min-1 floor governs the reduction of a paid
        // Skill, it does not conjure a cost for a free one. See H12 in docs/KNOWN_DEVIATIONS.md.
        if (realCost > 0 && this.characterTrait.parentTrait !== undefined && SKILL_ENHANCERS.includes(this.characterTrait.parentTrait.xmlid.toUpperCase())) {
            realCost = realCost - 1 <= 0 ? 1 : realCost - 1;
        }

        return realCost;
    }

    advantages(): TotalModifier[] {
        return this.modifiers.filter((m) => m.cost >= 0);
    }

    limitations(): TotalModifier[] {
        return this.modifiers.filter((m) => m.cost < 0);
    }

    private getItemTotalModifiers(trait: CharacterTrait & Obj, totalModifiers: TotalModifier[] = []): TotalModifier[] {
        if (isEmptyObject(trait.trait)) {
            return totalModifiers;
        }

        const rawModifiers = new Map<Obj, Obj[]>();

        this.addModifier(trait.trait.modifier, trait, rawModifiers);

        if (hasOwn(trait, 'parentTrait') && trait.parentTrait && trait.parentTrait.type === 'list') {
            this.addModifier(trait.parentTrait.modifier, trait.parentTrait, rawModifiers);
        }

        for (const [owningTrait, modifiers] of rawModifiers) {
            for (const modifier of modifiers) {
                const decorated = modifierDecorator.decorate(modifier, owningTrait, this.characterTrait.getCharacter);

                this.filterDuplicateModifiers(decorated, modifier.xmlid, totalModifiers);
            }
        }

        return totalModifiers;
    }

    private filterDuplicateModifiers(newModifier: Obj, xmlid: string, totalModifiers: TotalModifier[]): void {
        let isExclusive = true;

        if (newModifier.modifier.template !== undefined) {
            isExclusive = newModifier.modifier.template.exclusive;
        }

        const existingModifier = totalModifiers.find((m) => m.xmlid === xmlid && isExclusive);

        if (existingModifier === undefined) {
            totalModifiers.push({
                xmlid,
                label: newModifier.label(),
                cost: newModifier.cost(),
            });
        } else {
            if (newModifier.cost() > existingModifier.cost) {
                existingModifier.label = newModifier.label();
                existingModifier.cost = newModifier.cost();
            }
        }
    }

    private addModifier(modifier: Obj | Obj[] | undefined, trait: Obj, rawModifiers: Map<Obj, Obj[]>): void {
        if (isEmptyObject(modifier)) {
            return;
        }

        const modifiers = rawModifiers.get(trait);

        if (modifiers === undefined) {
            if (Array.isArray(modifier)) {
                rawModifiers.set(trait, modifier);
            } else if (modifier !== undefined) {
                rawModifiers.set(trait, [modifier]);
            }
        } else {
            modifiers.push(modifier as Obj);
        }
    }
}
