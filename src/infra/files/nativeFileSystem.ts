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

import ReactNativeBlobUtil from 'react-native-blob-util';
import {base64ToBytes, bytesToBase64} from './base64';
import type {FileSystem} from './fileSystem';

const fs = ReactNativeBlobUtil.fs;

/**
 * {@link FileSystem} backed by react-native-blob-util — the on-device file IO
 * (New-Architecture safe on RN 0.79). Binary crosses the bridge as base64, so
 * bytes are encoded/decoded with the pure {@link bytesToBase64} util. Chosen over
 * react-native-fs, whose New-Arch codegen spec fails to build; the swap is one
 * file precisely because file IO sits behind the FileSystem port.
 */
export const nativeFileSystem = (): FileSystem => ({
    mkdirp: async (dir) => {
        // blob-util's mkdir throws if the directory already exists.
        if (!(await fs.exists(dir))) {
            await fs.mkdir(dir);
        }
    },
    writeFile: (path, bytes) => fs.writeFile(path, bytesToBase64(bytes), 'base64'),
    readFile: async (path) => base64ToBytes((await fs.readFile(path, 'base64')) as string),
    unlink: (path) => fs.unlink(path),
    exists: (path) => fs.exists(path),
    readdir: (dir) => fs.ls(dir),
});

/** Absolute path to the app's document directory (the images root's parent). */
export const documentDirectoryPath = (): string => fs.dirs.DocumentDir;
