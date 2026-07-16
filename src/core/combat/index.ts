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

export {CombatDetails, combatDetails} from './combatDetails';
export {
    addStatus,
    adjustCombatValue,
    clearStatuses,
    combatMaximums,
    describeStatus,
    enduranceBurnDice,
    initialCombatState,
    normalizeCombatState,
    reconcilePhases,
    removeStatus,
    resetCombatValues,
    resetVital,
    setVital,
    spendEndurance,
    startNewTurn,
    STATUS_NAMES,
    takeRecovery,
    togglePhaseAborted,
    togglePhaseUsed,
    updateStatus,
    type CombatMaximums,
    type CombatPhase,
    type CombatState,
    type CombatStatus,
    type CombatValueKey,
    type StatusName,
    type Vital,
} from './combatTracker';
