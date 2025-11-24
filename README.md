# CodeSight

CodeSight is a powerful code analysis and visualization tool that helps developers understand complex codebases through interactive visualizations, AI-powered insights, and dependency analysis.

## 🏗️ Architecture

This project consists of two main components:

- **Frontend** (`/FrontEnd`) - React + TypeScript + Vite application with interactive UI
- **Backend** (`/backend`) - Node.js + Express API server with AI integration

## ✨ Features

- 📊 **Interactive Code Visualization** - Visual dependency graphs and code structure analysis
- 🤖 **AI-Powered Insights** - Gemini AI integration for code understanding and analysis
- 🔐 **GitHub Integration** - OAuth authentication and repository access
- 📁 **Repository Analysis** - Upload and analyze entire codebases
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode support

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- GitHub account (for OAuth)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd CodeSight
   ```

2. **Install dependencies**
   
   Frontend:
   ```bash
   cd FrontEnd
   npm install
   ```
   
   Backend:
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file in the backend:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` and fill in your credentials:
   - `GITHUB_CLIENT_ID` - Get from [GitHub OAuth Apps](https://github.com/settings/developers)
   - `GITHUB_CLIENT_SECRET` - Get from GitHub OAuth Apps
   - `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `SESSION_SECRET` - Generate a random string for session encryption

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd FrontEnd
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:5173`

## 📦 Building for Production

### Frontend
```bash
cd FrontEnd
npm run build
```
Build output will be in `FrontEnd/dist/`

### Backend
```bash
cd backend
npm run build
npm start
```
Build output will be in `backend/dist/`

## 🔧 Tech Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Radix UI** - Accessible UI components
- **React Flow** - Interactive diagrams
- **Framer Motion** - Animations
- **Zustand** - State management

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Passport** - Authentication
- **Google Gemini AI** - AI integration
- **SQLite** - Session storage
- **Multer** - File uploads

## 🌐 Deployment

### Vercel Deployment (Recommended)

**Frontend:**
1. Connect your GitHub repository to Vercel
2. Set root directory to `FrontEnd`
3. Build command: `npm run build`
4. Output directory: `dist`

**Backend:**
1. Deploy as a separate Vercel project
2. Set root directory to `backend`
3. Build command: `npm run build`
4. Start command: `npm start`
5. Configure environment variables in Vercel dashboard

**Important:** Update the following environment variables for production:
- `FRONTEND_URL` - Your Vercel frontend URL
- `GITHUB_CALLBACK_URL` - Update to production backend URL
- Update GitHub OAuth app settings with production callback URL

## 📝 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `SESSION_SECRET` | Secret for session encryption | Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID | Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret | Yes |
| `GITHUB_CALLBACK_URL` | GitHub OAuth callback URL | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

See `backend/.env.example` for a complete template.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
- Change the `PORT` in `backend/.env`
- Or kill the process using the port

**GitHub OAuth not working:**
- Verify callback URL matches in GitHub OAuth app settings
- Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct

**AI features not working:**
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits

## 📧 Support

For issues and questions, please open an issue on GitHub.
