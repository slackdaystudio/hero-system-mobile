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
 * The share action as the button calls it: look the character up, pack it, hand the bytes to the
 * share sheet. The sheet is a fake that keeps what it was given, so each test can unpack the very
 * bytes a recipient would receive.
 */
import React from 'react';
import {act, create} from 'react-test-renderer';
import type {Character, FileSharer, ShareableFile} from 'core/ports';
import {inMemoryFileSystem} from 'infra/files/fileSystem';
import {SCHEMA_VERSION} from 'infra/persistence/migrations';
import type {Repositories} from 'infra/persistence/repositories';
import {SHARE_MIME, unpackCharacter} from 'infra/share';
import {APP_VERSION} from 'app/appVersion';
import {RepositoriesProvider} from 'app/providers/RepositoriesProvider';
import {ShareProvider, useShareCharacter, type ShareOutcome} from 'app/providers/ShareProvider';

const brick: Character = {
    id: 'generated-brick-1',
    name: 'Fire Brick',
    player: 'Dave',
    edition: '5E',
    isActive: false,
    portraitUri: 'file:///docs/images/p0.png',
    portraitFocus: null,
    filename: null,
    updatedAt: '2026-11-01T00:00:00.000Z',
    document: {characterInfo: {characterName: 'Fire Brick'}},
    origin: 'generated',
    recipe: {level: '5e-low'},
    source: null,
};

const repositoriesWith = (characters: Character[]) =>
    ({characters: {get: async (id: string) => characters.find((character) => character.id === id) ?? null}} as unknown as Repositories);

const recordingSharer = (result: 'shared' | 'dismissed' = 'shared'): FileSharer & {files: ShareableFile[]} => {
    const files: ShareableFile[] = [];

    return {
        files,
        share: async (file) => {
            files.push(file);

            return result;
        },
    };
};

const share = async (id: string, sharer: FileSharer, portrait?: Uint8Array): Promise<ShareOutcome> => {
    const fs = inMemoryFileSystem();

    if (portrait !== undefined) {
        await fs.writeFile('/docs/images/p0.png', portrait);
    }

    let action: ((id: string) => Promise<ShareOutcome>) | null = null;

    function Probe(): null {
        action = useShareCharacter();

        return null;
    }

    await act(async () => {
        create(
            <RepositoriesProvider repositories={repositoriesWith([brick])}>
                <ShareProvider fileSharer={sharer} fileSystem={fs} now={() => '2026-11-06T12:00:00.000Z'}>
                    <Probe />
                </ShareProvider>
            </RepositoriesProvider>,
        );
    });

    return (action as unknown as (id: string) => Promise<ShareOutcome>)(id);
};

describe('ShareProvider', () => {
    it('hands the share sheet a .hsm named for the character', async () => {
        const sharer = recordingSharer();

        expect(await share('generated-brick-1', sharer, new Uint8Array([9, 9]))).toEqual({result: 'shared', portraitIncluded: true});

        expect(sharer.files).toHaveLength(1);
        expect(sharer.files[0]).toMatchObject({fileName: 'Fire Brick.hsm', mime: SHARE_MIME, title: 'Share Fire Brick'});
    });

    it('the bytes are a readable share, stamped with this build', async () => {
        const sharer = recordingSharer();
        await share('generated-brick-1', sharer, new Uint8Array([9, 9]));

        const result = unpackCharacter(sharer.files[0].bytes);

        expect(result).toMatchObject({
            ok: true,
            received: {
                portrait: new Uint8Array([9, 9]),
                shared: {
                    exportedAt: '2026-11-06T12:00:00.000Z',
                    exportedBy: {appVersion: APP_VERSION, schemaVersion: SCHEMA_VERSION},
                    character: {id: 'generated-brick-1', name: 'Fire Brick', origin: 'generated', recipe: {level: '5e-low'}},
                },
            },
        });
    });

    it('an unreadable portrait still shares, and says so', async () => {
        const sharer = recordingSharer();

        expect(await share('generated-brick-1', sharer)).toEqual({result: 'shared', portraitIncluded: false});
        expect(sharer.files).toHaveLength(1);
    });

    it('passes a dismissed sheet through', async () => {
        expect((await share('generated-brick-1', recordingSharer('dismissed'), new Uint8Array([1]))).result).toBe('dismissed');
    });

    it('a character deleted out from under the button fails with something a player can read', async () => {
        const sharer = recordingSharer();

        await expect(share('gone', sharer)).rejects.toThrow('no longer in the library');
        expect(sharer.files).toHaveLength(0);
    });
});
