This project was bootstrapped with [Create React Native App](https://github.com/react-community/create-react-native-app).

Below you'll find information about performing common tasks. The most recent version of this guide is available [here](https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md).

## Table of Contents

* [Updating to New Releases](#updating-to-new-releases)
* [Available Scripts](#available-scripts)
  * [npm start](#npm-start)
  * [npm test](#npm-test)
  * [npm run ios](#npm-run-ios)
  * [npm run android](#npm-run-android)
* [Writing and Running Tests](#writing-and-running-tests)
* [Troubleshooting](#troubleshooting)
  * [Flushing General Caches](#flushing-general-caches)
  * [Flushing Android Caches](#flushing-android-caches)
  * [Flushing iOS Caches](#flushing-ios-caches)
  * [Rebuilding](#rebuilding)

## Updating to New Releases

You should only need to update the global installation of `create-react-native-app` very rarely, ideally never.

Updating the `react-native-scripts` dependency of your app should be as simple as bumping the version number in `package.json` and reinstalling your project's dependencies.

Upgrading to a new version of React Native is something that should be done sparingly and only with the assistance of 3rd party tools such as [RN diff PURGE](https://react-native-community.github.io/upgrade-helper/).

## Available Scripts

Below is a list of available commands.

### `npm start`

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

Occasionally you will run into build issues that will baffle and confuse you such as a build working one day and not the next.  This is usually a caching issue and can be fixed by flushing he various caches in your development environment.

Very often you can simply do the old trick of removing your node modules and rebuilding.

```
rm -rf node_modules/
npm install
```

After nuking your `node_modules` don't forget to rebuild your app in XCode or by running `npm run android` if your building the android app.

However, from time to time you will have to go down the dark path of forcing all of your caches to refresh.  This is deailed below. 

### Flushing General Caches 

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

### Flushing Android Caches

If you are building the Android app

```
rm -rf android/build
```

### Flushing iOS Caches

If you are building in iOS

```
rm -rf ios/build
rm -rf ios/pods
rm -rf ios/Podfile.lock
```

### Rebuilding

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
