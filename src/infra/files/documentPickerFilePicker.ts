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

import {errorCodes, isErrorWithCode, keepLocalCopy, pick, types} from '@react-native-documents/picker';
import type {FilePicker, PickedFile} from 'core/ports';
import type {FileSystem} from './fileSystem';

/**
 * {@link FilePicker} over the native document picker. Picks any file (`.hdc` has no
 * registered MIME/UTI), copies it into app storage so it is readable, then reads
 * the bytes through the injected {@link FileSystem}. Returns null when the user
 * cancels (the picker rejects with OPERATION_CANCELED).
 */
export function createDocumentPickerFilePicker(fileSystem: FileSystem): FilePicker {
    return {
        async pickCharacter(): Promise<PickedFile | null> {
            let picked;
            try {
                [picked] = await pick({type: [types.allFiles]});
            } catch (error) {
                if (isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED) {
                    return null;
                }
                throw error;
            }

            if (picked === undefined) {
                return null;
            }

            const name = picked.name ?? 'character.hdc';
            const [copy] = await keepLocalCopy({files: [{uri: picked.uri, fileName: name}], destination: 'cachesDirectory'});
            if (copy.status !== 'success') {
                throw new Error(copy.copyError ?? 'Could not read the selected file');
            }

            const bytes = await fileSystem.readFile(copy.localUri.replace(/^file:\/\//, ''));

            return {name, bytes};
        },
    };
}
