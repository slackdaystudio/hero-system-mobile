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

import {DocumentDirectoryPath, exists, mkdir, readDir, readFile, unlink, writeFile} from '@dr.pogodin/react-native-fs';
import {base64ToBytes, bytesToBase64} from './base64';
import type {FileSystem} from './fileSystem';

/**
 * {@link FileSystem} backed by react-native-fs (the maintained fork, New-Arch
 * safe). RNFS speaks base64 strings for binary content, so bytes are encoded on
 * the way out and decoded on the way in. This is the on-device backing for
 * {@link FileImageStore}; the logic it drives is verified in node via the
 * in-memory filesystem.
 */
export const rnfsFileSystem = (): FileSystem => ({
    mkdirp: (dir) => mkdir(dir),
    writeFile: (path, bytes) => writeFile(path, bytesToBase64(bytes), 'base64'),
    readFile: async (path) => base64ToBytes(await readFile(path, 'base64')),
    unlink: (path) => unlink(path),
    exists: (path) => exists(path),
    readdir: async (dir) => (await readDir(dir)).map((entry) => entry.name),
});

/** Absolute path to the app's document directory (the images root's parent). */
export const documentDirectoryPath = (): string => DocumentDirectoryPath;
