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

import type {CombatState} from 'core/combat';
import {createBetterSqlite3Database} from '../driver/betterSqlite3Database';
import {runMigrations} from '../migrations';
import {SqliteCombatStateRepository} from '../combatStateRepository';
import type {SqlDatabase} from '../driver/sqlDatabase';

const sampleState: CombatState = {
    stun: 20,
    body: 10,
    endurance: 30,
    ocv: 8,
    dcv: 8,
    omcv: 3,
    dmcv: 3,
    phases: {'6': {used: true, aborted: false}, '12': {used: false, aborted: true}},
};

const setup = (): {db: SqlDatabase; repo: SqliteCombatStateRepository} => {
    const db = createBetterSqlite3Database();
    runMigrations(db);
    db.execute('INSERT INTO characters (id, name, edition, data, updated_at) VALUES (?, ?, ?, ?, ?)', ['c1', 'Defensor', '6E', '{}', 't']);

    return {db, repo: new SqliteCombatStateRepository(db)};
};

describe('SqliteCombatStateRepository', () => {
    it('returns null before any state is saved', async () => {
        const {repo} = setup();
        expect(await repo.get('c1')).toBeNull();
    });

    it('round-trips a saved state', async () => {
        const {repo} = setup();
        await repo.save('c1', sampleState);
        expect(await repo.get('c1')).toEqual(sampleState);
    });

    it('overwrites on a second save (upsert)', async () => {
        const {repo} = setup();
        await repo.save('c1', sampleState);
        await repo.save('c1', {...sampleState, stun: 3});
        expect((await repo.get('c1'))?.stun).toBe(3);
    });

    it('clears a state', async () => {
        const {repo} = setup();
        await repo.save('c1', sampleState);
        await repo.clear('c1');
        expect(await repo.get('c1')).toBeNull();
    });

    it('is removed when the character is deleted (cascade)', async () => {
        const {db, repo} = setup();
        await repo.save('c1', sampleState);
        db.execute('DELETE FROM characters WHERE id = ?', ['c1']);
        expect(await repo.get('c1')).toBeNull();
    });
});
