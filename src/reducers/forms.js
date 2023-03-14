import {createSlice} from '@reduxjs/toolkit';
import {NORMAL_DAMAGE} from '../lib/DieRoller';

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

const initializeSkillForm = () => {
    return {
        skillCheck: false,
        value: 8,
    };
};

const initializeHitForm = () => {
    return {
        ocv: 0,
        numberOfRolls: 1,
        isAutofire: false,
        targetDcv: 0,
        selectedLocation: -1,
    };
};

const initializeDamageForm = () => {
    return {
        dice: 12,
        partialDie: '0',
        killingToggled: false,
        damageType: NORMAL_DAMAGE,
        stunMultiplier: 0,
        useHitLocations: false,
        isMartialManeuver: false,
        isTargetFlying: false,
        isTargetInZeroG: false,
        isTargetUnderwater: false,
        rollWithPunch: false,
        isUsingClinging: false,
        isExplosion: false,
        fadeRate: 1,
        sfx: null,
    };
};

const initializeEffectForm = () => {
    return {
        dice: 1,
        partialDie: '0',
        effectType: 'None',
        sfx: null,
    };
};

const initializeCostCruncherForm = () => {
    return {
        cost: 5,
        advantages: 0,
        limitations: 0,
    };
};

const initializeStatusForm = () => {
    return {
        name: 'Aid',
        label: '',
        activePoints: 0,
        targetTrait: null,
        targetTraitType: null,
        fadeRate: 0,
        segments: 0,
        body: 0,
        pd: 0,
        ed: 0,
        index: -1,
    };
};

const formsState = {
    skill: initializeSkillForm(),
    hit: initializeHitForm(),
    damage: initializeDamageForm(),
    effect: initializeEffectForm(),
    costCruncher: initializeCostCruncherForm(),
    status: initializeStatusForm(),
};

const formsSlice = createSlice({
    name: 'forms',
    initialState: formsState,
    reducers: {
        updateFormValue: (state, action) => {
            const {formName, key, value} = action.payload;

            state[formName][key] = value;
        },
        updateForm: (state, action) => {
            const {type, json} = action.payload;
            let form = null;

            switch (type) {
                case 'damage':
                    form = initializeDamageForm();
                    break;
                case 'effect':
                    form = initializeEffectForm();
                    break;
                case 'hit':
                    form = initializeHitForm();
                    break;
                case 'status':
                    form = initializeStatusForm();
                    break;
                default:
                // Do nothing
            }

            if (form !== null) {
                state[type] = form;

                for (const [key, value] of Object.entries(json)) {
                    if (state[type].hasOwnProperty(key)) {
                        state[type][key] = value;
                    }
                }
            }
        },
        resetForm: (state, action) => {
            const {formName} = action.payload;

            let reinitializedForm = null;

            switch (formName) {
                case 'skill':
                    reinitializedForm = initializeSkillForm();
                    break;
                case 'hit':
                    reinitializedForm = initializeHitForm();
                    break;
                case 'damage':
                    reinitializedForm = initializeDamageForm();
                    break;
                case 'effect':
                    reinitializedForm = initializeEffectForm();
                    break;
                case 'costCruncher':
                    reinitializedForm = initializeCostCruncherForm();
                    break;
                case 'status':
                    reinitializedForm = initializeStatusForm();
                    break;
                default:
                // Do nothing
            }

            if (reinitializedForm !== null) {
                state[formName] = {...reinitializedForm};
            }
        },
    },
});

export const {updateFormValue, updateForm, resetForm} = formsSlice.actions;

export default formsSlice.reducer;
