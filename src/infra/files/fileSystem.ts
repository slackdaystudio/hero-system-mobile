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
 * Minimal filesystem seam. The {@link FileImageStore} is written against this so
 * it can run against an in-memory fs in tests and RNFS (react-native-fs) in the
 * app. Paths are absolute; `readdir` returns bare entry names.
 */
export interface FileSystem {
    mkdirp(dir: string): Promise<void>;
    writeFile(path: string, bytes: Uint8Array): Promise<void>;
    readFile(path: string): Promise<Uint8Array>;
    unlink(path: string): Promise<void>;
    exists(path: string): Promise<boolean>;
    readdir(dir: string): Promise<string[]>;
}

/** An in-memory {@link FileSystem} for tests. */
export const inMemoryFileSystem = (): FileSystem & {size(): number} => {
    const files = new Map<string, Uint8Array>();

    return {
        mkdirp: async () => {},
        writeFile: async (path, bytes) => {
            files.set(path, bytes);
        },
        readFile: async (path) => {
            const bytes = files.get(path);
            if (bytes === undefined) {
                throw new Error(`ENOENT: ${path}`);
            }
            return bytes;
        },
        unlink: async (path) => {
            files.delete(path);
        },
        exists: async (path) => files.has(path),
        readdir: async (dir) => {
            const prefix = `${dir}/`;
            return [...files.keys()].filter((path) => path.startsWith(prefix)).map((path) => path.slice(prefix.length));
        },
        size: () => files.size,
    };
};
