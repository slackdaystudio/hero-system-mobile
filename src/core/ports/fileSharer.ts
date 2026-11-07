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

/** A file to hand to the platform's share sheet. */
export interface ShareableFile {
    bytes: Uint8Array;
    /** What the recipient sees, extension included — e.g. `Fire Brick.hsm`. */
    fileName: string;
    mime: string;
    /** Share-sheet heading where the platform shows one (Android's chooser title). */
    title: string;
}

/**
 * Platform share-sheet capability: AirDrop, Quick Share, Messages, mail, Files — whatever the
 * phone offers. Resolves `'dismissed'` when the player closes the sheet without choosing; that is
 * not an error. Rejects only when the share itself could not be started.
 */
export interface FileSharer {
    share(file: ShareableFile): Promise<'shared' | 'dismissed'>;
}
