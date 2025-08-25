# Kozan AI Dashboard

Clean, modern Next.js dashboard for comparing AI fashion services (HuHu AI, FASHN AI, FitRoom).

## 🚀 Quick Start

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### VPS Deployment (Recommended)

**One-Command Setup:**
```bash
# Run this single command on your VPS to set up everything:
curl -sSL https://raw.githubusercontent.com/adestefa/kozangen/main/initialize-vps.sh | bash
```

**Manual Setup:**
```bash
# Download and run the initialization script:
wget https://raw.githubusercontent.com/adestefa/kozangen/main/initialize-vps.sh
chmod +x initialize-vps.sh
./initialize-vps.sh

# Future deployments:
cd /opt/kozangen-dashboard && git pull && ./deploy.sh
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── runs/           # Run management
│   │   ├── images/         # Image listing
│   │   ├── static/         # Static file serving
│   │   └── [service]/      # Service APIs (huhu, fashn, fitroom)
│   └── page.tsx            # Main dashboard
├── components/
│   ├── ui/                 # Reusable UI components
│   └── layout/             # Layout components  
├── lib/
│   ├── services/           # Service managers (individual, no shared abstractions)
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
└── hooks/                  # React hooks (SWR data fetching)

input/                      # Input images for AI services
├── models/                 # Model images (MODEL_1.png, etc.)
└── outfits/               # Clothing images (top_1.jpeg, bottom_1.jpeg, etc.)
```

## 🏗️ Architecture

- **Clean & Simple**: No over-engineering, small parseable files
- **Individual Service Managers**: Each AI service has its own manager (no shared abstractions)
- **Comprehensive Logging**: All service calls tracked with history and analytics
- **Graceful Error Handling**: 4-layer error system with user-friendly notifications
- **Real-time Updates**: SWR-powered data fetching with automatic revalidation

## 🔧 Environment Configuration

Copy `.env.example` to `.env.local` for local development:
```bash
cp .env.example .env.local
```

Production environment variables are set via `.env.production`.

## 📋 Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build  
- `npm run start` - Production server
- `npm run lint` - ESLint checking
- `./deploy.sh` - VPS deployment (run on VPS)

## 🌐 Deployment Workflow

### The Cleanest Way: GitHub → VPS Git Pull → Build → Done

1. **Local Development:**
   ```bash
   npm run dev  # localhost:3000
   ```

2. **Commit and Push:**
   ```bash
   git add .
   git commit -m "feature: description"
   git push origin main
   ```

3. **Deploy on VPS (one command):**
   ```bash
   ssh kgen "cd /opt/kozangen-dashboard && git pull && ./deploy.sh"
   ```

## 🎯 Features

- **Dashboard Interface**: Pixel-perfect match to design specifications
- **Service Comparison**: Side-by-side AI service results
- **Image Management**: Upload and organize model/clothing images
- **Run Management**: Create, save, and replay generation sessions
- **Service History**: Complete audit trail of all AI service calls
- **Error Handling**: Graceful failure recovery with user notifications
- **Real-time Updates**: Live progress tracking during generation

## 🔧 Technical Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Data Fetching**: SWR for real-time updates
- **State Management**: React hooks, no external store needed
- **Deployment**: PM2, Nginx reverse proxy
- **File Serving**: Static image hosting for AI service access

## 🚀 Production Deployment

The application is designed for VPS deployment where AI services can access hosted images:

1. **Environment Setup**: Production config via `.env.production`
2. **Static File Serving**: Images served at `/input/` routes
3. **Process Management**: PM2 for production process management
4. **Reverse Proxy**: Nginx configuration for production serving

## 📊 Service Integration

Each AI service has its own dedicated manager:

- **HuHu AI Manager**: Two-step processing (top → bottom garments)
- **FASHN AI Manager**: Quality-focused generation with polling
- **FitRoom Manager**: Single combo call with multipart upload

All services include:
- Independent parameter validation
- Service-specific error handling  
- Comprehensive request/response logging
- Real-time progress tracking

Clean, simple, effective. ✨
