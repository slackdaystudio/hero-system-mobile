import { Alert } from 'react-native';
import { common } from '../lib/Common';
import {
    KILLING_DAMAGE,
    NORMAL_DAMAGE,
    PARTIAL_DIE_PLUS_ONE,
    PARTIAL_DIE_HALF,
    PARTIAL_DIE_MINUS_ONE
} from '../lib/DieRoller';

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const UPDATE_FORM_VALUE = 'UPDATE_FORM_VALUE';

export const UPDATE_FORM = 'UPDATE_FORM';

export const RESET_FORM = 'RESET_FORM';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function updateFormValue(formName, key, value) {
    return {
        type: UPDATE_FORM_VALUE,
        payload: {
            formName: formName,
            key: key,
            value: value
        }
    };
}

export function updateForm(type, json) {
    return {
        type: UPDATE_FORM,
        payload: {
            type: type,
            json: json
        }
    }
}

export function resetForm(formKey) {
    return {
        type: RESET_FORM,
        payload: formKey
    }
}

function _copyState(state) {
    return {
       ...state,
       skill: {
           ...state.skill
       },
       hit: {
           ...state.hit
       },
       damage: {
           ...state.damage
       },
       freeForm: {
           ...state.freeForm
       },
       costCruncher: {
           ...state.costCruncher
       }
   };
}

function _initializeSkillForm() {
    return {
        skillCheck: false,
        value: 8
    };
}

function _initializeHitForm() {
    return {
       ocv: 0,
       numberOfRolls: 1,
       isAutofire: false,
       targetDcv: 0,
       selectedLocation: -1
   };
}

function _initializeDamageForm() {
    return {
        dice: 12,
        partialDie: "0",
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
        useFifthEdition: false
    };
}

function _initializeFreeFormForm() {
     return {
         dice: 1,
         halfDice: 0,
         pips: 0
     };
 }

function _initializeCostCruncherForm() {
    return {
       cost: 5,
       advantages: 0,
       limitations: 0
   };
}

formsState = {
    skill: _initializeSkillForm(),
    hit: _initializeHitForm(),
    damage: _initializeDamageForm(),
    freeForm: _initializeFreeFormForm(),
    costCruncher: _initializeCostCruncherForm()
};

export default function forms(state = formsState, action) {
    let newState = null

    switch (action.type) {
        case UPDATE_FORM_VALUE:
            newState = _copyState(state);
            newState[action.payload.formName][action.payload.key] = action.payload.value;

            return newState;
        case UPDATE_FORM:
            let form = null;

            switch(action.payload.type) {
                case 'damage':
                    form = _initializeDamageForm();
                    break;
                case 'freeForm':
                    form = _initializeFreeFormForm();
                    break;
                default:
                    // Do nothing
            }

            if (form !== null) {
                newState = _copyState(state);
                newState[action.payload.type] = form;

                for (let [key, value] of Object.entries(action.payload.json)) {
                    if (newState[action.payload.type].hasOwnProperty(key)) {
                        newState[action.payload.type][key] = value;
                    }
                }

                return newState;
            }

            return state;
        case RESET_FORM:
            let reinitializedForm = null;

            switch(action.payload) {
                case 'skill':
                    reinitializedForm = _initializeSkillForm();
                    break;
                case 'hit':
                    reinitializedForm = _initializeHitForm();
                    break;
                case 'damage':
                    reinitializedForm = _initializeDamageForm();
                    break;
                case 'freeForm':
                    reinitializedForm = _initializeFreeFormForm();
                    break;
                case 'costCruncher':
                    reinitializedForm = _initializeCostCruncherForm();
                    break;
                default:
                    // Do nothing
            }

            if (reinitializedForm !== null) {
                newState = _copyState(state);
                newState[action.payload] = reinitializedForm;

                return newState;
            }

            return state;
        default:
            return state;
    }
}
