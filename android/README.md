# Android TWA packaging preparation

This folder prepares a Trusted Web Activity (TWA) wrapper for the Sukses SNBT PWA.

## Proposed Android application ID
`id.suksessnbt.app` is a proposed package name only. Confirm it before generating a signing key or publishing an Android package. Changing the package ID after release creates a separate Android application.

## Build prerequisites
1. Confirm the application ID and visible app name.
2. Install a current Node.js LTS and Java JDK on a trusted build computer.
3. Install Bubblewrap CLI: `npm install -g @bubblewrap/cli`.
4. Use `twa-manifest.template.json` as a starting point for Bubblewrap initialization.
5. Generate a dedicated release keystore. Keep the keystore and passwords outside Git, Vercel, and the website's public directory. Store at least one encrypted backup.
6. Build and sign the Android app using the release key.
7. Obtain the SHA-256 certificate fingerprint and publish the matching Digital Asset Links file at `https://suksessnbt.vercel.app/.well-known/assetlinks.json`.
8. Verify the domain association and test the signed APK on Android before distribution.

## Security
- Never commit `.jks`, `.keystore`, signing passwords, Google OAuth secrets, or Supabase service-role keys.
- The website remains the source of truth. TWA simply opens the verified HTTPS PWA.
- Do not publish an APK until the package ID, signing identity, domain association, and release approval are confirmed.

## Current status
This is preparation only. No signed APK or Digital Asset Links association has been generated yet because the final application ID and release signing identity must be confirmed and secured.
