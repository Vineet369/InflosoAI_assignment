# InflosoAI_assignment

# 🛠️ Full Stack Project MelodyVerse

## 📌 Description
This is a full-stack web application built with **Vite (React)** for the frontend and **Node.js (Express.js)** for the backend.

## 🚀 Technology
- **Frontend:** Built with Vite, React, and Tailwind CSS.
- **Backend:** Powered by Express.js with a RESTful API.
- **Database (if applicable):** MongoDB

## ⚙️ Installation & Setup Backend
1. Clone the repository:
```sh
git clone https://github.com/Vineet369/InflosoAI_assignment.git 
cd backend
```
2. Install dependencies:
```sh
npm install
```
3. Set up environment variables in `.env` using `.en.sample` file
4. Run the application:
```sh
npm run dev
```

## ⚙️ Installation & Setup Frontend
2. Install dependencies:
```sh
cd ../frontend
npm install
```
3. Set up environment variables in `.env` using `.en.sample` file
4. Run the application:
```sh
npm run dev
```

## API Endpoints

#### 1. Register user
```http
POST /api/v1/users/register
```

#### 2. Login user
```http
POST /api/v1/users/login
```

#### 3. Logout user
```http
POST /api/v1/users/logout
```

#### 4. Change password
```http
POST /api/v1/users/change-password
```

#### 5. Get currnt user details
```http
GET /api/v1/users/current-user
```

#### 6. Send verification otp(email)
```http
POST /api/v1/users/send-verification-otp
```

#### 7. Authenticate user
```http
POST /api/v1/users/is-auth
```
#### 8. Verify account(email verification)
```http
POST /api/v1/users/verify-account
```
#### 9. Reset oyp(email)
```http
POST /api/v1/users/send-reset-otp
```
#### 10. Refresh jwt token
```http
POST /api/v1/users/refresh-token
```

