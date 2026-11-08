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

import type {FileSharer, ShareableFile} from 'core/ports';
import type {FileSystem} from './fileSystem';

/** What the native share sheet is asked to do: share one local file. */
export interface ShareSheetRequest {
    /** A percent-encoded `file://` URL. */
    url: string;
    mime: string;
    title: string;
}

/** The native share sheet, reduced to the one call this needs. `true` when the player dismissed it. */
export type OpenShareSheet = (request: ShareSheetRequest) => Promise<{dismissed: boolean}>;

/**
 * A {@link FileSharer} that writes the file into `shareDir` and hands the share sheet a URL to it.
 *
 * The file is **not** deleted after the sheet closes. The sheet returning does not mean the
 * receiver has finished reading: Android's Quick Share and mail clients read the URI after the
 * chooser is gone, and deleting the file then breaks the share. So the folder is emptied before
 * each new share instead, which leaves at most one stale file — and it is in the cache directory,
 * where the OS may also reclaim it.
 *
 * Written against the {@link FileSystem} seam and an injected {@link OpenShareSheet} so all of this
 * runs in node; `nativeFileSharer` binds the real ones.
 */
export function createFileSharer(fs: FileSystem, shareDir: string, open: OpenShareSheet): FileSharer {
    return {
        async share(file: ShareableFile) {
            await fs.mkdirp(shareDir);

            for (const stale of await fs.readdir(shareDir).catch(() => [] as string[])) {
                await fs.unlink(`${shareDir}/${stale}`).catch(() => undefined);
            }

            const path = `${shareDir}/${file.fileName}`;
            await fs.writeFile(path, file.bytes);

            const {dismissed} = await open({url: fileUrl(path), mime: file.mime, title: file.title});

            return dismissed ? 'dismissed' : 'shared';
        },
    };
}

/**
 * `file://` + the path, each segment percent-encoded. Character names keep their spaces in the file
 * name, and iOS's `NSURL` will not parse a URL containing a raw space; a `#` would cut the path off
 * as a fragment on both platforms. Both decode it back to the same path.
 */
export function fileUrl(path: string): string {
    return `file://${path.split('/').map(encodeURIComponent).join('/')}`;
}
