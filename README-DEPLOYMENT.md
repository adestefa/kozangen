# Kozangen NextJS v1.0.0 - VPS Deployment Guide

## 🎉 Milestone Complete
Successfully implemented complete run persistence and input locking system. All user requirements met and QA passed.

## 📋 Pre-Deployment Checklist
- ✅ Run persistence system implemented
- ✅ Input locking functionality working
- ✅ Version number (v1.0.0) displayed in UI
- ✅ QA testing completed with multiple runs
- ✅ Docker configuration prepared
- ✅ Deployment scripts ready

## 🚀 VPS Deployment Instructions

### Prerequisites
- Docker and Docker Compose installed on VPS
- Git access to repository
- Port 3000 available

### Quick Deployment
```bash
# Clone repository
git clone <repository-url>
cd kozangen-nextjs

# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Docker Deployment
```bash
# Build the image
docker build -t kozangen-nextjs:latest .

# Run the container
docker run -d \
  --name kozangen-nextjs-container \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/input:/app/input \
  -v $(pwd)/static:/app/static \
  -e NODE_ENV=production \
  kozangen-nextjs:latest
```

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📁 Directory Structure
```
kozangen-nextjs/
├── data/                 # Run persistence (auto-created)
│   └── runs.json        # Runs database
├── input/               # Input images (mount on VPS)
│   ├── models/         # Model images
│   └── outfits/        # Clothing images (top_*, bottom_*)
├── static/             # Generated results (auto-created)
│   └── results/        # AI service outputs
└── src/                # Application source
```

## 🔧 Environment Variables
- `NODE_ENV=production` - Production mode
- `PORT=3000` - Application port
- `KOZANGEN_VERSION=1.0.0` - Version display

## 🌐 Public URL Configuration
After deployment, update the image domains in `next.config.js` for your VPS domain:
```javascript
images: {
  domains: ['localhost', 'your-vps-domain.com'],
  unoptimized: true
}
```

## 📊 Health Checks
- Application: `http://your-vps:3000`
- Version check: Look for "v1.0.0" in header
- API health: `http://your-vps:3000/api/runs`

## 🔍 Troubleshooting
```bash
# View container logs
docker logs kozangen-nextjs-container

# Check container status
docker ps | grep kozangen

# Access container shell
docker exec -it kozangen-nextjs-container sh

# Restart container
docker restart kozangen-nextjs-container
```

## 🎯 Next Steps for API Integration
1. **Upload input images** to VPS `/input/` directory
2. **Configure publicly accessible URLs** for external AI services
3. **Update API endpoints** to use VPS domain instead of localhost
4. **Test complete workflow** with real AI service API calls

## 📝 Version History
- **v1.0.0**: Complete run persistence and input locking system
  - Run state management with draft/locked status
  - Input image selection and auto-save
  - Visual locking indicators and new tab inspection
  - Docker deployment configuration ready