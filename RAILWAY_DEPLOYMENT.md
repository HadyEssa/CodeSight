# 🚂 Railway Deployment Guide - CodeSight

## Prerequisites
- Railway account (sign up at [railway.app](https://railway.app))
- GitHub repository connected
- GitHub OAuth app configured
- Google Gemini API key

---

## 📋 Deployment Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your CodeSight repository

---

### 2. Deploy Backend Service

#### Create Backend Service
1. In your Railway project, click **"New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. Set **Root Directory**: `backend`
5. Railway will auto-detect the configuration from `railway.json`

#### Configure Environment Variables
Click on the backend service → **Variables** tab → Add:

```bash
PORT=5000
NODE_ENV=production
SESSION_SECRET=<generate-random-32-char-string>
GITHUB_CLIENT_ID=<your-github-oauth-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-client-secret>
GITHUB_CALLBACK_URL=https://<your-backend-url>.up.railway.app/api/auth/github/callback
GEMINI_API_KEY=<your-gemini-api-key>
FRONTEND_URL=https://<your-frontend-url>.up.railway.app
```

> **Note**: You'll update `FRONTEND_URL` after deploying the frontend

#### Deploy
1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your backend URL (e.g., `https://codesight-backend.up.railway.app`)

---

### 3. Deploy Frontend Service

#### Create Frontend Service
1. In the same Railway project, click **"New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. Set **Root Directory**: `FrontEnd`
5. Railway will auto-detect the configuration from `railway.json`

#### Configure Environment Variables
Click on the frontend service → **Variables** tab → Add:

```bash
VITE_API_URL=https://<your-backend-url>.up.railway.app
```

Replace `<your-backend-url>` with your actual backend URL from step 2.

#### Deploy
1. Click **"Deploy"**
2. Wait for build to complete
3. Copy your frontend URL (e.g., `https://codesight.up.railway.app`)

---

### 4. Update Backend Environment

1. Go back to your **backend service**
2. Update the `FRONTEND_URL` variable with your actual frontend URL
3. Click **"Redeploy"**

---

### 5. Configure GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on your OAuth App (or create a new one)
3. Update:
   - **Homepage URL**: `https://<your-frontend-url>.up.railway.app`
   - **Authorization callback URL**: `https://<your-backend-url>.up.railway.app/api/auth/github/callback`
4. Save changes

---

## ✅ Verify Deployment

### Test Backend
Visit: `https://<your-backend-url>.up.railway.app/api/health`

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-24T..."
}
```

### Test Frontend
1. Visit: `https://<your-frontend-url>.up.railway.app`
2. Should see the CodeSight landing page
3. Try GitHub login
4. Upload a test repository

---

## 🔧 Environment Variables Reference

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://codesight.up.railway.app` |
| `SESSION_SECRET` | Session encryption key | Use `openssl rand -base64 32` |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | From GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | From GitHub OAuth app |
| `GITHUB_CALLBACK_URL` | OAuth callback URL | `https://backend.up.railway.app/api/auth/github/callback` |
| `GEMINI_API_KEY` | Google Gemini API key | From Google AI Studio |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://backend.up.railway.app` |

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure `GITHUB_CALLBACK_URL` matches exactly

### Frontend Shows Blank Page
- Check browser console for errors
- Verify `VITE_API_URL` is correct
- Check CORS settings in backend

### GitHub OAuth Fails
- Verify callback URL in GitHub app matches Railway backend URL
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
- Ensure user is redirected to correct frontend URL

### CORS Errors
- Verify `FRONTEND_URL` in backend matches actual frontend URL
- No trailing slashes in URLs
- Check browser console for exact origin being blocked

---

## 📊 Monitoring

### Railway Dashboard
- View logs: Click service → **Deployments** → **View Logs**
- Monitor metrics: CPU, Memory, Network usage
- Check build status and deployment history

### Health Checks
Backend health endpoint: `/api/health`

---

## 🔄 Redeployment

### Automatic Redeployment
Railway automatically redeploys when you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Redeployment
1. Go to Railway dashboard
2. Click on service
3. Click **"Redeploy"**

---

## 💰 Cost Considerations

Railway offers:
- **Free tier**: $5 credit/month
- **Pro plan**: $20/month + usage

Estimated usage for CodeSight:
- Backend: ~$3-5/month
- Frontend: ~$1-2/month

---

## 🎉 You're Done!

Your CodeSight application is now live on Railway! 🚀

**Frontend**: `https://<your-frontend-url>.up.railway.app`  
**Backend**: `https://<your-backend-url>.up.railway.app`
