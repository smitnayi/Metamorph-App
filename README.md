# Metamorph Metals - Enterprise Operations & CRM System

A centralized, cross-platform enterprise resource planning (ERP) and customer relationship management (CRM) platform specifically designed to streamline metal processing, coating, inventory control, and quality assurance workflows.

[![React Version](https://img.shields.io/badge/React-19.0.1-blue?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.14-06B6D4?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)
[![Capacitor Runtime](https://img.shields.io/badge/Capacitor-8.3.4-119EFF?style=flat-square&logo=capacitor)](https://capacitorjs.com)
[![Firebase Backend](https://img.shields.io/badge/Firebase-12.13.0-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)

---

## Overview

Metamorph Metals Operations System is a professional, full-stack cross-platform application built to coordinate the production pipelines of industrial metal coating and finishing facilities. The system integrates inventory management, scheduling, personnel logging, customer records, and compliance metrics into a single unified workspace.

## Key Modules

*   **Production & Order Pipeline**: Visual kanban workflow tracking orders through key stages of prep, coating, inspection, and logistics.
*   **Inventory Control**: Real-time tracking of powder coatings, chemical stocks, and raw materials with automated low-stock thresholds.
*   **Quality Assurance**: Structured QA check logging including cross-hatch adhesion scores, mil thickness verification, cure oven metrics, and automated travel sticker generation.
*   **CRM & HR Subsystem**: Customer database management and employee labor logs with integrated time/task association.
*   **Resource Analytics**: Real-time charts analyzing pass rates, material usage trends, and system throughput.

## Technical Architecture

*   **Frontend UI**: Component-driven architecture using React 19, styled with Tailwind CSS v4 and animated using Motion.
*   **State Management & Routing**: Lightweight client state via Zustand, with routing managed by React Router DOM v7.
*   **Backend & Database**: Serverless backend running on Firebase Firestore and Authentication with integrated Express.js microservices.
*   **Native Shell**: Run-time packaging via Capacitor for deployment as a native Android application.

---

## Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### Installation
1.  Clone the repository and navigate to the directory:
    ```bash
    git clone https://github.com/smitnayi/Metamorph-App.git
    cd Metamorph-App
    ```
2.  Install dependencies:
    ```bash
    npm install --legacy-peer-deps
    ```

### Running Development Environment
Start the Vite and tsx local server:
```bash
npm run dev
```

### Production Compilation
Generate the optimized web bundle:
```bash
npm run build
```

---

## Android Deployment

This project uses Capacitor to deploy as a native Android application.

1.  Compile the web assets:
    ```bash
    npm run build
    ```
2.  Sync assets into the Android native template:
    ```bash
    npx cap sync android
    ```
3.  Compile the APK using Gradle:
    ```bash
    cd android
    ./gradlew assembleDebug
    ```
    The compiled debug APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
