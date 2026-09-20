name: Build NNECXY APK

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          
      - name: Setup Node 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          
      - name: Install & Build
        run: |
          npm install
          npm run build
          
      - name: Setup Capacitor Android
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap init Nnecxy com.nnecxy.app --web-dir=dist
          npx cap add android
          npx cap copy android
          
      - name: Build APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug
          
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: NNECXY-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
