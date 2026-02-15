# 🚀 APK FileHost - Free APK File Hosting Tool

A complete, free, self-hosted APK file hosting solution for APK website owners. Upload APK files, generate download links, and manage everything from a beautiful dashboard.

## 🌟 Features

- ✅ **User Authentication** - Secure JWT-based auth
- ✅ **File Upload** - Drag & drop APK files up to 100MB
- ✅ **Instant Links** - Generate shareable download links
- ✅ **Cloud Storage** - Cloudflare R2 integration (10GB free + unlimited downloads!)
- ✅ **Download Tracking** - Real-time statistics
- ✅ **Storage Management** - 5GB quota per user
- ✅ **Modern UI** - Beautiful, responsive dashboard
- ✅ **100% Free** - No paid services required!

## 🏗️ Tech Stack

### Backend
- Node.js + Express
- MongoDB (Mongoose)
- Cloudflare R2 Storage
- JWT Authentication
- Multer for file uploads

### Frontend
- React 19 + Vite
- Axios for API calls
- Modern CSS with animations
- Responsive design

## 📁 Project Structure

```
apk-filehost/
├── apk-filehost-backend/      # Node.js API server
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   ├── middleware/            # Auth middleware
│   ├── utils/                 # Helper functions
│   ├── server.js             # Main server file
│   └── package.json
│
└── apk-filehost-frontend/     # React application
    ├── src/
    │   ├── components/       # React components
    │   ├── contexts/         # Context providers
    │   ├── App.jsx          # Main app
    │   └── main.jsx         # Entry point
    └── package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account (free)
- Cloudflare account with R2 enabled (free)

### 1. Clone or Use This Project

```bash
cd d:/filehost
```

### 2. Set Up Backend

```bash
cd apk-filehost-backend

# Install dependencies
npm install

# Create .env file from example
copy .env.example .env

# Edit .env and add your credentials:
# - MongoDB URI
# - JWT Secret
# - Cloudflare R2 credentials

# Run server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Set Up Frontend

```bash
cd ../apk-filehost-frontend

# Install dependencies
npm install

# Create .env file
copy .env.example .env

# Run development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Set Up Free Services

#### MongoDB Atlas (Free 512MB)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to backend `.env` file

#### Cloudflare R2 (Free 10GB + Unlimited Downloads!)
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Enable R2 in dashboard
3. Create bucket: `apk-filehost`
4. Generate API tokens (Access Key ID + Secret)
5. Add credentials to backend `.env` file

## 🎯 Usage

1. **Register** - Create your account
2. **Login** - Access your dashboard
3. **Upload** - Drag & drop APK file
4. **Get Link** - Copy download link
5. **Share** - Use link on your website

## 📊 Dashboard Features

- **Stats Overview** - Files, downloads, storage
- **File Upload** - Drag & drop with progress
- **File Management** - View, copy link, delete
- **Storage Quota** - Visual progress bar

## 🌐 Deployment

### Backend Deployment (Choose One)

**Option 1: Render (Recommended)**
1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect GitHub repo
5. Add environment variables
6. Deploy!

**Option 2: Railway**
- Similar process, $5 credit/month

**Option 3: Fly.io**
- 3 VMs free

### Frontend Deployment

**Vercel (Recommended)**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import repository
4. Add `VITE_API_URL` environment variable
5. Deploy!

**Or use Netlify, GitHub Pages**

## ⚙️ Configuration

### Backend Environment Variables

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=apk-filehost
R2_ENDPOINT=https://...r2.cloudflarestorage.com
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get profile

### Files
- `POST /api/files/upload` - Upload APK
- `GET /api/files` - List files
- `DELETE /api/files/:id` - Delete file

### Public
- `GET /d/:fileId` - Download APK
- `GET /d/:fileId/info` - File info

## 💰 Costs

| Service | Free Tier | Cost After Free |
|---------|-----------|-----------------|
| MongoDB Atlas | 512 MB | $9/mo for 2GB |
| Cloudflare R2 | 10GB, unlimited downloads | $0.015/GB/mo |
| Render | 750 hours/mo | $7/mo always-on |
| Vercel | 100GB bandwidth | $20/mo for 1TB |

**Total: $0 to start, ~$37/mo if scaling!**

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- File type validation
- File size limits
- Rate limiting
- Storage quotas
- CORS protection

## 📈 Scalability

- **Storage**: Start 10GB → Add Backblaze (another 10GB free) → Upgrade R2
- **Bandwidth**: R2 has no egress fees! ✨
- **Database**: 512MB → 2GB → Shared → Dedicated
- **Server**: Free tier → $7/mo always-on

## 🛠️ Development

```bash
# Backend
cd apk-filehost-backend
npm run dev

# Frontend
cd apk-filehost-frontend
npm run dev
```

## 📝 License

MIT License - Use freely for personal or commercial projects!

## 🙏 Credits

Built with ❤️ using:
- React
- Node.js
- MongoDB
- Cloudflare R2
- Express
- Vite

---

**Ready to host APK files for free? Let's go! 🚀**

For questions or issues, check the individual README files in backend and frontend folders.
