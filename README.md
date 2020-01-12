# HERO System Mobile

This project is dedicated to providing the best possible mobile app for the HERO System family of games.  Since 2018, this application has been freely offered on the [Android Play Store](https://play.google.com/store/apps/details?id=com.herogmtools&hl=en_CA), [Apple App Store](https://apps.apple.com/us/app/hero-system-mobile/id1352750917), and [Amazon Appstore](https://www.amazon.ca/Phil-Guinchard-HERO-System-Mobile/dp/B07BJ9879M).  Not only is the app free - it is also ad free, respects user privacy, and it will remain that way.  

Up until 2020 this project has been a private project which was a single developer's ([me!](https://github.com/sentry0)) labour of love.  I am opening up the project to anyone who is interested in helping out in the hope that we can make the app bettter from a technical, feature, and user satisfaction level.  Now, if you have an idea for a killer feature to add to the app, you can grab the code, build your feature, and submit a PR.  If you don't have the technical ability, feel free to open a ticket and file your idea with the project.

This project was bootstrapped with [Create React Native App](https://github.com/react-community/create-react-native-app).

## Table of Contents

* [Screenshots](#screenshots)
* [Updating to New Releases](#updating-to-new-releases)
* [Available Scripts](#available-scripts)
  * [npm start](#npm-start)
  * [npm test](#npm-test)
  * [npm run ios](#npm-run-ios)
  * [npm run android](#npm-run-android)
* [Writing and Running Tests](#writing-and-running-tests)
* [Troubleshooting](#troubleshooting)
  * [Nuke It From Orbit](#nuke-it-from-orbit)
    * [Flushing General Caches](#flushing-general-caches)
    * [Flushing Android Caches](#flushing-android-caches)
    * [Flushing iOS Caches](#flushing-ios-caches)
    * [Rebuilding](#rebuilding)
* [Donating](#donating)

## Screenshots

Here are some screenshots of the current app as of 2020-01-11 (click to enlarge).

|                                                                                                                |                                                                                                                |                                                                                                                |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| <img src="https://i.imgur.com/U0AEJfp.png" data-canonical-src="https://i.imgur.com/U0AEJfp.png" width="100" /> | <img src="https://i.imgur.com/IVFf2fv.png" data-canonical-src="https://i.imgur.com/IVFf2fv.png" width="100" /> | <img src="https://i.imgur.com/E1TEFeA.png" data-canonical-src="https://i.imgur.com/E1TEFeA.png" width="100" /> |
| <img src="https://i.imgur.com/UMT8pGm.png" data-canonical-src="https://i.imgur.com/UMT8pGm.png" width="100" /> | <img src="https://i.imgur.com/NUGWCYh.png" data-canonical-src="https://i.imgur.com/NUGWCYh.png" width="100" /> | <img src="https://i.imgur.com/12pjazW.png" data-canonical-src="https://i.imgur.com/12pjazW.png" width="100" /> |


## Updating to New Releases

You should only need to update the global installation of `create-react-native-app` very rarely, ideally never.

Updating the `react-native-scripts` dependency of your app should be as simple as bumping the version number in `package.json` and reinstalling your project's dependencies.

Upgrading to a new version of React Native is something that should be done sparingly and only with the assistance of 3rd party tools such as [RN diff PURGE](https://react-native-community.github.io/upgrade-helper/).

## Available Scripts

Below is a list of available commands.

#### `npm start`

Runs your app in development mode.

Sometimes you may need to reset or clear the React Native packager's cache. To do so, you can pass the `--reset-cache` flag to the start script:

```
npm start -- --reset-cache
```

#### `npm test`

Runs the [jest](https://github.com/facebook/jest) test runner on your tests.

#### `npm run ios`

Like `npm start`, but also attempts to open your app in the iOS Simulator if you're on a Mac and have it installed.

#### `npm run android`

Like `npm start`, but also attempts to open your app on a connected Android device or emulator. Requires an installation of Android build tools (see [React Native docs](https://facebook.github.io/react-native/docs/getting-started.html) for detailed setup). We also recommend installing Genymotion as your Android emulator. Once you've finished setting up the native build environment, there are two options for making the right copy of `adb` available to Create React Native App:

##### Using Android Studio's `adb`

1. Make sure that you can run adb from your terminal.
2. Open Genymotion and navigate to `Settings -> ADB`. Select “Use custom Android SDK tools” and update with your [Android SDK directory](https://stackoverflow.com/questions/25176594/android-sdk-location).

##### Using Genymotion's `adb`

1. Find Genymotion’s copy of adb. On macOS for example, this is normally `/Applications/Genymotion.app/Contents/MacOS/tools/`.
2. Add the Genymotion tools directory to your path (instructions for [Mac](http://osxdaily.com/2014/08/14/add-new-path-to-path-command-line/), [Linux](http://www.computerhope.com/issues/ch001647.htm), and [Windows](https://www.howtogeek.com/118594/how-to-edit-your-system-path-for-easy-command-line-access/)).
3. Make sure that you can run adb from your terminal.

## Writing and Running Tests

This project is set up to use [jest](https://facebook.github.io/jest/) for tests. You can configure whatever testing strategy you like, but jest works out of the box. Create test files in directories called `__tests__` or with the `.test` extension to have the files loaded by jest. See the [the template project](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/App.test.js) for an example test. The [jest documentation](https://facebook.github.io/jest/docs/en/getting-started.html) is also a wonderful resource, as is the [React Native testing tutorial](https://facebook.github.io/jest/docs/en/tutorial-react-native.html).

## Troubleshooting

Occasionally you will run into build issues that will baffle and confuse you such as a build working one day and not the next.  This is usually a caching issue and can be fixed by flushing the various caches in your development environment.

Very often you can simply do the old trick of removing your node modules and rebuilding.

```
rm -rf node_modules/
npm install
```

After re-installing your `node_modules` don't forget to rebuild your app in XCode or by running `npm run android` if you're building the android app.

### Nuke It From Orbit

From time to time you will have to go down the dark path of forcing all of your caches to refresh.  This is deailed below. 

#### Flushing General Caches 

Execute the following commands to flush the general caches.  It's recommended that you complete quit XCode if you are working on a Mac before you do any of this.

```
# from within your project root
rm -rf node_modules
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/metro-*
watchman watch-del-all
rm -rf node_modules
npm cache clean --force
npm cache verify
```

#### Flushing Android Caches

If you are building the Android app

```
rm -rf android/build
```

#### Flushing iOS Caches

If you are building in iOS

```
rm -rf ios/build
rm -rf ios/pods
rm -rf ios/Podfile.lock
```

#### Rebuilding

Once all your various caches have been flushed you can begin to rebuild.

```
npm install
```

For iOS you will need to rebuild your CocoaPods

```
cd ios/
pod deintegrate
pod install
```

## Donating

If you feel like donating to the project for whatever reason you can do so by [clicking here](https://www.paypal.com/paypalme/my/profile)... street Cyberline doesn't buy itself!
