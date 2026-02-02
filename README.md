# Food Tracker - Telegram Mini-App

A Telegram Mini-App for tracking meals and how they make you feel. Built with Convex, React, and Tailwind CSS.

## Features

- 🍽️ Log meals with name, mood, and notes
- 😊 Track how food makes you feel (great/good/neutral/bad/terrible)
- 📱 Telegram Mini-App integration
- 🔒 Secure authentication via Telegram
- ⚡ Real-time data with Convex

## Setup

### 1. Prerequisites

- Node.js 18+
- Bun or npm
- A Telegram Bot (via @BotFather)

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Convex Setup

```bash
npx convex dev
```

Set environment variable in Convex dashboard:
```
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
```

### 4. Telegram Bot Configuration

1. Go to @BotFather
2. Create a new bot or use existing
3. Set up Mini App:
   ```
   /mybots → Your Bot → Bot Settings → Menu Button → Configure menu button
   ```
4. Set the Mini App URL to your deployed Convex site

### 5. Deploy

```bash
npx convex deploy
```

## Development

```bash
# Start Convex dev server
npx convex dev

# Start frontend (in another terminal)
bun run dev
# or
npm run dev
```

## Project Structure

```
convex/
  schema.ts       # Database schema
  auth.ts         # Telegram auth functions
  foodEntries.ts  # Food entry CRUD
src/
  routes/
    index.tsx     # Main food tracker UI
  hooks/
    useTelegramAuth.ts  # Telegram auth hook
```

## License

MIT
