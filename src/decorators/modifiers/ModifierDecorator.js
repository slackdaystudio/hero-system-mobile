import { Alert } from 'react-native';
import Aoe from './Aoe';
import Dot from './Dot';
import Modifier from './Modifier';

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

const AOE = 'AOE';

const DAMAGEOVERTIME = 'DAMAGEOVERTIME';

class ModifierDecorator {
    decorate(modifier, trait) {
        let decorated = new Modifier(modifier, trait);

        switch (modifier.xmlid.toUpperCase()) {
            case AOE:
                decorated = new Aoe(decorated);
                break;
            case DAMAGEOVERTIME:
                decorated = new Dot(decorated);
                break;
            default:
                    // do nothing
        }

        return decorated;
    }
}

export let modifierDecorator = new ModifierDecorator();
