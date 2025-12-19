# 🧠 Smart Quiz

A web-based quiz application that enables users to easily **create**, **publish**, and **participate** in quizzes.  
Built with **React**, **Laravel**, and **MySQL**, Smart Quiz offers instant feedback, automated grading, leaderboards, and performance analytics.

---

## 🚀 Features

### 👤 User Management
- Register and log in with email verification (OTP)
- Secure password reset
- Account management and profile editing
- **Account Deletion**: Users can request account deletion (deletion status tracking).

### 📝 Quiz Creation
- Create, edit, and delete quizzes
- Add multiple question types (MCQs, short answers, etc.)
- Configure time limits, scoring rules, and randomization
- **Publish/Unpublish**: Control quiz visibility.
- Generate shareable quiz links and **Unique 6-character Join Codes**.

### 🎯 Quiz Participation
- **Join via Code**: Enter a simple code to join a quiz instantly.
- **Real-time Progress Saving**: Answers are saved as you go; resume where you left off.
- Prevent duplicate or multiple submissions.
- View correct answers after submission (if enabled).
- **Instant Result Analysis**: Score distribution and question-level breakdown.

### 🧮 Grading & Feedback
- Auto-grading for objective questions.
- **Essay Grading Dashboard**: Dedicated interface for manual grading of descriptive responses.
- Instant feedback and result display.

### 🏆 Analytics & Leaderboards
- View leaderboards for each quiz.
- Track performance and generate reports.
- Monitor progress across quizzes.
- **Detailed Statistics**: Pass rates, average scores, and highest/lowest score tracking.

---

## 🛠️ System Architecture

| Component | Technology |
|------------|-------------|
| **Frontend** | React.js (Vite) + Tailwind CSS |
| **Frontend Libs** | Framer Motion, Lucide React, SweetAlert2 |
| **Backend** | Laravel (RESTful API) |
| **Database** | MySQL |
| **Authentication** | Laravel Sanctum / JWT |

---

## ⚙️ Installation Guide

### Prerequisites
- Node.js (v18+)
- PHP (v8.2+)
- Composer
- MySQL
- XAMPP or Laravel Valet

### 1️⃣ Clone the Repository

Open VS Code, then open a new terminal.

```bash
git clone https://github.com/Jayyar12/online-application
```

Open the cloned project folder.

### 2️⃣ Backend Setup

Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
composer install
```

Copy the environment file:
```bash
copy .env.example .env
# OR on Mac/Linux: cp .env.example .env
```

Configure the `.env` file with your database and app settings.
> [!IMPORTANT]
> Ensure you configure the `MAIL_*` settings in `.env` for OTP and Password Reset features to work.

Open XAMPP, start Apache and MySQL, open MySQL admin then create a database named `online_app` (or whatever you verified in .env).

Run the following commands:
```bash
php artisan key:generate  
php artisan migrate  
php artisan queue:work  
```
*(Keep `queue:work` running in a separate terminal for background jobs like sending emails)*

### 3️⃣ Frontend Setup

Open a new terminal, go to the frontend directory:
```bash
cd frontend
```

Install frontend dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

### 4️⃣ Start Backend Server

Open new terminal again run:
```bash
php artisan serve
```

---

## 📄 License
This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
