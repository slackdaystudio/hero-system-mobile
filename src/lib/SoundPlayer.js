import Sound from 'react-native-sound';
import {common} from './Common';
import {sounds, setSound} from '../../App.js';

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

const MAX_PLAY_SOUND_ATTEMPTS = 50;

const PLAY_SOUND_ATTEMPT_DELAY = 5;

const DEFAULT_SFX_NAME = 'Default';

const DEFAULT_SOUND = 'dice';

const VOLUME = {electricity: 0.1};

class SoundPlayer {
    play(name) {
        try {
            name = this._getClipName(name);

            if (!sounds.hasOwnProperty(name)) {
                this.initialize(name);
            } else {
                let clip = sounds[DEFAULT_SOUND];

                if (sounds[name].initialized) {
                    clip = sounds[name];
                }

                this._playClip(clip);
            }
        } catch (error) {
            // Ignore errors
            console.log('Error playing sound:', error);
        }
    }

    stop(name) {
        name = this._getClipName(name);

        if (sounds.hasOwnProperty(name)) {
            if (sounds[name].initialized && sounds[name].sound.isLoaded() && sounds[name].sound.isPlaying()) {
                sounds[name].sound.stop();
            }
        }
    }

    initialize(name, playOnLoad = true) {
        if (name === null || name === undefined || name === '') {
            return null;
        }

        name = this._getClipName(name);

        if (sounds.hasOwnProperty(name)) {
            return null;
        }

        let clip = {initialized: false, sound: null, volume: 1.0};

        let sound = new Sound(`${name}.mp3`, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                setSound(name, clip);
            }

            clip.initialized = true;
            clip.sound = sound;

            if (VOLUME.hasOwnProperty(name)) {
                clip.volume = VOLUME[name];
            }

            setSound(name, clip);

            if (playOnLoad) {
                this._playClip(clip);
            }
        });
    }

    _playClip(clip, attempts = 0) {
        try {
            // Attempt to load the clip up to 50x, sleeping for 5ms in between attempts
            if (attempts < MAX_PLAY_SOUND_ATTEMPTS && !clip.sound.isLoaded()) {
                attempts++;

                setTimeout(() => this._playClip(clip, attempts), PLAY_SOUND_ATTEMPT_DELAY);
            } else {
                clip.sound.setVolume(clip.volume);

                // Stop the sound if it's already playing
                clip.sound.stop(() => {
                    clip.sound.play();
                });
            }
        } catch (error) {
            common.toast(error.message);
        }
    }

    _getClipName(name) {
        if (name === null || name === undefined) {
            return DEFAULT_SOUND;
        }

        name = name === DEFAULT_SFX_NAME ? DEFAULT_SOUND : name;

        return common.toSnakeCase(name);
    }
}

export let soundPlayer = new SoundPlayer();
