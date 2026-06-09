# 🏭 Metamorph Metals

> Internal management system for powder coating businesses including inventory, orders, HR, CRM, and QA metrics.

![React](https://img.shields.io/badge/React-19.0.1-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.1.14-06B6D4?style=flat-square&logo=tailwind-css)
![Capacitor](https://img.shields.io/badge/Capacitor-8.3.4-119EFF?style=flat-square&logo=capacitor)
![Firebase](https://img.shields.io/badge/Firebase-12.13.0-FFCA28?style=flat-square&logo=firebase)

PowderCoat OS is a robust, full-stack cross-platform application designed to streamline the complex operations of powder coating facilities. We've built this system to ensure that everything from job quoting to quality assurance happens in one organized, easy-to-use digital workspace.

## ✨ Features

- **📦 Inventory Management**: Track powders, materials, and stock levels in real-time.
- **🧾 Order Tracking**: Visual kanban-style drag-and-drop workflow for stages (Pre-processing, Coating, Quality Check, Shipped).
- **👥 CRM & HR**: Manage customer relations and employee labor tracking.
- **📊 Quality Assurance**: Integrated QA metrics and reporting.
- **📱 Cross-Platform**: Works fully functionally on both the Web and as a native Android App via Capacitor.
- **☁️ Firebase Backend**: Fully synced offline-first compatible architecture using Firebase.

## 🚀 Quick Start (Web Development)

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run the Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 📱 Android App Setup (Capacitor)

This project uses [Capacitor](https://capacitorjs.com/) to build into a native Android APK.

1. **Build the Web Assets First**
   ```bash
   npm run build
   ```

2. **Sync the Code to the Android Project**
   ```bash
   npx cap sync android
   ```

3. **Build APK via Android Studio**
   Open the `/android` folder in Android Studio and run a standard Gradle build, or use `gradlew assembleDebug` from the command line inside the `android/` folder.
   
## 📁 Tech Stack

- **Frontend**: React 19, Tailwind CSS v4, Motion (Animations)
- **Routing & State**: React Router DOM v7, Zustand
- **Drag & Drop**: @dnd-kit/core
- **Backend & Auth**: Firebase / Express backend
- **Mobile Runtime**: Capacitor (Android)
