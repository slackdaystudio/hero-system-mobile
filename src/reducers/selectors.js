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

const selectSettings = (state) => ({
    settings: state.settings,
    version: state.version,
});

export const selectResultData = createSelector([selectResult], (data) => data);

export const selectCharacterData = createSelector([selectCharacter], (data) => data);

export const selectSettingsData = createSelector([selectSettings], (data) => data);
