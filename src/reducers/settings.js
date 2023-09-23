import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {persistence} from '../lib/Persistence';

export const toggleSetting = createAsyncThunk('settings/toggleSetting', async ({key, value}) => {
    const settingValue = await persistence.toggleSetting(key, value);

    return {
        key,
        value: settingValue,
    };
});

export const clearApplicationSettings = createAsyncThunk('settings/clearApplicationSettings', async () => {
    return await persistence.clearApplicationSettings();
});

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        useFifthEdition: false,
        playSounds: true,
        onlyDiceSounds: false,
        showAnimations: true,
    },
    reducers: {
        initializeApplicationSettings: (state, action) => {
            const {settings} = action.payload;

            state.useFifthEdition = settings.useFifthEdition;
            state.playSounds = settings.playSounds;
            state.onlyDiceSounds = settings.onlyDiceSounds;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(toggleSetting.fulfilled, (state, action) => {
                const {key, value} = action.payload;

                state[key] = value;
            })
            .addCase(clearApplicationSettings.fulfilled, (state, action) => {
                const settings = {...action.payload};

                state.useFifthEdition = settings.useFifthEdition;
                state.playSounds = settings.playSounds;
                state.onlyDiceSounds = settings.onlyDiceSounds;
                state.showAnimations = settings.showAnimations;
            });
    },
});

export const {initializeApplicationSettings} = settingsSlice.actions;

export default settingsSlice.reducer;
