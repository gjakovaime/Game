Plan: Release Albanian Adventures to Apple TestFlight

 Context

 The project is an Expo managed workflow app (SDK 54, no native ios/ directory). Bundle ID is
 com.albanianadventures.app. There is no eas.json yet. The goal is to get the app onto TestFlight so testers can
 install it on iOS devices. EAS (Expo Application Services) handles the iOS build in the cloud — no Mac required.

 ---
 Prerequisites (things you need before running any commands)

 1. Apple Developer Program — $99/year membership at developer.apple.com. If you don't have one, sign up and wait for
 approval (can take a few hours to a day).
 2. Expo account — Free at expo.dev. Sign up if you haven't.
 3. App Store Connect app record — You'll create this during the process below.

 ---
 Step-by-Step Guide

 Step 1 — Install EAS CLI

 Run this once on your machine (not inside Docker):
 npm install -g eas-cli

 Verify it works:
 eas --version

 ---
 Step 2 — Log in to your Expo account

 eas login
 Enter your expo.dev email/password when prompted.

 ---
 Step 3 — Link the project to Expo

 Inside the Game/ directory:
 eas init
 This creates an extra.eas.projectId in app.json and links the project to your Expo account dashboard.

 ---
 Step 4 — Create eas.json (the only file to add to the repo)

 Create /c/dev/docker-playground/Game/eas.json:
 {
   "cli": {
     "version": ">= 16.0.0"
   },
   "build": {
     "development": {
       "developmentClient": true,
       "distribution": "internal"
     },
     "preview": {
       "distribution": "internal",
       "ios": {
         "simulator": false
       }
     },
     "production": {
       "autoIncrement": true
     }
   },
   "submit": {
     "production": {
       "ios": {
         "appleId": "YOUR_APPLE_ID_EMAIL",
         "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
         "appleTeamId": "YOUR_TEAM_ID"
       }
     }
   }
 }

 For TestFlight, you'll use the preview profile.

 ---
 Step 5 — Register bundle ID on Apple Developer Portal

 Go to developer.apple.com → Certificates, IDs & Profiles → Identifiers.

 Click + and register a new App ID:
 - Platform: App
 - Bundle ID: com.albanianadventures.app (explicit)
 - Description: Albanian Adventures

 ---
 Step 6 — Create the app record in App Store Connect

 Go to appstoreconnect.apple.com → My Apps → + → New App:
 - Platform: iOS
 - Name: Albanian Adventures
 - Primary Language: English
 - Bundle ID: com.albanianadventures.app (select from dropdown after Step 5)
 - SKU: albanian-adventures-001 (any unique string)

 After creating, note the App ID number from the URL — you'll need it for eas.json's ascAppId.

 ---
 Step 7 — Build for iOS (TestFlight)

 eas build --platform ios --profile preview

 EAS will:
 1. Ask if you want to create/use an Apple distribution certificate — let it handle this automatically.
 2. Ask about provisioning profiles — let it handle automatically.
 3. Upload your code to Expo's build servers and compile it.
 4. Build takes ~10–20 minutes.

 You'll get a URL to monitor the build at expo.dev/builds.

 ---
 Step 8 — Submit to TestFlight

 Once the build completes:
 eas submit --platform ios --latest

 EAS will upload the .ipa to App Store Connect. After ~15 minutes of Apple's processing, it appears in TestFlight.

 Alternatively, download the .ipa from the EAS build page and drag it into Xcode → Organizer → Distribute App if you
 prefer manual upload.

 ---
 Step 9 — Invite testers in TestFlight

 In App Store Connect → TestFlight:
 - Internal testing: Add testers from your Apple Developer team (instant, no Apple review needed)
 - External testing: Add testers by email or a public link (requires a brief Apple review, ~1–2 days first time)

 ---
 Files Modified

 - eas.json — new file to create (Step 4)
 - app.json — eas init adds extra.eas.projectId automatically

 Critical Notes

 - You do NOT need a Mac. EAS builds in Expo's cloud using Apple's APIs.
 - First build will prompt for Apple credentials; EAS stores the credentials securely in its vault.
 - The preview profile creates an ad-hoc/TestFlight build; production is for App Store release.
 - If eas init asks to upgrade eas-cli, do so: npm install -g eas-cli@latest.

 Verification

 After Step 8, go to appstoreconnect.apple.com → TestFlight → your app build. Status should change from "Processing" →
 "Ready to Submit". Install on a device via the TestFlight iOS app.