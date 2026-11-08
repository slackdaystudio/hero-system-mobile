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

/**
 * The Import button's action, over real SQLite: one picker, two kinds of file. The picker is a fake
 * that hands back fixed bytes; everything after it is the code the device runs.
 */
import React from 'react';
import {readFileSync} from 'fs';
import {join} from 'path';
import {Alert} from 'react-native';
import {act, create} from 'react-test-renderer';
import {strToU8, zipSync} from 'fflate';
import type {Character, FilePicker} from 'core/ports';
import {MANIFEST_ENTRY, SHARE_FORMAT} from 'core/share';
import {FileImageStore} from 'infra/files/fileImageStore';
import {inMemoryFileSystem} from 'infra/files/fileSystem';
import {importHdc, type ImportResult} from 'infra/import';
import {createBetterSqlite3Database} from 'infra/persistence/driver/betterSqlite3Database';
import {createRepositories, type Repositories} from 'infra/persistence/repositories';
import {packCharacter} from 'infra/share';
import {ImportProvider, ReceiveError, alertConflict, receiveFailureMessage, useImportCharacter, type ResolveConflict} from 'app/providers/ImportProvider';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';

const RAW_DIR = join(__dirname, '../../../../fixtures/characters');
const hdc = (): Uint8Array => new Uint8Array(readFileSync(join(RAW_DIR, 'Defensor.hdc')));

const library = (): Repositories => {
    let n = 0;

    return createRepositories(createBetterSqlite3Database(), new FileImageStore(inMemoryFileSystem(), '/images', () => `p${n++}`));
};

const picking = (name: string, bytes: Uint8Array | null): FilePicker => ({pickCharacter: async () => (bytes === null ? null : {name, bytes})});

/** A `.hsm` of Defensor, built the way the sender's phone builds one. */
const defensorShare = async (): Promise<Uint8Array> => {
    const sender = library();
    const {id} = await importHdc(hdc(), 'Defensor.hdc', sender);

    return (await packCharacter((await sender.characters.get(id)) as Character, inMemoryFileSystem(), {appVersion: '2.9.1', schemaVersion: 8, exportedAt: ''}))
        .bytes;
};

const runImport = async (repos: Repositories, picker: FilePicker, resolveConflict: ResolveConflict = async () => 'copy'): Promise<ImportResult | null> => {
    let action: (() => Promise<ImportResult | null>) | null = null;

    function Probe(): null {
        action = useImportCharacter();

        return null;
    }

    await act(async () => {
        create(
            <RepositoriesProvider repositories={repos}>
                <ImportProvider filePicker={picker} resolveConflict={resolveConflict}>
                    <Probe />
                </ImportProvider>
            </RepositoriesProvider>,
        );
    });

    return (action as unknown as () => Promise<ImportResult | null>)();
};

describe('ImportProvider — one button, two kinds of file', () => {
    it('a .hdc imports as it always has', async () => {
        const repos = library();

        expect(await runImport(repos, picking('Defensor.hdc', hdc()))).toEqual({id: 'Defensor.hsmc', name: 'Defensor'});
        expect((await repos.characters.get('Defensor.hsmc'))?.origin).toBe('imported');
    });

    it('a .hsm is received', async () => {
        const repos = library();

        expect(await runImport(repos, picking('Defensor.hsm', await defensorShare()))).toEqual({id: 'Defensor.hsmc', name: 'Defensor'});
    });

    it('is told apart by content, not by name — a share renamed by Drive still imports as a share', async () => {
        const repos = library();
        await importHdc(hdc(), 'Defensor.hdc', repos);

        // Named like a .hdc, but it's a zip: it must go down the share path, which asks about the clash.
        // The .hdc path would have silently overwritten instead.
        const asked: string[] = [];
        await runImport(repos, picking('Defensor.hdc', await defensorShare()), async (existing) => {
            asked.push(existing.name);

            return 'copy';
        });

        expect(asked).toEqual(['Defensor']);
        expect(await repos.characters.list()).toHaveLength(2);
    });

    it('cancelling the picker is null, not an error', async () => {
        expect(await runImport(library(), picking('x', null))).toBeNull();
    });

    it('cancelling the clash prompt is null too — the button treats it like a cancelled picker', async () => {
        const repos = library();
        await importHdc(hdc(), 'Defensor.hdc', repos);

        expect(await runImport(repos, picking('Defensor.hsm', await defensorShare()), async () => 'cancel')).toBeNull();
        expect(await repos.characters.list()).toHaveLength(1);
    });

    describe('a shared file that fails says why, in words a player can act on', () => {
        const manifest = (overrides: object): Uint8Array =>
            zipSync({[MANIFEST_ENTRY]: strToU8(JSON.stringify({format: SHARE_FORMAT, formatVersion: 1, ...overrides}))});

        it.each<[string, Uint8Array, RegExp]>([
            ['a zip that is not ours', zipSync({'notes.txt': strToU8('hi')}), /isn't a HERO System Mobile character/],
            ['a newer format', manifest({formatVersion: 2}), /newer version.*Update the app/],
            ['a damaged file', manifest({exportedAt: 7}), /damaged/],
        ])('%s', async (_, bytes, message) => {
            const failure = runImport(library(), picking('x.hsm', bytes));

            await expect(failure).rejects.toBeInstanceOf(ReceiveError);
            await expect(failure).rejects.toThrow(message);
        });

        it('keeps the detail for bug reports, off the player-facing message', async () => {
            const error: ReceiveError = await runImport(library(), picking('x.hsm', manifest({exportedAt: 7}))).catch((caught) => caught);

            expect(error.result).toEqual({ok: false, reason: 'malformed', detail: 'exportedAt is missing'});
            expect(error.message).not.toContain('exportedAt');
        });

        it('has a message for a sheet that cannot be shown', () => {
            expect(receiveFailureMessage({ok: false, reason: 'undisplayable'})).toMatch(/could not be shown/);
        });
    });
});

describe('alertConflict — the device prompt', () => {
    type Button = {text: string; style?: string; onPress: () => void};

    const prompt = (existingName: string, incomingName: string) => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const choice = alertConflict({id: 'x', name: existingName}, {name: incomingName} as never);
        const [title, message, buttons, options] = alert.mock.calls[0] as [string, string, Button[], {onDismiss: () => void}];
        alert.mockRestore();

        return {choice, title, message, buttons, options};
    };

    it('offers Cancel, Replace and Import as copy — copy last, the preferred slot', () => {
        const {buttons} = prompt('Brick', 'Brick');

        expect(buttons.map((button) => button.text)).toEqual(['Cancel', 'Replace', 'Import as copy']);
        expect(buttons[1].style).toBe('destructive');
    });

    it.each([
        [0, 'cancel'],
        [1, 'replace'],
        [2, 'copy'],
    ] as const)('button %i resolves %s', async (index, expected) => {
        const {choice, buttons} = prompt('Brick', 'Brick');
        buttons[index].onPress();

        expect(await choice).toBe(expected);
    });

    it('dismissing it (Android back, tap outside) is a cancel', async () => {
        const {choice, options} = prompt('Brick', 'Brick');
        options.onDismiss();

        expect(await choice).toBe('cancel');
    });

    it('names both characters when the incoming one has been renamed', () => {
        expect(prompt('Brick', 'Fire Brick').message).toMatch(/"Brick".*"Fire Brick"/);
        expect(prompt('Brick', 'Brick').message).toMatch(/"Brick"/);
    });
});
