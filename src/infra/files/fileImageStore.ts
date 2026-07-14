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

import type {ImageStore} from 'core/ports';
import type {FileSystem} from './fileSystem';

const EXTENSIONS: Readonly<Record<string, string>> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
};

const extensionFor = (mime: string): string => EXTENSIONS[mime.toLowerCase()] ?? 'bin';

const uuid = (): string =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        const value = char === 'x' ? random : (random % 4) + 8;
        return value.toString(16);
    });

/**
 * {@link ImageStore} backed by files on disk (via a {@link FileSystem}). Portrait
 * bytes are stored as `<imagesDir>/<uuid>.<ext>`; `portrait_id` is that filename.
 * Keeps images out of the DB/JSON entirely — the core performance fix.
 */
export class FileImageStore implements ImageStore {
    constructor(
        private readonly fs: FileSystem,
        private readonly imagesDir: string,
        private readonly generateId: () => string = uuid,
    ) {}

    async put(bytes: Uint8Array, mime: string): Promise<string> {
        const id = `${this.generateId()}.${extensionFor(mime)}`;

        await this.fs.mkdirp(this.imagesDir);
        await this.fs.writeFile(this.pathOf(id), bytes);

        return id;
    }

    uri(imageId: string): string {
        return `file://${this.imagesDir}/${imageId}`;
    }

    async delete(imageId: string): Promise<void> {
        if (await this.fs.exists(this.pathOf(imageId))) {
            await this.fs.unlink(this.pathOf(imageId));
        }
    }

    /** Delete every image file not present in `referencedIds`. Returns the count removed. */
    async sweepOrphans(referencedIds: ReadonlySet<string>): Promise<number> {
        const entries = await this.fs.readdir(this.imagesDir).catch(() => [] as string[]);
        let removed = 0;

        for (const entry of entries) {
            if (!referencedIds.has(entry)) {
                await this.fs.unlink(this.pathOf(entry));
                removed++;
            }
        }

        return removed;
    }

    private pathOf(imageId: string): string {
        return `${this.imagesDir}/${imageId}`;
    }
}
