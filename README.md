# TalkSync 💬

TalkSync is a real-time chat web application built using the MERN stack.  
It allows users to register, log in, find other users, and communicate through real-time messaging.

## 🚀 Features

- 🔐 User Registration & Login
- 🔑 Forgot Password / Password Reset
- 💬 Real-time one-to-one messaging
- 🟢 Online / Offline user status
- 🔔 Unread message count
- 🕐 Last message time
- 🔎 Search users
- 📎 File upload and sharing
- 🖼️ Image sharing
- 🔒 Protected chat routes
- 🔐 JWT-based authentication
- 🗄️ MongoDB database
- ⚡ Socket.IO real-time communication
- 📱 Responsive chat interface

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Router
- Socket.IO Client
- React Icons
- CSS

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcryptjs
- Multer
- Nodemailer
- Resend

## 📁 Project Structure

```text
TalkSync/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── socket.js
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── uploads/
│   │   └── server.js
│   ├── package.json
│   └── .env
│
├── .gitignore
└── README.md
