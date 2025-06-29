# TaskFlow 📋

A vanilla JavaScript todo application with age verification and task stage management.

## 🌟 Features

- **Age Verification**: Users must be 10+ years old to access
- **Task Management**: Todo, Completed, and Archived stages
- **Data Persistence**: Uses localStorage for data storage
- **API Integration**: DummyJSON for initial tasks, UI Avatars for profile pictures
- **Responsive Design**: Works on desktop and mobile

## 🚀 Live Demo

[https://task-flow-rho-flax.vercel.app/](https://task-flow-rho-flax.vercel.app/)

## 🛠️ Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Browser localStorage
- UI Avatars API & DummyJSON API
- Deployed on Vercel

## 📦 Setup

```bash
git clone https://github.com/rahuldewangan05/TaskFlow.git
cd TaskFlow
# Open index.html in browser or use local server
python -m http.server 8000
```

## 🎯 How It Works

1. **Landing Page**: Enter name and birth date for age verification
2. **Main App**: Manage tasks across three stages
3. **Task Actions**: Move tasks between Todo → Completed → Archived
4. **Profile**: Auto-generated avatar and sign-out functionality

## 🔧 APIs Used

- **UI Avatars**: `https://ui-avatars.com/api/` for profile pictures
- **DummyJSON**: `https://dummyjson.com/todos` for initial task data
