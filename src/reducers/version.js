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

export const INITIALIZE_VERSION = 'INITIALIZE_VERSION';

//////////////////////////////
// ACTIONS                  //
//////////////////////////////

export function updateForm(version) {
    return {
        type: INITIALIZE_VERSION,
        payload: version,
    };
}

let versionState = {};

export default function version(state = versionState, action) {
    let newState = null;

    switch (action.type) {
        case INITIALIZE_VERSION:
            newState = {...state};

            newState.version = action.payload;

            return newState;
        default:
            return state;
    }
}
