import {combineReducers} from 'redux';
import appState from './appState';
import character from './character';
import forms from './forms';
import settings from './settings';
import statistics from './statistics';
import randomHero from './randomHero';
import version from './version';

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

const rootReducer = combineReducers({
    appState,
    character,
    forms,
    settings,
    statistics,
    randomHero,
    version,
});

export default rootReducer;
