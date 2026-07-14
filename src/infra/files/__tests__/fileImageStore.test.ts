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

import {inMemoryFileSystem} from '../fileSystem';
import {FileImageStore} from '../fileImageStore';

const IMAGES_DIR = '/Documents/images';

const setup = () => {
    const fs = inMemoryFileSystem();
    let counter = 0;
    const store = new FileImageStore(fs, IMAGES_DIR, () => `id${++counter}`);
    return {fs, store};
};

describe('FileImageStore', () => {
    it('writes bytes to <imagesDir>/<id>.<ext> and returns the filename as the id', async () => {
        const {fs, store} = setup();

        const id = await store.put(new Uint8Array([1, 2, 3]), 'image/jpeg');

        expect(id).toBe('id1.jpg');
        expect(await fs.readFile(`${IMAGES_DIR}/id1.jpg`)).toEqual(new Uint8Array([1, 2, 3]));
    });

    it('maps mime types to extensions, falling back to .bin', async () => {
        const {store} = setup();

        expect(await store.put(new Uint8Array(), 'image/png')).toBe('id1.png');
        expect(await store.put(new Uint8Array(), 'image/webp')).toBe('id2.webp');
        expect(await store.put(new Uint8Array(), 'application/octet-stream')).toBe('id3.bin');
    });

    it('builds a file:// uri under the images dir', () => {
        const {store} = setup();

        expect(store.uri('id1.jpg')).toBe('file:///Documents/images/id1.jpg');
    });

    it('deletes a stored file and tolerates deleting a missing one', async () => {
        const {fs, store} = setup();
        const id = await store.put(new Uint8Array([9]), 'image/png');
        expect(fs.size()).toBe(1);

        await store.delete(id);
        expect(fs.size()).toBe(0);

        await expect(store.delete(id)).resolves.toBeUndefined();
    });

    it('sweeps orphaned files, keeping referenced ones', async () => {
        const {fs, store} = setup();
        const keep = await store.put(new Uint8Array([1]), 'image/jpeg');
        await store.put(new Uint8Array([2]), 'image/jpeg'); // orphan
        await store.put(new Uint8Array([3]), 'image/jpeg'); // orphan

        const removed = await store.sweepOrphans(new Set([keep]));

        expect(removed).toBe(2);
        expect(fs.size()).toBe(1);
        expect(await fs.readFile(`${IMAGES_DIR}/${keep}`)).toEqual(new Uint8Array([1]));
    });

    it('sweeps nothing when the images dir is empty', async () => {
        const {store} = setup();

        expect(await store.sweepOrphans(new Set())).toBe(0);
    });
});
