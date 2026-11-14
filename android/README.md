# Android TWA packaging preparation

This folder prepares a Trusted Web Activity (TWA) wrapper for the Sukses SNBT PWA.

## Confirmed Android application ID
`id.suksessnbt.app` has been confirmed for the Sukses SNBT Android application. Changing the package ID after release creates a separate Android application.

## Build prerequisites
1. Use a trusted computer with Node.js 18 or newer, Java JDK, and Android SDK tools.
2. Install Bubblewrap CLI: `npm i -g @bubblewrap/cli`.
3. Initialize a TWA project from the production web manifest:
   `bubblewrap init --manifest=https://suksessnbt.vercel.app/manifest.webmanifest --directory=android/twa`
4. During initialization, confirm the package ID, app name, and signing-key details. Use the confirmed ID `id.suksessnbt.app`.
5. Generate or select a dedicated release keystore. Keep the keystore and passwords outside Git, Vercel, and the website's public directory. Store at least one encrypted backup.
6. Build from the generated project directory using `bubblewrap build`. Bubblewrap can produce a signed APK and an Android App Bundle (AAB).
7. Obtain the SHA-256 fingerprint for the exact certificate used to sign the APK.
8. Publish the matching Digital Asset Links file at `https://suksessnbt.vercel.app/.well-known/assetlinks.json`, with package ID and certificate fingerprint.
9. Verify domain association and install/test the signed APK on Android before distribution.

## Template
`twa-manifest.template.json` records the current proposed app identity and appearance. Bubblewrap's `init` command creates the actual `twa-manifest.json` and Android project from the live web manifest; reconcile its generated values with the template rather than replacing generated project files blindly.

## Security
- Never commit `.jks`, `.keystore`, `.p12`, signing passwords, Google OAuth secrets, or Supabase service-role keys.
- `.gitignore` excludes common Android signing and build outputs.
- The website remains the source of truth. TWA simply opens the verified HTTPS PWA.
- Do not publish an APK until the package ID, signing identity, domain association, and release approval are confirmed.

## Current status
This is preparation only. The application ID is confirmed as `id.suksessnbt.app`, but no signed APK or Digital Asset Links association has been generated yet because the release signing identity must be created and secured.

## Official references
- Bubblewrap CLI: https://github.com/GoogleChromeLabs/bubblewrap
- Android Trusted Web Activity quick start: https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2
