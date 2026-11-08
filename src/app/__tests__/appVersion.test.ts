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

import {readFileSync} from 'fs';
import {join} from 'path';
import {APP_VERSION} from 'app/appVersion';

const ROOT = join(__dirname, '../../..');
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');

describe('APP_VERSION follows the release', () => {
    it("matches Android's versionName", () => {
        expect(read('android/app/build.gradle')).toMatch(new RegExp(`^\\s*versionName "${APP_VERSION.replace(/\./g, '\\.')}"$`, 'm'));
    });

    it('matches every MARKETING_VERSION in the iOS project', () => {
        const versions = [...read('ios/herogmtools.xcodeproj/project.pbxproj').matchAll(/MARKETING_VERSION = ([^;]+);/g)].map((match) => match[1]);

        expect(versions.length).toBeGreaterThan(0);
        expect(new Set(versions)).toEqual(new Set([APP_VERSION]));
    });
});
