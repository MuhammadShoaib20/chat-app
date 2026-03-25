
```markdown
# SyncChat – Frontend

A modern, real‑time chat application built with the MERN stack. This repository contains the **frontend** codebase for SyncChat – a feature‑rich messaging platform with instant messaging, group chats, file sharing, and more.

🔗 **Live Demo:** [https://chat-app-theta-seven-44.vercel.app/](https://chat-app-theta-seven-44.vercel.app/)  
🐙 **GitHub Repository:** [https://github.com/MuhammadShoaib20/chat-app](https://github.com/MuhammadShoaib20/chat-app)  
🖥️ **Backend API:** [https://chat-app-14ut.onrender.com/api](https://chat-app-14ut.onrender.com/api) *(base URL – may require additional endpoints)*

---

## 🚀 Features

- **Real‑time messaging** with Socket.io – instant message delivery, typing indicators, and read receipts.
- **Group chats** – create groups, add members, assign admins, and manage group details.
- **File sharing** – upload images and files directly in conversations with automatic preview.
- **User authentication** – JWT‑based authentication with protected routes.
- **Dark mode** – toggle between light and dark themes (persisted in localStorage).
- **Emoji picker** – full emoji support with reactions on messages.
- **Message actions** – edit, delete, and share (copy) your own messages.
- **Block/unblock users** – control who can message you.
- **Responsive design** – works seamlessly on desktop and mobile devices.
- **Offline support** – service worker for push notifications (optional).

---

## 🛠️ Tech Stack

| Technology       | Purpose                             |
|------------------|-------------------------------------|
| React 18         | UI library                          |
| Vite             | Build tool and development server   |
| Tailwind CSS     | Styling                             |
| React Router v7  | Routing                             |
| Socket.io-client | Real‑time communication             |
| Axios            | HTTP requests                       |
| React Hot Toast  | Notifications                       |
| Emoji Mart       | Emoji picker                        |
| React Window     | Virtualized message list            |
| Date-fns         | Date formatting                     |

---

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm or yarn

---

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MuhammadShoaib20/chat-app.git
   cd chat-app/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**  
   Create a `.env` file in the root of the `frontend` folder with the following variables:
   ```env
   VITE_API_URL=https://chat-app-14ut.onrender.com/api
   VITE_VAPID_PUBLIC_KEY=your_vapid_public_key   # optional, for push notifications
   ```
   > **Note:** The `VITE_API_URL` should point to your backend’s base URL. The provided URL is a placeholder – replace it with your actual backend endpoint.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── chat/         # Chat‑specific components
│   │   ├── layout/       # Layout components (Header)
│   │   └── ErrorBoundary.jsx
│   ├── context/          # React contexts (Auth, Socket, Theme)
│   ├── hooks/            # Custom hooks
│   ├── pages/            # Page components
│   ├── services/         # API service modules
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Tailwind entry + custom styles
├── .env.example          # Example environment variables
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```

---

## 📜 Available Scripts

| Command           | Description                                      |
|-------------------|--------------------------------------------------|
| `npm run dev`     | Start development server with hot reload         |
| `npm run build`   | Build for production                             |
| `npm run preview` | Preview the production build locally             |
| `npm run lint`    | Run ESLint                                       |

---

## 🌐 Deployment

The frontend can be deployed to any static hosting service. The live demo is currently hosted on **Vercel**.

**Steps to deploy on Vercel:**
1. Push your code to a GitHub repository.
2. Import the project in Vercel.
3. Add the environment variable `VITE_API_URL` with your backend URL.
4. Deploy.

> ⚠️ **Important:** Ensure your backend is configured to accept requests from your frontend domain (CORS).

---

## 🔐 Environment Variables

| Variable               | Description                                  | Required |
|------------------------|----------------------------------------------|----------|
| `VITE_API_URL`         | Base URL of your backend API                 | Yes      |
| `VITE_VAPID_PUBLIC_KEY`| VAPID public key for web push notifications  | No       |

---

## 🤝 Contributing

Contributions are welcome!  
Please open an issue or submit a pull request. For major changes, discuss them first in an issue.

---

## 📄 License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by [Muhammad Shoaib](https://github.com/MuhammadShoaib20)
```
