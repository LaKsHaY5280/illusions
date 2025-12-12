# Deployment Guide - Optical Illusions Live Polling Game

## 🚀 Deploy to Render.com (Recommended)

### Prerequisites
- GitHub account
- Render.com account (free)

### Steps:

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Render**
   - Go to [render.com](https://render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` config
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment

3. **Access your game**
   - Render will provide a URL like: `https://optical-illusions-game.onrender.com`
   - Share this URL with all 30 participants
   - One person checks "Host Mode" to control the game

### Important Notes:
- **Free tier**: First deploy may take 1-2 minutes to wake up
- **WebSocket support**: Works perfectly on Render
- **Custom domain**: Can add later in Render settings

---

## 🧪 Test Locally with Multiple Devices (Before Deployment)

### Option 1: Same Network (WiFi)

1. **Get your local IP address:**
   ```bash
   # Windows PowerShell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"} | Select-Object IPAddress
   
   # Or use ipconfig and look for IPv4 Address
   ipconfig
   ```

2. **Start the server:**
   ```bash
   pnpm dev
   ```

3. **Access from other devices on same WiFi:**
   - On your computer: `http://localhost:3000`
   - On phones/tablets: `http://YOUR_LOCAL_IP:3000`
   - Example: `http://192.168.1.100:3000`

4. **Test with multiple devices:**
   - Open URL on 5-10 devices (phones, tablets, other computers)
   - One person enables "Host Mode"
   - Others just vote
   - Test the live polling!

### Option 2: Use ngrok (Temporary Public URL)

1. **Install ngrok:** [ngrok.com](https://ngrok.com)

2. **Start your server:**
   ```bash
   pnpm dev
   ```

3. **In another terminal, expose it:**
   ```bash
   ngrok http 3000
   ```

4. **Share the ngrok URL:**
   - ngrok will give you a public URL like: `https://abc123.ngrok.io`
   - Share this with anyone to test
   - **Note:** Free tier URL changes every restart

---

## 🔧 Alternative Deployment Options

### Railway.app
1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js and deploys
5. Get your public URL

### Heroku (Classic Option)
1. Create `Procfile`:
   ```
   web: node server.mjs
   ```
2. Deploy via Heroku CLI or GitHub integration

---

## ✅ Pre-Deployment Checklist

- [ ] All images are in `/public/illusions/` folder
- [ ] Image paths in `game-data.ts` are correct
- [ ] Tested locally with multiple browser tabs
- [ ] Tested on same WiFi network with real devices (optional)
- [ ] Code pushed to GitHub
- [ ] Ready to deploy to Render/Railway

---

## 🎯 For Your 30-Person Game Session

**Recommended flow:**
1. Deploy to Render.com (takes 5 minutes)
2. Share the Render URL with all participants before the session
3. Have everyone open it 5 minutes early to test connectivity
4. You (host) check "Host Mode" checkbox
5. Start the game!

**Benefits of deployment:**
- ✅ No local setup needed
- ✅ Works from anywhere
- ✅ Professional URL to share
- ✅ All 30 participants can access simultaneously
- ✅ WebSocket connections work perfectly
