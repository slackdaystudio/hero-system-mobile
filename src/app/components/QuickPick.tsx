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
 * Quick Pick, inline: the grid plus its curate sheet, wired to the store.
 *
 * This is the whole switcher as it appears on Home. The character sheet hosts the same grid inside a
 * pull-up ({@link QuickPickSheet}); both share {@link useQuickPick}, so behaviour can't drift
 * between them.
 */
import React, {useMemo, useState} from 'react';
import {CharacterPickerModal} from './CharacterPickerModal';
import {QuickPickGrid} from './QuickPickGrid';
import {useQuickPick} from './useQuickPick';

export interface QuickPickProps {
    /** Open a chosen character. Quick Pick marks it active first. */
    onActivate: (id: string) => void;
    /** Bump to reload when the host regains focus. */
    refreshToken?: unknown;
}

export function QuickPick({onActivate, refreshToken}: QuickPickProps): React.JSX.Element {
    const {slots, candidates, activate, pin, removePin} = useQuickPick({onActivate, refreshToken});
    const [editing, setEditing] = useState<number | null>(null);

    // A character lives in one slot: never offer one that's already pinned somewhere.
    const pinnedIds = useMemo(() => new Set(slots.filter((slot) => slot.kind === 'pinned').map((slot) => slot.character!.id)), [slots]);
    const candidatesForPicker = useMemo(() => candidates.filter((character) => !pinnedIds.has(character.id)), [candidates, pinnedIds]);
    const canRemove = editing !== null && slots[editing]?.kind === 'pinned';

    return (
        <>
            <QuickPickGrid slots={slots} onActivate={activate} onEditSlot={setEditing} />
            <CharacterPickerModal
                visible={editing !== null}
                characters={candidatesForPicker}
                canRemove={canRemove}
                onPick={(id) => {
                    if (editing !== null) {
                        pin(editing, id);
                    }
                    setEditing(null);
                }}
                onRemove={() => {
                    if (editing !== null) {
                        removePin(editing);
                    }
                    setEditing(null);
                }}
                onClose={() => setEditing(null)}
            />
        </>
    );
}
