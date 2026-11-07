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

import {createFileSharer, fileUrl, type ShareSheetRequest} from '../fileSharer';
import {inMemoryFileSystem} from '../fileSystem';
import {filePathFromUri} from '../fileUri';

const file = (fileName: string, bytes = new Uint8Array([1, 2, 3])) => ({bytes, fileName, mime: 'application/zip', title: `Share ${fileName}`});

describe('createFileSharer', () => {
    it('writes the file and hands the sheet a URL to it', async () => {
        const fs = inMemoryFileSystem();
        const requests: ShareSheetRequest[] = [];
        const sharer = createFileSharer(fs, '/cache/share', async (request) => {
            requests.push(request);

            return {dismissed: false};
        });

        expect(await sharer.share(file('Fire Brick.hsm'))).toBe('shared');

        expect(requests).toEqual([{url: 'file:///cache/share/Fire%20Brick.hsm', mime: 'application/zip', title: 'Share Fire Brick.hsm'}]);
        // The URL decodes back to the file actually written — what each platform does with it.
        expect(await fs.readFile(filePathFromUri(requests[0].url))).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('a dismissed sheet is reported, not thrown', async () => {
        const sharer = createFileSharer(inMemoryFileSystem(), '/cache/share', async () => ({dismissed: true}));

        expect(await sharer.share(file('Brick.hsm'))).toBe('dismissed');
    });

    it('keeps the file after the sheet closes — receivers read it later — and clears it on the next share', async () => {
        const fs = inMemoryFileSystem();
        const sharer = createFileSharer(fs, '/cache/share', async () => ({dismissed: false}));

        await sharer.share(file('Brick.hsm'));
        expect(await fs.readdir('/cache/share')).toEqual(['Brick.hsm']);

        await sharer.share(file('Sparrow.hsm'));
        expect(await fs.readdir('/cache/share')).toEqual(['Sparrow.hsm']);
    });

    it('a share that cannot start rejects', async () => {
        const sharer = createFileSharer(inMemoryFileSystem(), '/cache/share', async () => {
            throw new Error('no activity found');
        });

        await expect(sharer.share(file('Brick.hsm'))).rejects.toThrow('no activity found');
    });
});

describe('fileUrl', () => {
    it.each([
        ['/cache/share/Brick.hsm', 'file:///cache/share/Brick.hsm'],
        ['/cache/share/Fire Brick.hsm', 'file:///cache/share/Fire%20Brick.hsm'],
        ['/cache/share/Agent #7.hsm', 'file:///cache/share/Agent%20%237.hsm'],
        ['/var/Library/Caches/share/Señor Dios.hsm', 'file:///var/Library/Caches/share/Se%C3%B1or%20Dios.hsm'],
    ])('%s → %s, and back', (path, url) => {
        expect(fileUrl(path)).toBe(url);
        expect(filePathFromUri(fileUrl(path))).toBe(path);
    });
});
