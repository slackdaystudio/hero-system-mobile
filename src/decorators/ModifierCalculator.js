import CharacterTrait from './CharacterTrait';
import {common} from '../lib/Common';
import {heroDesignerCharacter, SKILL_ENHANCERS} from '../lib/HeroDesignerCharacter';
import {modifierDecorator} from './modifiers/ModifierDecorator';

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

export default class ModifierCalculator extends CharacterTrait {
    constructor(characterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;

        this.modifiers = this._getItemTotalModifiers(characterTrait);
    }

    cost() {
        return this.characterTrait.cost();
    }

    costMultiplier() {
        return this.characterTrait.costMultiplier();
    }

    activeCost() {
        // Characteristics with 0 levels with advantages are calculated like naked advantages
        if (heroDesignerCharacter.isCharacteristic(this.characterTrait.trait) && this.characterTrait.trait.levels === 0) {
            return common.roundInPlayersFavor(this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0))) - this.cost();
        }

        let activeCost = this.cost() * (1 + this.advantages().reduce((a, b) => a + b.cost, 0));

        return common.roundInPlayersFavor(activeCost);
    }

    realCost() {
        let realCost = common.roundInPlayersFavor(this.activeCost() / (1 - this.limitations().reduce((a, b) => a + b.cost, 0)));

        if (this.characterTrait.parentTrait !== undefined && SKILL_ENHANCERS.includes(this.characterTrait.parentTrait.xmlid.toUpperCase())) {
            realCost = realCost - 1 <= 0 ? 1 : realCost - 1;
        }

        return realCost;
    }

    label() {
        return this.characterTrait.label();
    }

    attributes() {
        return this.characterTrait.attributes();
    }

    definition() {
        return this.characterTrait.definition();
    }

    roll() {
        return this.characterTrait.roll();
    }

    advantages() {
        return this.modifiers.filter((m) => m.cost >= 0);
    }

    limitations() {
        return this.modifiers.filter((m) => m.cost < 0);
    }

    _getItemTotalModifiers(trait, totalModifiers = []) {
        if (common.isEmptyObject(trait.trait)) {
            return totalModifiers;
        }

        const rawModifiers = new Map();

        this._addModifier(trait.trait.modifier, trait, rawModifiers);

        if (trait.hasOwnProperty('parentTrait') && trait.parentTrait && trait.parentTrait.type === 'list') {
            this._addModifier(trait.parentTrait.modifier, trait.parentTrait, rawModifiers);
        }

        let decorated = null;

        for (const [owningTrait, modifiers] of rawModifiers) {
            for (const modifier of modifiers) {
                decorated = modifierDecorator.decorate(modifier, owningTrait, this.characterTrait.getCharacter);

                this._filterDuplicateModifiers(decorated, modifier.xmlid, totalModifiers);
            }
        }

        return totalModifiers;
    }

    _filterDuplicateModifiers(newModifier, xmlid, totalModifiers) {
        let isExclusive = true;

        if (newModifier.modifier.template !== undefined) {
            isExclusive = newModifier.modifier.template.exclusive;
        }

        const existingModifier = totalModifiers.find((m) => m.xmlid === xmlid && isExclusive);

        if (existingModifier === undefined) {
            totalModifiers.push({
                xmlid: xmlid,
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

    _addModifier(modifier, trait, rawModifiers) {
        if (common.isEmptyObject(modifier)) {
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
            modifiers.push(modifier);
        }
    }
}
