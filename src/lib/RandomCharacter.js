import archtypes from '../../public/templates/archtypes.json';
import specialFx from '../../public/templates/specialfx.json';
import skills from '../../public/templates/skills.json';
import disadvantages from '../../public/templates/disadvantages.json';

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

class RandomCharacter {
    generate() {
        let archtype = this._getArchtype();

        return {
		    name: '',
            archtype: archtype,
            gender: this._getGender(),
            specialFx: this._getSpecialFx(),
            powers: this._getPowers(archtype),
            skills: this._getSkills(),
            disadvantages: this._getDisadvantages(),
        };
    }

    _getArchtype() {
        return archtypes.archtypes[Math.floor(Math.random() * archtypes.archtypes.length)];
    }

    _getGender() {
        return Math.random() < 0.5 ? 'Male' : 'Female';
    }

    _getSpecialFx() {
        return specialFx.effects[Math.floor(Math.random() * specialFx.effects.length)];
    }

    _getPowers(archtype) {
        return archtype.powersets[Math.floor(Math.random() * archtype.powersets.length)];
    }

    _getSkills() {
        return skills.skillsets[Math.floor(Math.random() * skills.skillsets.length)];
    }

    _getDisadvantages() {
        return disadvantages.disadvantagePackages[Math.floor(Math.random() * disadvantages.disadvantagePackages.length)];
    }
}

export let randomCharacter = new RandomCharacter();
