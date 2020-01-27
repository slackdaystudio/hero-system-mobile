import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { common } from './Common';

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

class Permission {
    async askForWrite() {
        if (Platform.OS === 'android') {
            try {
                let check = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);

                if (check === PermissionsAndroid.RESULTS.GRANTED) {
                    return check;
                }

                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'File System Access',
                        message: 'HERO System Mobile needs write access to your device to save characters and sounds',
                        buttonPositive: 'Continue',
                    }
                );

                return granted === null || granted === undefined ? false : granted === 'granted';
            } catch (error) {
                common.toast(error.message);
            }
        } else if (Platform.OS === 'ios') {
            return true;
        }

        return false;
    }
}

export let permission = new Permission();
