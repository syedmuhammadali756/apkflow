# Setup Guide for APK FileHost

This guide will walk you through setting up the complete APK file hosting system from scratch.

## Step 1: Create Free Accounts

### 1.1 MongoDB Atlas (Database)

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Create account (email/password or Google)
4. Choose "Free" tier (M0)
5. Select cloud provider (AWS recommended)
6. Choose region closest to you
7. Create cluster (takes 3-5 minutes)
8. Click "Database Access" → "Add New Database User"
   - Username: `apkhost`
   - Password: Generate secure password
   - Database User Privileges: Read and write to any database
9. Click "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your specific IP
10. Click "Connect" → "Connect your application"
11. Copy the connection string
12. Replace `<password>` with your password

Example: `mongodb+srv://apkhost:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/apk-filehost?retryWrites=true&w=majority`

### 1.2 Cloudflare R2 (File Storage)

1. Go to https://dash.cloudflare.com
2. Sign up for free account
3. Click "R2" in the sidebar
4. Click "Create Bucket"
5. Name: `apk-filehost`
6. Location: Automatic
7. Click "Create Bucket"
8. Click "Manage R2 API Tokens"
9. Click "Create API Token"
10. Token name: `apk-filehost-token`
11. Permissions: "Object Read & Write"
12. Apply to specific bucket: `apk-filehost`
13. Create token
14. Copy and save:
    - Access Key ID
    - Secret Access Key
    - Endpoint URL (format: `https://<account-id>.r2.cloudflarestorage.com`)

## Step 2: Set Up Backend

```bash
cd d:/filehost/apk-filehost-backend

# Install dependencies (if not already done)
npm install

# Create .env file
copy .env.example .env
```

Edit `.env` file with your credentials:

```env
# MongoDB (from Step 1.1)
MONGO_URI=mongodb+srv://apkhost:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/apk-filehost

# JWT Secret (generate random string)
JWT_SECRET=super-secret-jwt-key-change-this-12345

# Cloudflare R2 (from Step 1.2)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id-here
R2_SECRET_ACCESS_KEY=your-secret-access-key-here
R2_BUCKET_NAME=apk-filehost
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://your-custom-domain.com

# App Config
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Generate JWT Secret:**
- Random string, 32+ characters
- Example: `jW8x#mK9$pL2qR5tN7vY0zB3cD6fH8j`
- Or use: https://randomkeygen.com/

## Step 3: Set Up Frontend

```bash
cd d:/filehost/apk-filehost-frontend

# Install dependencies (if not already done)
npm install

# Create .env file
copy .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

## Step 4: Test Locally

### Start Backend

```bash
cd d:/filehost/apk-filehost-backend
npm run dev
```

You should see:
```
✅ Connected to MongoDB
🚀 Server is running on port 5000
```

### Start Frontend (in new terminal)

```bash
cd d:/filehost/apk-filehost-frontend
npm run dev
```

You should see:
```
  VITE v7.3.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Test the Application

1. Open browser: http://localhost:5173
2. Click "Register"
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click "Register"
5. You should see the dashboard!
6. Try uploading a small APK file

## Step 5: Deploy to Production

### Deploy Backend to Render

1. Push code to GitHub (if not already)
2. Go to https://render.com
3. Sign up / Login with GitHub
4. Click "New +" → "Web Service"
5. Connect your repository
6. Configure:
   - Name: `apk-filehost-api`
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Free
7. Add Environment Variables (same as local .env):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_ENDPOINT`
   - `R2_PUBLIC_URL`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
8. Click "Create Web Service"
9. Wait for deployment (3-5 minutes)
10. Copy your backend URL (e.g., `https://apk-filehost-api.onrender.com`)

### Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Sign up / Login with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - Framework Preset: Vite
   - Root Directory: `apk-filehost-frontend`
6. Add Environment Variable:
   - `VITE_API_URL` = `https://apk-filehost-api.onrender.com`
7. Click "Deploy"
8. Wait for deployment (1-2 minutes)
9. Get your frontend URL (e.g., `https://apk-filehost.vercel.app`)

### Update Backend .env on Render

1. Go back to Render dashboard
2. Click on your backend service
3. Go to "Environment"
4. Update `FRONTEND_URL` to your Vercel URL
5. Save changes
6. Service will restart

## Step 6: Test Production

1. Open your Vercel URL (e.g., https://apk-filehost.vercel.app)
2. Register a new account
3. Upload an APK file
4. Copy the download link
5. Test the download link in a new tab

## Troubleshooting

### MongoDB Connection Error
- Check MongoDB IP whitelist (allow 0.0.0.0/0)
- Verify connection string password
- Ensure cluster is active

### R2 Upload Error
- Verify API token permissions
- Check bucket name matches
- Confirm endpoint URL is correct

### Frontend Can't Connect to Backend
- Check `VITE_API_URL` in frontend .env
- Verify backend is running
- Check CORS settings

### File Upload Fails
- Check file size (max 100MB)
- Ensure file is .apk
- Verify storage quota

## Next Steps

- Customize the UI colors/branding
- Add custom domain (Vercel + Cloudflare)
- Set up monitoring (Sentry free tier)
- Add email notifications (SendGrid 100/day free)
- Implement file expiration
- Add analytics

## Support

If you encounter issues:
1. Check the error messages in browser console
2. Check backend logs on Render
3. Verify all environment variables are set correctly
4. Ensure all services (MongoDB, R2, Render, Vercel) are active

---

**Congratulations! Your APK FileHost is live! 🎉**
