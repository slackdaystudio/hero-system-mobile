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

import {copyIdentity, findConflict, shareId, type LibraryEntry} from 'core/share';

const library: LibraryEntry[] = [
    {id: 'brick.hsmc', name: 'Brick'},
    {id: 'generated-blur-1', name: 'Fire Blur'},
    {id: 'authored-sparrow', name: 'Sparrow'},
];

describe('shareId — an id from another phone is untrusted', () => {
    it.each([
        ['brick.hsmc', 'brick.hsmc'],
        ['generated-blur-1', 'generated-blur-1'],
        ['../../databases/hsm.db', 'databases_hsm.db'],
        ['Dr. Destroyo!', 'Dr._Destroyo'],
        ['...', 'character'],
        ['', 'character'],
    ])('%j → %j', (raw, safe) => {
        expect(shareId(raw)).toBe(safe);
    });
});

describe('findConflict', () => {
    it('finds the character a re-sent sheet would replace', () => {
        expect(findConflict('brick.hsmc', library)).toEqual({id: 'brick.hsmc', name: 'Brick'});
    });

    it('compares the sanitised id — the one that would actually be written', () => {
        expect(findConflict('/brick.hsmc', library)).toEqual({id: 'brick.hsmc', name: 'Brick'});
    });

    it('a free id is no conflict, even if the name is taken', () => {
        expect(findConflict('brick-from-dave.hsmc', library)).toBeNull();
    });
});

describe('copyIdentity — "import as copy"', () => {
    it('numbers the id and the name together, keeping the legacy suffix last', () => {
        expect(copyIdentity({id: 'brick.hsmc', name: 'Brick'}, library)).toEqual({id: 'brick-2.hsmc', name: 'Brick (2)'});
    });

    it('works for ids without the legacy suffix', () => {
        expect(copyIdentity({id: 'generated-blur-1', name: 'Fire Blur'}, library)).toEqual({id: 'generated-blur-1-2', name: 'Fire Blur (2)'});
    });

    it('skips a number if either the id or the name is already taken', () => {
        const crowded = [...library, {id: 'brick-2.hsmc', name: 'Something else'}, {id: 'unrelated', name: 'Brick (3)'}];

        expect(copyIdentity({id: 'brick.hsmc', name: 'Brick'}, crowded)).toEqual({id: 'brick-4.hsmc', name: 'Brick (4)'});
    });

    it('sanitises before numbering', () => {
        expect(copyIdentity({id: '../authored-sparrow', name: 'Sparrow'}, library)).toEqual({id: 'authored-sparrow-2', name: 'Sparrow (2)'});
    });

    it('never returns an id already in the library', () => {
        const copy = copyIdentity({id: 'brick.hsmc', name: 'Brick'}, library);

        expect(library.map((entry) => entry.id)).not.toContain(copy.id);
    });
});
