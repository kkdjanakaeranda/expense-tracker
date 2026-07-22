# Expense Tracker — PERN Stack

A modern, full-stack expense management application built using the **PERN** stack (PostgreSQL, Express.js, React, and Node.js) with a sleek UI powered by Tailwind CSS.

---

## 🚀 Features

- **User Authentication**: Secure user registration, login, and JWT-based authentication.
- **Session Management**: Automatically detects expired sessions and prompts users to log in again.
- **Dashboard Overview**: Track your total balance, overall income, and total expenses dynamically.
- **Transaction Management**: 
  - Add, edit, and delete transactions.
  - Categorize transactions as income or expenses.
  - Custom transaction dates and detailed descriptions.
- **Interactive Analytics**: Rich data visualization featuring category-wise expense breakdown, income vs. expense comparison, and daily transaction trends using **Recharts**.
- **User Settings**: Update profile information (name, email) and securely change passwords.
- **Responsive Layout**: Designed for a seamless experience across desktop, tablet, and mobile devices using Tailwind CSS.

---

## 🛠️ Tech Stack

### Frontend
- **React & Vite**: Fast development server and builds.
- **Tailwind CSS v4**: Modern, utility-first styling.
- **React Router DOM**: Declarative routing for page navigation.
- **Recharts**: Simple and interactive charting library.
- **Lucide React**: Clean, modern icon set.
- **Axios**: Promised-based HTTP client for API communication.

### Backend
- **Node.js & Express.js**: RESTful API design.
- **PostgreSQL & node-postgres (`pg`)**: Relational database storage with connection pooling.
- **JSON Web Tokens (`jsonwebtoken`)**: Secured routing and route-level authorization.
- **bcryptjs**: Secure password hashing.
- **Nodemon**: Auto-restarting development server.

---

## 📁 Project Structure

```text
expense-tracker/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Route protection (ProtectedRoute, PublicRoute)
│   │   ├── pages/          # Login, Register, Dashboard, Settings pages
│   │   ├── App.jsx         # Client-side router and route definitions
│   │   ├── App.css         # Custom UI/App stylesheet
│   │   ├── index.css       # Tailwind CSS styles and directives
│   │   ├── api.js          # Axios configuration with authorization interceptor
│   │   └── main.jsx        # App entry point
│   ├── .env                # Client environment configurations
│   └── package.json        # Frontend scripts and dependencies
│
└── server/                 # Express backend
    ├── db.js               # PostgreSQL pool connection configurations
    ├── index.js            # Express API server, routes, and controllers
    ├── .env                # Backend environment configurations
    └── package.json        # Backend scripts and dependencies
```

---

## 🗄️ Database Setup

Ensure PostgreSQL is running locally or set up a cloud instance (e.g., Neon). Run the following SQL queries to initialize the tables:

```sql
-- 1. Create the Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create the Transactions Table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## ⚙️ Installation & Configuration

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (running locally or in the cloud)

### Step 1: Clone the Repository
```bash
git clone https://github.com/kkdjanakaeranda/expense-tracker.git
cd expense-tracker
```

### Step 2: Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server/` root:
   ```env
   PORT=5000
   DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<dbname>?sslmode=require
   JWT_SECRET=your_jwt_secret_key_here
   ```
4. Start the server (runs on `http://localhost:5000` by default):
   ```bash
   # In development (with nodemon)
   npx nodemon index.js
   
   # Or start standard
   npm start
   ```

### Step 3: Frontend Setup
1. Navigate to the `client/` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client/` root:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the frontend:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to the local URL (usually `http://localhost:5173`).

---

## 🧑‍💻 Author

- **Janaka Eranda**
- **GitHub**: [@kkdjanakaeranda](https://github.com/kkdjanakaeranda)

---

## 📄 License

This project is licensed under the ISC License. See [server/package.json](file:///c:/Users/DELL/projectsNew/expense-tracker/server/package.json) for details.
