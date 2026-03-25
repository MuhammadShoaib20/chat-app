# SyncChat – Full Stack Chat Application

A modern, real-time chat application built with the **MERN stack**. This repository contains both the **frontend** (React + Vite) and **backend** (Node.js + Express) codebases. Users can enjoy instant messaging, group chats, file sharing, dark mode, and push notifications – all in a sleek, responsive interface.

🔗 **Live Demo:** [https://chat-app-theta-seven-44.vercel.app/](https://chat-app-theta-seven-44.vercel.app/)
🐙 **GitHub:** [https://github.com/MuhammadShoaib20/chat-app](https://github.com/MuhammadShoaib20/chat-app)
🖥️ **Backend API:** [https://chat-app-14ut.onrender.com/api](https://chat-app-14ut.onrender.com/api)

---

## 🚀 Features

- **Real-time messaging** – Instant delivery with typing indicators and read receipts (Socket.io)
- **Group chats** – Create groups, add/remove members, assign admins, and customise name/avatar
- **File sharing** – Upload images and documents (Cloudinary or local storage)
- **User authentication** – JWT-based login/register with password hashing
- **Dark mode** – Toggle between light and dark themes (persisted in `localStorage`)
- **Emoji picker** – Full emoji support with reactions on messages
- **Message actions** – Edit, delete, and copy your own messages
- **Block/unblock users** – Control who can message you
- **Push notifications** – Web push for offline users (optional VAPID keys)
- **Responsive design** – Works seamlessly on mobile, tablet, and desktop
- **Rate limiting & security** – Helmet, CORS, and Express Rate Limit protect the API

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v7, Socket.io-client, Axios, React Hot Toast, Emoji Mart, React Window, Date-fns |
| **Backend** | Node.js, Express, MongoDB (Mongoose), Socket.io, Redis (optional), JWT, bcryptjs, Cloudinary (optional), Multer, Web-Push, Helmet, CORS, Express Rate Limit |

---

## 📁 Project Structure

```
chat-app/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/          # Chat components
│   │   │   └── layout/        # Header, etc.
│   │   ├── context/           # Auth, Socket, Theme
│   │   ├── hooks/             # Custom hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service modules
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/            # DB, Redis, Cloudinary, Socket, WebPush
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Auth, error, rate limiter
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── sockets/           # Socket.io event handlers
│   │   └── utils/             # Helper functions
│   ├── uploads/               # Local file uploads (if Cloudinary not used)
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 📦 Prerequisites

- Node.js **v18 or higher**
- MongoDB (local or Atlas)
- Redis (optional – for scaling and caching)
- Cloudinary account (optional – for cloud file storage)
- npm or yarn

---

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/MuhammadShoaib20/chat-app.git
cd chat-app
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd ../frontend
cp .env.example .env    # fill in your values
npm install
npm run dev             # starts on http://localhost:5173
```

> Make sure MongoDB is running (or you have an Atlas URI) before starting the backend.

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name     # optional
CLOUDINARY_API_KEY=your_api_key           # optional
CLOUDINARY_API_SECRET=your_api_secret     # optional
REDIS_URL=redis://localhost:6379          # optional
VAPID_SUBJECT=mailto:your@email.com       # optional
VAPID_PUBLIC_KEY=your_public_key          # optional
VAPID_PRIVATE_KEY=your_private_key        # optional
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key   # optional
```

| Variable | Required |
|---|---|
| `MONGO_URI` | ✅ Yes |
| `JWT_SECRET` | ✅ Yes |
| `CLIENT_URL` | ✅ Yes |
| `VITE_API_URL` | ✅ Yes |
| All others | ❌ No |

---

## 📡 API Endpoints

All endpoints prefixed with `/api`. Auth via `Authorization: Bearer <token>`.

### Auth · `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login | No |
| GET | `/profile` | Get profile | Yes |
| POST | `/logout` | Logout | Yes |

### Users · `/api/users`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/profile` | Get profile | Yes |
| PUT | `/profile` | Update profile | Yes |
| GET | `/search` | Search users | Yes |
| POST | `/block/:id` | Block user | Yes |
| POST | `/unblock/:id` | Unblock user | Yes |
| GET | `/block-status/:id` | Block status | Yes |
| POST | `/subscribe` | Save push subscription | Yes |

### Conversations · `/api/conversations`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all conversations | Yes |
| POST | `/` | Create conversation | Yes |
| GET | `/:id` | Get details | Yes |
| PUT | `/:id` | Update group info | Yes |
| DELETE | `/:id` | Delete | Yes |
| POST | `/:id/participants` | Add members | Yes |
| DELETE | `/:id/participants/:userId` | Remove member | Yes |
| POST | `/:id/hide` | Hide conversation | Yes |

### Messages · `/api/messages`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/conversations/:id` | Get paginated messages | Yes |
| POST | `/` | Send message (REST) | Yes |
| POST | `/read` | Mark as read | Yes |
| PUT | `/:id` | Edit message | Yes |
| DELETE | `/:id` | Delete (soft) | Yes |
| POST | `/:id/reactions` | Toggle reaction | Yes |
| GET | `/search` | Search messages | Yes |

### Upload · `/api/upload`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Upload file | Yes |

---

## 🔌 Socket.io Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join-conversation` | `conversationId` | Join room |
| `leave-conversation` | `conversationId` | Leave room |
| `typing-start` | `{ conversationId }` | Typing started |
| `typing-stop` | `{ conversationId }` | Typing stopped |
| `send-message` | `{ conversationId, content, type, mediaUrl }` | Send message |
| `edit-message` | `{ messageId, content }` | Edit message |
| `delete-message` | `{ messageId }` | Delete message |
| `add-reaction` | `{ messageId, emoji }` | Toggle reaction |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `new-message` | `Message` | New message broadcast |
| `message-updated` | `Message` | Edit or delete notification |
| `messages-read` | `{ userId, messageIds, conversationId }` | Read receipts |
| `user-typing` | `{ userId, username, conversationId }` | Typing indicator |
| `user-stopped-typing` | `{ userId, conversationId }` | Stop typing |
| `conversation-updated` | `Conversation` | Conversation changed |
| `participant-added` | `{ conversationId, participants }` | Member added |
| `participant-removed` | `{ conversationId, userId }` | Member removed |
| `user-online` | `userId` | User online |
| `user-offline` | `userId` | User offline |
| `online-users` | `[userId]` | Online list on connect |
| `error` | `{ message }` | Error |

---

## 🚀 Deployment

### Backend → Render

1. Connect GitHub repo to Render
2. Build: `npm install` · Start: `npm start`
3. Add all env variables, set `NODE_ENV=production`
4. Ensure `CLIENT_URL` matches your frontend domain

### Frontend → Vercel

1. Import GitHub repo in Vercel
2. Set `VITE_API_URL` to your deployed backend URL (no `/api` suffix)
3. Deploy – Vercel auto-detects Vite

> ⚠️ Make sure backend CORS allows your frontend domain.

---

## 🤝 Contributing

Contributions are welcome! Open an issue or submit a pull request. For major changes, discuss first.

---

## 📄 License

Licensed under the **MIT License** – see [LICENSE](LICENSE) for details.

---

<div align="center">Built with ❤️ by <a href="https://github.com/MuhammadShoaib20">Muhammad Shoaib</a></div>