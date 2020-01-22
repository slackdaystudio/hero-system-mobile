import React from 'react';
import { Alert } from 'react-native';
import Sound from 'react-native-sound';
import { common } from './Common';
import { sounds, setSound } from '../../App.js';

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

const DEFAULT_SOUND = 'dice';

const VOLUME = {
    "sfx_electricity": 0.10
}

class SoundPlayer {
    play(name) {
        let clip = sounds[DEFAULT_SOUND];

        if (name !== null && name !== undefined && name !== '') {
            if (sounds.hasOwnProperty(name)) {
                if (sounds[name].initialized) {
                    clip = sounds[name];
                }
            } else {
                clip = this.initialize(name);
            }
        }

        // The sound may still be loading so check it and add a slight delay if it is
        if (clip.sound.isLoaded()) {
            this._playClip(clip);
        } else {
            setTimeout(() => this._playClip(clip), 100);
        }
    }

    initialize(name=DEFAULT_SOUND) {
        if (sounds.hasOwnProperty(name)) {
            return null;
        }

        let sound = null;
        let clip = {
            initialized: false,
            sound: null,
            volume: 1.0,
        };

        try {
            sound = new Sound(`${name}.mp3`, Sound.MAIN_BUNDLE, (error) => {
                if (error) {
                    common.toast(`Unable to load the sound ${name}`);
                    return;
                }
            });

            clip.initialized = true;
            clip.sound = sound;

            if (VOLUME.hasOwnProperty(name)) {
                clip.volume = VOLUME[name];
            }
        } catch (error) {
            common.toast(`Unable to initialize the sound ${name}`);
        } finally {
            setSound(name, clip);
        }

        return clip;
    }

    _playClip(clip) {
        try {
            clip.sound.setVolume(clip.volume);

            // Stop the sound if it's already playing
            clip.sound.stop(() => {
                clip.sound.play();
            });
        } catch (error) {
            common.toast(error.message);
        }
    }
}

export let soundPlayer = new SoundPlayer();
