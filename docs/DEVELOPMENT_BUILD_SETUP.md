# Development Build Setup Guide

This guide explains how to run the Delivery Driver App on a local Android emulator or iOS simulator using an **Expo development build**. This is required because the app uses native modules (`@nozbe/watermelondb` and `@sentry/react-native`) that are not supported inside Expo Go.

> **Note:** This guide assumes you have none of the mobile development tooling installed yet. Pick the platform you want to use (Android or iOS); you do not need both.

---

## Why a development build?

- **Expo Go is not enough.** The app depends on WatermelonDB (SQLite native code) and Sentry (native crash reporting). These modules cannot run inside the Expo Go sandbox.
- A **development build** is a custom build of the app that includes the native code and the Expo dev-client launcher. It connects to your local Metro server just like Expo Go, but supports any native dependency.

---

## Platform A: Android Emulator

### Prerequisites

- A computer running Linux, macOS, or Windows.
- At least 8 GB of RAM (16 GB recommended).
- ~10 GB of free disk space.

### Step 1 — Install Android Studio

1. Download Android Studio from https://developer.android.com/studio.
2. Install it with the default settings.
3. On first launch, choose **Standard** installation when the setup wizard appears. This will install:
   - Android SDK
   - Android SDK Platform-Tools (adb, fastboot)
   - Android Emulator
   - Android SDK Build-Tools
   - A default system image

### Step 2 — Install the required Android SDK components

Open Android Studio and go to:

```
Tools → SDK Manager → SDK Platforms
```

Install **one** of the following (we recommend the same API level Expo SDK 56 targets):

- `Android 14.0 (API Level 34)`
- `Android 15.0 (API Level 35)`

Then go to:

```
Tools → SDK Manager → SDK Tools
```

Make sure these are installed:

- Android SDK Build-Tools (latest)
- Android SDK Platform-Tools
- Android Emulator
- Android SDK Command-line Tools (latest)

### Step 3 — Create an Android Virtual Device (AVD)

1. Open Android Studio → `Tools → Device Manager`.
2. Click **Create Device**.
3. Choose a phone profile, for example **Pixel 7**.
4. Select a system image. Use the same API level you installed in Step 2.
5. Finish the wizard and start the emulator.

### Step 4 — Verify `adb` is available

Open a terminal and run:

```bash
adb --version
```

If the command is not found, add Android SDK platform-tools to your system `PATH`.

Default locations:

- macOS: `~/Library/Android/sdk/platform-tools`
- Linux: `~/Android/Sdk/platform-tools`
- Windows: `%LOCALAPPDATA%\Android\Sdk\platform-tools`

### Step 5 — Project setup

From the project root, run:

```bash
npx expo install expo-dev-client
```

This adds the Expo dev-client launcher to the project.

### Step 6 — Build and run on Android

With the emulator running, run:

```bash
npx expo run:android
```

The first build will take several minutes because it compiles the native app. Subsequent builds are faster.

When the app opens, it will connect to your local Metro bundler. You can then edit TypeScript code and see hot-reload updates.

---

## Platform B: iOS Simulator

### Prerequisites

- A Mac running macOS (Apple Silicon or Intel).
- At least 8 GB of RAM (16 GB recommended).
- ~15 GB of free disk space.

### Step 1 — Install Xcode

1. Open the Mac App Store or https://developer.apple.com/xcode/.
2. Download and install **Xcode**.
3. Open Xcode at least once and accept the license agreement.
4. Install the iOS Simulator components when prompted (or via `Xcode → Settings → Platforms`).

### Step 2 — Install Xcode Command Line Tools

Open a terminal and run:

```bash
xcode-select --install
```

### Step 3 — Install CocoaPods dependencies

CocoaPods is required to manage iOS native dependencies. Install it with Ruby Bundler (recommended) or directly:

```bash
sudo gem install cocoapods
```

If you use a Ruby version manager (rbenv, rvm, asdf), install CocoaPods without `sudo`:

```bash
gem install cocoapods
```

### Step 4 — Project setup

From the project root, run:

```bash
npx expo install expo-dev-client
```

### Step 5 — Build and run on iOS Simulator

Run:

```bash
npx expo run:ios
```

The first build will take several minutes. It will automatically pick an available iOS Simulator. To target a specific simulator, use:

```bash
npx expo run:ios --device "iPhone 15 Pro"
```

---

## Daily workflow

After the initial native build is done, the normal developer workflow is:

```bash
npx expo start
```

Then open the development build on the emulator/simulator. It will connect to Metro and support hot reload.

If you add or remove native dependencies (anything that touches `android/` or `ios/`), run the platform-specific command again:

```bash
npx expo run:android
# or
npx expo run:ios
```

---

## Cleaning the native build

If a native build gets into a bad state, clean it and rebuild:

### Android

```bash
cd android && ./gradlew clean && cd ..
npx expo run:android
```

### iOS

```bash
cd ios && xcodebuild clean && cd ..
npx expo run:ios
```

You can also delete the generated `android/` and `ios/` folders entirely and let Expo regenerate them on the next `npx expo run:*`.

---

## Troubleshooting

### `adb` not found

Add the Android SDK `platform-tools` directory to your system `PATH`.

### Build fails with missing NDK or CMake

Open Android Studio SDK Manager and install:

- NDK (Side by side)
- CMake

### iOS build fails with CocoaPods errors

1. Make sure you are in the project root, not inside the `ios/` folder.
2. Run `pod install --repo-update` inside the `ios/` folder.
3. Ensure your active Ruby version matches the one CocoaPods was installed with.

### App installs but shows a white screen

Check the Metro terminal for JavaScript errors. The native shell is running, but the JS bundle may have a runtime error.

### Metro bundler starts but the app does not connect

1. Make sure the emulator/simulator and the Metro server are on the same machine.
2. Restart both Metro and the app.
3. For Android, run `adb reverse tcp:8081 tcp:8081` to ensure the device can reach Metro.

---

## Team notes

- The generated `android/` and `ios/` folders can be committed to Git if the team wants deterministic native builds, but they are not required. Expo can regenerate them.
- If you commit `android/` and `ios/`, every teammate must use the same versions of Android Studio, Xcode, and CocoaPods to avoid lock-file conflicts.
- For a lighter setup, consider using **EAS Build** to generate development builds in the cloud and share them via QR code or install links.
