import { combineReducers } from 'redux';
import character from './character';
import combat from './combat';
import forms from './forms';
import settings from './settings';
import statistics from './statistics';
import randomHero from './randomHero';

// Copyright 2020 Philip J. Guinchard
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

export default combineReducers({
   character,
   combat,
   forms,
   settings,
   statistics,
   randomHero
});
