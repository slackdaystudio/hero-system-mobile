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

/** A file the user chose, with its display name and raw bytes. */
export interface PickedFile {
    name: string;
    bytes: Uint8Array;
}

/** Platform document-picker capability. Returns null if the user cancels. */
export interface FilePicker {
    pickCharacter(): Promise<PickedFile | null>;
}
