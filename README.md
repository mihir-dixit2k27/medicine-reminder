# Medicine Reminder & Health Record Manager

Full-stack web application built with React (Vite) and Node.js + Express.

## Tech Stack

- Frontend: React, React Router, Tailwind CSS, Recharts, lucide-react, Vitest (Testing)
- Backend: Express, lowdb (JSON file persistence), bcrypt, uuid
- Reminders: Browser Notification API + polling interval

## Software Engineering Modules Mapping

This project maps directly to core software engineering principles. Below is a detailed breakdown of how one component from each of the 6 core modules is integrated into the application:

### 1. Module 1 (Overview Of Software Engineering) - *Agile Process*
**How it's used:** The development of this application closely follows an Agile Process framework, specifically emphasizing iterative and incremental development. Rather than attempting a "big-bang" release, the project was broken down into manageable feature increments—starting with user authentication, moving to the medicine reminder system, and finally adding the health records component. This allows for continuous integration, rapid testing of the core Browser Notification API, and adaptability to new requirements (like adding health tracking alongside medicine reminders).

### 2. Module 2 (Software Project Management) - *Work Break-down Structure (WBS)*
**How it's used:** To maintain a clear and manageable project scope, the system employs a Work Break-down Structure (WBS). The entire application is logically divided into independent sub-modules:
- **Client (Frontend):** Focuses strictly on UI/UX, built with React and Tailwind CSS.
- **Server (Backend):** Handles API requests, business logic, and routing via Express.
- **Data Persistence:** Manages JSON file creation and data integrity via lowdb.
This clear separation acts as our WBS, allowing developers to isolate tasks, debug specific boundaries, and estimate the effort required to build each piece.

### 3. Module 3 (Modelling Requirements) - *System Modeling & Requirements Specification*
**How it's used:** Before implementation, clear requirements mapping was established as our Requirements Specification.
- **Functional Requirements:**
  - Automated real-time Medicine Reminders via Browser Notification API algorithms.
  - User Authentication system (Registration & Login) generating unique session tokens.
  - Full CRUD (Create, Read, Update, Delete) capabilities for medicines and health records.
- **Non-Functional Requirements:**
  - **Security:** Sensitive data (passwords) uniquely hashed and salted via bcrypt.
  - **Usability:** A highly responsive React frontend built for high accessibility.
  - **Maintainability:** Utilizing lowdb (JSON file persistence) for zero-configuration setup.
By explicitly defining these capabilities, the project provides a strict logical blueprint that dictates how data flows from the React frontend to the Node server.

### 4. Module 4 (Software Design) - *Architectural Design*
**How it's used:** The project leverages a classical **Client-Server Architecture** engineered specifically around modern Software Design Principles.
- **High Cohesion:** Every component is heavily specialized. For example, `Reminders.jsx` focuses strictly on rendering the UI for reminders, while internal backend logic strictly delegates tasks to specific Express controllers.
- **Low (Loose) Coupling:** The system primarily uses **Data Coupling**. The React frontend and Express backend communicate uniquely by passing JSON object payloads across a RESTful HTTP bridge. This absolute separation guarantees that modifying how the user views the system will never spontaneously break how the server stores data.

### 5. Module 5 (Validation And Verification) - *Testing Web based System*
**How it's used:** To satisfy validation and verification without manual overhead, code defenses are built directly into the client.
- **Component Unit Testing:** Utilizing **Vitest** and **React Testing Library**, automated scripts specifically target frontend React elements (e.g., `App.test.jsx`). The tests mount UI components in an isolated Virtual DOM (JSDOM) to run assertions on their existence and state. This validates that foundational React logic reliably renders the web-based system exactly as the interface initially promised.

### 6. Module 6 (Software Evolution) - *Software Configuration Management (SCM) Tools*
**How it's used:** To manage rapid changes, bug fixes, and continuous improvements (Software Evolution), the project relies on industry-standard Software Configuration Management (SCM) tools. **Git** provides source version control, allowing developers to track file histories and rollback changes if a breaking defect is introduced. Simultaneously, **NPM (Node Package Manager)** handles internal configuration and tracks all runtime dependencies, guaranteeing that the build environment remains perfectly reproducible across different machines.

---

## Project Structure

```text
medicine-reminder/
├── client/
├── server/
└── README.md
```

## Setup

### 1) Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 2) Run backend (port 3001)

```bash
cd server
node index.js
```

### 3) Run frontend (port 5173)

```bash
cd client
npm run dev
```

### 4) Run Tests (Frontend)

```bash
cd client
npm run test
```

The frontend proxies `/api/*` to `http://localhost:3001` using `vite.config.js`.

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/medicines`
- `POST /api/medicines`
- `PUT /api/medicines/:id`
- `DELETE /api/medicines/:id`
- `GET /api/logs`
- `POST /api/logs`
- `GET /api/health-records`
- `POST /api/health-records`
- `PUT /api/health-records/:id`
- `DELETE /api/health-records/:id`
- `GET /api/profile`
- `PUT /api/profile`

## Demo Mode

On the login page, click **Demo Mode** to auto-fill:

- Username: `demo`
- Password: `demo123`

Register this account first if it does not exist yet.
