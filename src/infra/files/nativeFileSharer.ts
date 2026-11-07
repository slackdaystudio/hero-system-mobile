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

import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import type {FileSharer} from 'core/ports';
import {createFileSharer} from './fileSharer';
import {nativeFileSystem} from './nativeFileSystem';

/**
 * The device share sheet, via react-native-share (RN's own `Share` cannot attach a file on Android).
 *
 * Files go under the app's cache directory, which react-native-share's own FileProvider already
 * exposes (`<cache-path>` in its `share_download_paths.xml`), so no manifest change and no storage
 * permission is needed. Its provider's authority is `${applicationId}.rnshare.fileprovider`, which
 * does not collide with react-native-blob-util's `${applicationId}.provider`.
 */
export const nativeFileSharer = (): FileSharer =>
    createFileSharer(nativeFileSystem(), `${ReactNativeBlobUtil.fs.dirs.CacheDir}/share`, async ({url, mime, title}) => {
        // failOnCancel: false — a dismissed sheet resolves with `dismissedAction` rather than throwing,
        // so a real failure is the only thing that rejects.
        const result = await Share.open({url, type: mime, title, failOnCancel: false});

        return {dismissed: result.dismissedAction === true || !result.success};
    });
