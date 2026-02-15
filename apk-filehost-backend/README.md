# APK FileHost - Backend

Free APK file hosting tool backend API built with Node.js, Express, MongoDB, and Cloudflare R2.

## Features

- ✅ User authentication (Register/Login with JWT)
- ✅ APK file upload with storage quota management
- ✅ Cloudflare R2 integration for file storage
- ✅ Direct download links
- ✅ Download counter and analytics
- ✅ Rate limiting and security
- ✅ File size validation
- ✅ RESTful API

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: JWT + bcryptjs
- **File Upload**: Multer

## Setup Instructions

### 1. Install Dependencies

```bash
cd apk-filehost-backend
npm install
```

### 2. Create Environment File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY_ID` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name
- `R2_ENDPOINT` - R2 endpoint URL

### 3. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### File Management
- `POST /api/files/upload` - Upload APK file (protected)
- `GET /api/files` - Get all user files (protected)
- `DELETE /api/files/:fileId` - Delete file (protected)

### Public Download
- `GET /d/:fileId` - Download file
- `GET /d/:fileId/info` - Get file info

### System
- `GET /health` - Health check
- `GET /` - API info

## Project Structure

```
apk-filehost-backend/
├── models/
│   ├── User.js          # User schema with auth
│   └── File.js          # File metadata schema
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── files.js         # File management routes
│   └── download.js      # Public download routes
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── utils/
│   └── r2Storage.js     # Cloudflare R2 operations
├── server.js            # Main application entry
├── package.json         # Dependencies
├── .env.example         # Environment variables template
└── .gitignore          # Git ignore rules
```

## Key Features Explained

### Storage Quota Management
- Each user has 5GB default quota
- Quota checked before upload
- Storage usage tracked automatically

### File Upload Flow
1. Validate file type (.apk only)
2. Check storage quota
3. Generate unique file ID
4. Upload to R2 storage
5. Save metadata to MongoDB
6. Return download link

### Download System
- Direct streaming from R2
- Proper APK MIME type headers
- Download counter increments
- Cached for 24 hours

## Free Hosting Options

Deploy this backend to:
- **Render** (750 hours/month free)
- **Railway** ($5 credit/month)
- **Fly.io** (3 VMs free)

## Next Steps

1. Set up MongoDB Atlas (free 512MB)
2. Set up Cloudflare R2 (free 10GB)
3. Configure environment variables
4. Deploy to hosting platform
5. Connect frontend application

## License

MIT
