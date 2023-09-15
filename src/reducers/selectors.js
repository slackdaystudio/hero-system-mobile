import {createSelector} from '@reduxjs/toolkit';

const selectResult = (state) => ({
    playSounds: state.settings.playSounds,
    onlyDiceSounds: state.settings.onlyDiceSounds,
    useFifthEdition: state.settings.useFifthEdition,
});

const selectCharacter = (state) => ({
    character: state.character.character,
    characters: state.character.characters,
    forms: state.forms,
});

export const selectResultData = createSelector([selectResult], (data) => data);

export const selectCharacterData = createSelector([selectCharacter], (data) => data);
