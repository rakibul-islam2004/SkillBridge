# SkillBridge Backend

Welcome to the **SkillBridge** backend repository. This is a comprehensive backend solution designed to bridge the gap between students and tutors, facilitating seamless booking, scheduling, and learning experiences.


## 📋 Table of Contents

- [Project Overview](#-project-overview)
- [ER Diagram](#-er-diagram)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [API Documentation](#-api-documentation)

## 🚀 Project Overview

SkillBridge is built with scalability and performance in mind. It utilizes a modern tech stack to handle authentication, user profile management (Students, Tutors, Admins), and complex scheduling logic including calendar blocking and recurring availabilities.

- [Live Website](https://skill-bridge-client.vercel.app)

## 📊 ER Diagram

Here is the Entity-Relationship logic that powers SkillBridge's data architecture:

![SkillBridge ER Diagram](./src/er.png)

_The schema is built around three core pillars:_

1.  **Identity & Role Management**: Extends `User` with specialized `StudentProfile`, `TutorProfile`, `Admin`, and `UserRole` models.
2.  **Scheduling Engine**: A robust system connecting `TutorAvailability` and `TutorPricing` to `Booking`, managing time slots with `CalendarBlock`.
3.  **Engagement & Meta**: Includes `Category` management for discovery, `Review` system for quality assurance, and `Notification` system for user alerts.

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)

## ✨ Features

- **Advanced Authentication**: Secure login/signup with role-based access control (Student, Tutor, Admin).
- **Profile Management**: Dedicated profiles for Students and Tutors with specialized fields.
- **Tutor Availability**: Tutors can set recurring or one-time availability blocks.
- **Booking System**: Robust booking flow with status tracking (Pending, Confirmed, Completed, Cancelled).
- **Calendar Management**: Logic to prevent double-booking and manage schedule conflicts.
- **Review System**: Students can leave ratings and reviews for sessions.
- **Notifications**: Real-time updates for booking changes and important alerts.

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL installed and running

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/rakibul-islam2004/SkillBridge.git
   cd SkillBridge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Environment Setup

Create a `.env` file in the root directory and add the following variables:

```env
DATABASE_URL="postgresql://user:password@host:port/db_name?schema=public"
BETTER_AUTH_SECRET="your_better_auth_secret_key"
PORT=4000
FRONTEND_URL="http://localhost:3000"

BETTER_AUTH_URL="http://localhost:4000"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Database Setup

1. **Run Migrations** (Push schema to DB)

   ```bash
   npx prisma migrate dev
   ```

2. **Seed Database** (Optional, if seed script exists)
   ```bash
   npx prisma db seed
   ```

### Running the Server

- **Development Mode** 

  ```bash
  npm run dev
  ```

- **Build & Start**
  ```bash
  npm run build
  npm start
  ```

## 📡 API Documentation

Base URL: `http://localhost:4000/api/v1`

| Feature      | Endpoint           | Description                                        |
| :----------- | :----------------- | :------------------------------------------------- |
| **Auth**     | `/api/v1/auth/*`   | Handled by Better Auth (Sign in, Sign up, Session) |
| **Users**    | `/api/v1/users`    | User management endpoints                          |
| **Tutors**   | `/api/v1/tutors`   | Public tutor listings and profile retrieval        |
| **Bookings** | `/api/v1/bookings` | Booking creation and management                    |

---

## 🔗 Related Repositories

- [Frontend Repository](https://github.com/rakibul-islam2004/skill-bridge-client)


---

_Developed for Programming Hero Next Level Development - First Full Stack Assignment._
