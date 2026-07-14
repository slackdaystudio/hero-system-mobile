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

import {DieRoller, PartialDie, RollType} from 'core/dice';
import type {Rng} from 'core/ports';
import {characteristicRollRequest, describeRoll, performRoll, statisticsRollsFor, traitRollRequest} from '../rollRequest';

const scriptedRoller = (faces: number[]): DieRoller => {
    let index = 0;
    const rng: Rng = {next: () => faces[index++ % faces.length]};
    return new DieRoller(rng);
};

describe('rollRequest', () => {
    it('turns a characteristic roll into a skill-check request', () => {
        expect(characteristicRollRequest('13-', 'STR')).toEqual({mode: 'skill', threshold: 13, label: 'STR'});
        expect(characteristicRollRequest(null, 'STR')).toBeNull();
        expect(characteristicRollRequest(undefined, 'STR')).toBeNull(); // a trait can decorate to an undefined roll
    });

    it('turns decorated trait rolls into the matching requests', () => {
        expect(traitRollRequest({roll: '12-', type: RollType.SkillCheck}, 'Stealth')).toEqual({mode: 'skill', threshold: 12, label: 'Stealth'});
        expect(traitRollRequest({roll: '10d6', type: RollType.NormalDamage}, 'Blast')).toEqual({mode: 'normal', dice: 10, partialDie: PartialDie.None, label: 'Blast'});
        expect(traitRollRequest({roll: '2½d6', type: RollType.KillingDamage}, 'HKA')).toEqual({mode: 'killing', dice: 2, partialDie: PartialDie.Half, label: 'HKA'});
        expect(traitRollRequest({roll: '8d6', type: RollType.Effect}, 'Aid')).toEqual({mode: 'effect', dice: 8, partialDie: PartialDie.None, label: 'Aid'});
        expect(traitRollRequest(null, 'x')).toBeNull();
        expect(traitRollRequest(undefined, 'x')).toBeNull(); // guards against a decorated undefined roll (would crash the sheet)
    });

    it('performs a request and summarises the result', () => {
        const roller = scriptedRoller([3]); // every die is a 3

        const skill = performRoll(roller, {mode: 'skill', threshold: 13});
        expect(describeRoll(skill)).toEqual({title: 'Skill Check', lines: ['Rolled 9', 'Made by 4'], dice: [3, 3, 3]});

        const effect = performRoll(roller, {mode: 'effect', dice: 4, partialDie: PartialDie.None});
        expect(describeRoll(effect).lines).toEqual(['Effect 12']);
    });

    it('maps a damage result to a statistics roll with stun/body', () => {
        const roller = scriptedRoller([6]);
        const damage = performRoll(roller, {mode: 'normal', dice: 3, partialDie: PartialDie.None});

        const [stat] = statisticsRollsFor(damage);
        expect(stat.rollType).toBe(RollType.NormalDamage);
        expect(typeof stat.stun).toBe('number');
        expect(typeof stat.body).toBe('number');
    });
});
