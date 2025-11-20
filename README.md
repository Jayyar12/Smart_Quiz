# 🧠 Smart Quiz

A web-based quiz application that enables users to easily **create**, **publish**, and **participate** in quizzes.  
Built with **React**, **Laravel**, and **MySQL**, Smart Quiz offers instant feedback, automated grading, leaderboards, and performance analytics.

---

## 🚀 Features

### 👤 User Management
- Register and log in with email verification  
- Secure password reset  
- Account management and profile editing  

### 📝 Quiz Creation
- Create, edit, and delete quizzes  
- Add multiple question types (MCQs, short answers, etc.)  
- Configure time limits, scoring rules, and randomization  
- Generate shareable quiz links  

### 🎯 Quiz Participation
- Participate through shared links  
- Auto-save answers during the quiz  
- Prevent duplicate or multiple submissions  
- View correct answers after submission (if enabled)

### 🧮 Grading & Feedback
- Auto-grading for objective questions  
- Manual grading for descriptive responses  
- Instant feedback and result display  

### 🏆 Analytics & Leaderboards
- View leaderboards for each quiz  
- Track performance and generate reports  
- Monitor progress across quizzes  

---

## 🛠️ System Architecture

| Component | Technology |
|------------|-------------|
| **Frontend** | React.js + Tailwind CSS |
| **Backend** | Laravel (RESTful API) |
| **Database** | MySQL |
| **Authentication** | Laravel Sanctum / JWT |
| **Hosting** | AWS / Heroku |
| **Version** | 1.0 |

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


Run git clone https://github.com/Jayyar12/online-application


Open the cloned project folder.


Navigate to the backend directory:
 cd backend


Install dependencies:
 composer install


Copy the environment file:
 copy .env.example .env


Configure the .env file with your database and app settings.


Open XAMPP, start Apache and MySQL, open MySQL admin then create a database named online_app.


In the backend directory, run the following commands:

php artisan key:generate  
php artisan migrate  
php artisan queue:work  

Open a new terminal, go to the frontend directory:
cd frontend


Install frontend dependencies:
npm install


Start the development server:
npm run dev

Open new terminal again run
Php artisan serve
