import { Alert } from 'react-native';
import Sound from 'react-native-sound';
import { common } from '../lib/Common';

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

//////////////////////////////
// ACTION TYPES             //
//////////////////////////////

export const INITIALIZE_SOUNDS = 'INITIALIZE_SOUNDS';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function initializeSounds() {
    return async (dispatch) => {
        initSfx().then(sounds => {
            dispatch({
                type: INITIALIZE_SOUNDS,
                payload: sounds,
            });
        });
    };
}

let initSfx = async () => {
    let sounds = {
        "dice": null,
        "sfx_acid": null,
        "sfx_air": null,
        "sfx_earth": null,
        "sfx_electricity": null,
    };

    Sound.setCategory('Playback');

    try {
        for (let soundName of Object.keys(sounds)) {
            sounds[soundName] = await new Sound(`${soundName}.mp3`);
        }
    } catch (error) {
        Alert.alert(error.message);
    }

    return sounds;
}

let soundState = {
    sfx: {}
};

export default function sounds(state = soundState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_SOUNDS:
            newState = {...state};

            for (let [key, sound] of Object.entries(action.payload)) {
                newState.sfx[key] = sound;
            }

            return newState;
        default:
            return state;
    }
}
