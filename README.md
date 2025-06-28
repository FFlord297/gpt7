#gpt7

A production-grade Express.js backend for your chatbot app, packed with security, AI, and scalability features. Ready to deploy on [Render](https://render.com).

## Features

- AI-powered `/chat` endpoint (Hugging Face API, easy to swap for OpenAI)
- `/health` endpoint for monitoring
- JWT-based user authentication (`/register`, `/login`)
- Rate limiting for abuse prevention
- Request logging (morgan)
- CORS for browser clients
- Centralized error handling
- .env support
- In-memory chat history per user (easy to swap for a database)

## Setup

1. **Clone the repo**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Set up your environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your secrets (see `.env.example`)
4. **Start the server**
   ```bash
   npm start
   ```
5. **Deploy to Render**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: *(leave blank)*
   - Set environment variables in the Render dashboard

## Endpoints

- `POST /register` - Register new user `{ "username": "...", "password": "..." }`
- `POST /login` - Get JWT `{ "username": "...", "password": "..." }`
- `POST /chat` - Send user message `{ "message": "..." }`, requires JWT
- `GET /history` - Get chat history, requires JWT
- `GET /health` - Uptime check

---

*Note: Chat history is in-memory. For production, swap to a real database!*
