<div align="center">
  <br />
  <img src="public/wordmark.png" alt="Metamorph" width="300" />
  <br />
  <br />

  <h2>Manufacturing Operations System</h2>
  <p>Enterprise Management System for Powder Coating & Metal Finishing Facilities</p>

  <p>
    <a href="#overview">Overview</a> •
    <a href="#core-modules">Core Modules</a> •
    <a href="#technical-architecture">Architecture</a> •
    <a href="#deployment--setup">Deployment</a>
  </p>
</div>

---

## Overview

Metamorph is a comprehensive, full-stack Enterprise Resource Planning (ERP) platform purpose-built for the powder coating and metal finishing industry. It unifies operations across the shop floor, laboratory, quality assurance, and administrative departments into a single, cohesive interface.

Designed with a mobile-first, offline-ready architecture, the system guarantees continuity of operations throughout the manufacturing facility while maintaining real-time synchronization with cloud infrastructure.

## Core Modules

The platform is divided into specialized operational domain contexts:

- **Order Management:** Visual kanban-driven workflow tracking orders from pre-processing through coating, quality assurance, and final dispatch.
- **Inventory & Supply Chain:** Real-time material tracking, consumption metrics, and powder stock management.
- **Quality Assurance & Laboratory:** Strict QA tracking, laboratory routine checks, special parameter measurements, and automated, exportable reporting.
- **Human Resources:** Labor attendance tracking, role-based access control (RBAC), and user permission governance.
- **Costing & Resource Analytics:** Comprehensive utility tracking (power, gas, water consumption) mapped against operational output for precise cost-per-unit analysis.
- **Administrative Portal:** Global search, system activity logging, CRM capabilities, and system configuration.

## Technical Architecture

Metamorph employs a modern, highly scalable stack optimized for performance and maintainability.

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 / TypeScript | Strict type safety and component-driven architecture. |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive design with dark mode support. |
| **State** | Zustand | Predictable, atomic state management with offline persistence. |
| **Animation** | Motion | Fluid, performant transitions and layout animations. |
| **Database** | Firebase Firestore | NoSQL document database with real-time listeners. |
| **Cross-Platform** | Capacitor | Native wrapper for Android mobile deployment. |

## Deployment & Setup

### Prerequisites

Ensure the following runtimes are installed within your environment:
- Node.js (v18.0.0 or higher)
- npm or yarn package manager
- Android Studio (if compiling for native mobile deployment)

### Local Development Environment

1. **Initialize Project**
   Clone the repository and install the required dependencies:
   ```bash
   npm install
   ```

2. **Launch Development Server**
   Start the local Vite development server. The application will be accessible at `http://localhost:3000`.
   ```bash
   npm run dev
   ```

3. **Compile for Production**
   Generate static assets optimized for production deployment:
   ```bash
   npm run build
   ```

## Mobile Application Deployment

The system is configured to securely run natively on Android devices using Capacitor.

1. **Asset Generation**
   Compile the latest web build:
   ```bash
   npm run build
   ```

2. **Capacitor Synchronization**
   Synchronize the compiled web assets into the native Android chassis:
   ```bash
   npx cap sync android
   ```

3. **Native Compilation**
   Open the `/android` directory utilizing Android Studio to execute a standard Gradle build, or use the Command Line Interface:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```

## Governance & Security

Metamorph integrates strict Role-Based Access Control (RBAC). Access to particular modules (e.g., Administration, Resource Analytics, Costing) requires elevated privileges dictated by the user's role configuration. Ensure Firebase Rules are properly structured to mirror these access restrictions at the database tier.
