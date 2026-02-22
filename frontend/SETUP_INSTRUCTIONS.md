# Frontend Setup Instructions

## ✅ What's Been Completed

1. ✅ React + Vite project created
2. ✅ Dependencies installed:
   - axios (API calls)
   - react-router-dom (routing)
   - @mui/material (UI components)
   - react-hook-form (forms)
   - recharts (analytics charts)
3. ✅ Project structure created
4. ✅ All service files created (API, Auth, Forms, Analytics)
5. ✅ AuthContext for state management
6. ✅ Login, Register, and Dashboard pages created
7. ✅ App.jsx configured with routes

## 🚀 How to Run the Frontend

### Method 1: Normal Start
```bash
cd frontend
npm run dev
```

### Method 2: If Memory Error Occurs
```bash
cd frontend
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Method 3: Using PowerShell Script
```powershell
cd frontend
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run dev
```

The frontend will start on: **http://localhost:5173**

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── context/
│   │   └── AuthContext.jsx    # Authentication state
│   ├── pages/
│   │   ├── LoginPage.jsx      # Login page ✅
│   │   ├── RegisterPage.jsx   # Register page ✅
│   │   └── DashboardPage.jsx  # Dashboard ✅
│   ├── services/
│   │   ├── api.js              # Axios instance ✅
│   │   ├── authService.js      # Auth API calls ✅
│   │   ├── formService.js      # Forms API calls ✅
│   │   └── analyticsService.js # Analytics API calls ✅
│   ├── utils/             # Helper functions
│   ├── App.jsx            # Main app with routing ✅
│   └── main.jsx           # Entry point
```

## 🔗 Backend Connection

The frontend is configured to connect to:
- **Backend URL**: http://localhost:8000
- Change this in `src/services/api.js` if needed

## 🎯 Next Steps

### Step 1: Start Backend (Required)
```bash
cd backend
.\venv\Scripts\activate  # Activate virtual environment
uvicorn app.main:app --reload
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test the Application
1. Go to http://localhost:5173
2. Try registering a new user
3. Login with credentials
4. View dashboard

## 📝 Available Routes

- `/` - Redirects to login
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Dashboard (requires login)

## 🔧 Troubleshooting

### Issue: npm run dev crashes with memory error
**Solution**: Increase Node.js memory:
```powershell
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Issue: "Network Error" when trying to login
**Solution**: Make sure backend is running on http://localhost:8000

### Issue: CORS errors
**Solution**: Backend already has CORS configured for all origins

## 📊 What's Implemented

✅ **Authentication**
- Login page with validation
- Register page with role selection
- JWT token management
- Protected routes

✅ **Dashboard**
- User info display
- Role-based UI
- Forms list
- Stats cards

✅ **Services**
- Complete API integration
- Error handling
- Token refresh
- Logout functionality

## 🎨 UI Components

Using Material-UI (MUI) for:
- Forms and inputs
- Buttons and cards
- Layout and grid
- Icons and chips
- Alerts and loading states

## 🚀 Next Features to Build

1. **Form Creation** - Page to create feedback forms
2. **Form Builder** - Drag-drop question builder
3. **Response Submission** - Student feedback form
4. **Analytics Dashboard** - Charts and insights
5. **Form Management** - Edit, delete, publish forms
6. **User Management** - Admin user management

## 📦 Dependencies Installed

```json
{
  "dependencies": {
    "axios": "^1.13.5",
    "react-router-dom": "^7.13.0",
    "@mui/material": "^7.3.8",
    "@mui/icons-material": "^7.3.8",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "react-hook-form": "^7.71.2",
    "recharts": "^3.7.0"
  }
}
```

## 💡 Tips

1. **Use Ctrl+C** to stop the dev server
2. **Hot reload** is enabled - changes auto-refresh
3. **Check browser console** for errors
4. **Backend must run** for API calls to work

## 🎉 You're Ready to Go!

Open your terminal and run:
```powershell
cd "c:\Users\dell\Desktop\Course Feedback management system\insightloop\frontend"
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

Then visit: **http://localhost:5173**
