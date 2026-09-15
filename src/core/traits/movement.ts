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
import {toMap} from 'core/util';
import {type Attribute, type Obj} from './characterTrait';
import {TraitDecorator} from './traitDecorator';

/**
 * Movement powers (Flight, Gliding, Swinging, Teleportation, Tunneling, Leaping),
 * ported from legacy `Movement.js`. Attribute-only: it prints the combat and
 * non-combat distance plus the km/h each works out to, and changes no cost.
 *
 * Running/Swimming/Leaping add the character's existing base movement; every other
 * mode starts from the levels bought. 5E doubles the base before the km/h maths and
 * measures in inches, 6E in metres.
 */
export default class Movement extends TraitDecorator {
    attributes(): Attribute[] {
        const attributes = this.characterTrait.attributes();
        const character = this.characterTrait.getCharacter();
        const isFifth = heroDesignerCharacter.isFifth(character);

        let baseMove = this.characterTrait.trait.levels + this.getBaseMove();
        const ncm = this.getNonCombatMultiplier();
        const unit = isFifth ? '"' : 'm';

        attributes.push({label: 'Combat Move', value: `${baseMove}${unit}`});
        attributes.push({label: 'Non-Combat Move', value: `${baseMove * ncm}${unit}`});

        if (isFifth) {
            baseMove *= 2;
        }

        const speed = heroDesignerCharacter.getCharacteristicTotal('SPD', character);

        attributes.push({label: 'Max Combat', value: `${((baseMove * speed * 5 * 60) / 1000).toFixed(1)} km/h`});
        attributes.push({label: 'Max Non-Combat', value: `${((baseMove * ncm * speed * 5 * 60) / 1000).toFixed(1)} km/h`});

        return attributes;
    }

    /** The character's existing movement for the modes that stack on it. */
    private getBaseMove(): number {
        const movementMap = toMap(this.characterTrait.getCharacter().movement, 'shortName');
        const mode = {LEAPING: 'Leaping', RUNNING: 'Running', SWIMMING: 'Swimming'}[this.characterTrait.trait.xmlid.toUpperCase() as string];

        return mode === undefined ? 0 : ((movementMap.get(mode) as Obj).value as number);
    }

    private getNonCombatMultiplier(): number {
        let ncm = 2;
        const adderMap = toMap(this.characterTrait.trait.adder);

        if (adderMap.has('IMPROVEDNONCOMBAT')) {
            ncm **= (adderMap.get('IMPROVEDNONCOMBAT') as Obj).levels + 1;
        }

        return ncm;
    }
}
