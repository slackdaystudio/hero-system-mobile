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

import {CharacterTrait, type Attribute, type RollDescriptor} from './characterTrait';

/**
 * Delegating base for every trait decorator. Wraps another `CharacterTrait` and
 * forwards all methods to it; concrete decorators extend this and override only
 * what they change. This is behaviour-identical to the legacy decorators, which
 * each extend `CharacterTrait` and hand-delegate the untouched methods — the
 * shared base just removes that boilerplate across the 79 files.
 */
export class TraitDecorator extends CharacterTrait {
    protected characterTrait: CharacterTrait;

    constructor(characterTrait: CharacterTrait) {
        super(characterTrait.trait, characterTrait.listKey, characterTrait.getCharacter);

        this.characterTrait = characterTrait;
    }

    cost(): number {
        return this.characterTrait.cost();
    }

    costMultiplier(): number {
        return this.characterTrait.costMultiplier();
    }

    activeCost(): number {
        return this.characterTrait.activeCost();
    }

    realCost(): number {
        return this.characterTrait.realCost();
    }

    label(): string {
        return this.characterTrait.label();
    }

    attributes(): Attribute[] {
        return this.characterTrait.attributes();
    }

    definition(): string {
        return this.characterTrait.definition();
    }

    roll(): RollDescriptor | null {
        return this.characterTrait.roll();
    }

    advantages(): any[] | null {
        return this.characterTrait.advantages();
    }

    limitations(): any[] | null {
        return this.characterTrait.limitations();
    }
}
