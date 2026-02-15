# APK FileHost - Frontend

Free APK file hosting tool frontend built with React and Vite.

## Features

- ✅ User authentication (Register/Login)
- ✅ File upload with drag & drop
- ✅ Real-time upload progress
- ✅ File management dashboard
- ✅ Download link copying
- ✅ Storage quota display
- ✅ Download statistics
- ✅ Responsive design

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **HTTP Client**: Axios
- **Styling**: Vanilla CSS

## Setup Instructions

### 1. Install Dependencies

```bash
cd apk-filehost-frontend
npm install
```

If you have disk space issues, you can try:
```bash
npm clean-install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update the API URL:

```bash
cp .env.example .env
```

Update the backend URL in `.env`:
```
VITE_API_URL=http://localhost:5000
```

For production, use your deployed backend URL:
```
VITE_API_URL=https://your-backend.onrender.com
```

### 3. Run Development Server

```bash
npm run dev
```

The app will run on `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Project Structure

```
apk-filehost-frontend/
├── src/
│   ├── components/
│   │   ├── Auth.jsx           # Login/Register component
│   │   ├── Auth.css
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Dashboard.css
│   │   ├── FileUpload.jsx     # File upload with drag-drop
│   │   ├── FileUpload.css
│   │   ├── FileList.jsx       # File list display
│   │   └── FileList.css
│   ├── contexts/
│   │   └── AuthContext.jsx    # Authentication state management
│   ├── App.jsx                # Main app component
│   ├── App.css                # Global styles
│   └── main.jsx              # Entry point
├── package.json
├── vite.config.js
├── .env.example
└── .env
```

## Key Features Explained

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Automatic login on page refresh
- Protected routes

### File Upload
- Drag & drop interface
- File type validation (.apk only)
- File size validation (max 100MB)
- Real-time upload progress
- Instant download link generation

### Dashboard
- Storage usage statistics
- Download count tracking
- File management (view, copy link, delete)
- Responsive grid layout

## Free Hosting Options

Deploy this frontend to:
- **Vercel** (100 GB bandwidth/month free)
- **Netlify** (100 GB bandwidth/month free)
- **GitHub Pages** (free static hosting)

### Quick Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variable: `VITE_API_URL`
5. Deploy!

## Environment Variables

- `VITE_API_URL` - Backend API URL (required)

## Development Tips

1. Make sure backend is running on `http://localhost:5000`
2. Check browser console for API errors
3. Use React DevTools for debugging
4. Test file upload with small APK files first

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
