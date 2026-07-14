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

import {type Obj} from '../characterTrait';
import Aoe from './aoe';
import Dot from './dot';
import Modifier from './modifier';

/** Wraps a raw modifier in its cost decorator, ported from legacy `ModifierDecorator`. */
class ModifierDecorator {
    decorate(modifier: Obj, trait: Obj, getCharacter: () => Obj): Modifier {
        let decorated = new Modifier(modifier, trait, getCharacter);

        switch (modifier.xmlid.toUpperCase()) {
            case 'AOE':
                decorated = new Aoe(decorated);
                break;
            case 'DAMAGEOVERTIME':
                decorated = new Dot(decorated);
                break;
            default:
            // do nothing
        }

        return decorated;
    }
}

export const modifierDecorator = new ModifierDecorator();
