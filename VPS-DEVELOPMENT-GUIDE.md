# 🚀 Kozangen VPS Development Environment Setup Guide

## 📋 **Overview**
This guide establishes a complete VPS-only development environment for Kozangen AI Fashion Dashboard, enabling real AI service integration testing without localhost limitations.

## 🎯 **Why VPS Development?**
- **AI Integration Requirements**: External AI services (FitRoom, FASHN, HuHu) need accessible URLs
- **Real Environment Testing**: Production-like conditions for accurate testing
- **No Localhost Issues**: Eliminates localhost → VPS URL conversion problems
- **Team Collaboration**: Shared development environment for consistent testing

## 📊 **Current VPS Infrastructure**
- **VPS Address**: 192.155.91.109:3000
- **Application Path**: `/opt/kozangen/kozangen/`
- **Container**: `kozangen-nextjs-container`
- **Base Image**: `node:18-alpine`
- **User Context**: `nextjs:nodejs` (uid:1001, gid:1001)

## 🔧 **Development Workflow Options Analysis**

### ⭐ **RECOMMENDED: VS Code Remote SSH** 
**Best for primary development**
- ✅ Direct file editing on VPS
- ✅ Full IDE features and extensions
- ✅ Real-time development with AI services
- ✅ Instant feedback loop
- ❌ Requires SSH setup
- ❌ Dependent on VPS performance

### **Option B: Git-based Development**
**Best for feature branches and team collaboration**
- ✅ Version control integration
- ✅ Team workflow support
- ✅ Deployment automation
- ❌ Slower feedback cycle
- ❌ Manual deployment steps

### **Option C: File Synchronization**
**Backup option only**
- ✅ Local development tools
- ❌ Complex sync setup
- ❌ Potential file conflicts
- ❌ Not recommended for primary use

## 🚀 **Quick Start Setup**

### **Prerequisites**
- SSH access to VPS (192.155.91.109)
- VS Code with Remote SSH extension
- Basic Docker knowledge
- Git familiarity

### **Phase 1: SSH Access Setup**
```bash
# 1. Generate SSH key pair (if needed)
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# 2. Copy public key to VPS
ssh-copy-id root@192.155.91.109

# 3. Test connection
ssh root@192.155.91.109
```

### **Phase 2: VS Code Remote SSH Configuration**
1. Install VS Code Remote SSH extension
2. Add to your `~/.ssh/config`:
```bash
Host kozangen-vps
    HostName 192.155.91.109
    User root
    Port 22
    IdentityFile ~/.ssh/id_rsa
```
3. Connect: `Ctrl+Shift+P` → "Remote-SSH: Connect to Host" → `kozangen-vps`

### **Phase 3: Development Scripts Setup**
Once connected to VPS, navigate to project directory and create helper scripts:

```bash
cd /opt/kozangen/kozangen/

# Create full rebuild script
cat > dev-restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Rebuilding and restarting Kozangen..."
docker build -t kozangen-nextjs:latest .
docker stop kozangen-nextjs-container 2>/dev/null || true
docker rm kozangen-nextjs-container 2>/dev/null || true
docker run -d \
  --name kozangen-nextjs-container \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/input:/app/input \
  -v $(pwd)/static:/app/static \
  -e NODE_ENV=production \
  kozangen-nextjs:latest
echo "✅ Container restarted. Check: docker logs kozangen-nextjs-container"
EOF

chmod +x dev-restart.sh

# Create quick restart script (no rebuild)
cat > quick-restart.sh << 'EOF'
#!/bin/bash
echo "⚡ Quick restarting container..."
docker restart kozangen-nextjs-container
sleep 3
docker logs --tail 20 kozangen-nextjs-container
EOF

chmod +x quick-restart.sh
```

## 🔄 **Development Workflow**

### **Standard Development Cycle**
1. **Edit**: Modify files using VS Code Remote SSH
2. **Test**: Run `./dev-restart.sh` to rebuild and restart
3. **Verify**: Check application at http://192.155.91.109:3000
4. **AI Test**: Create runs and test AI service integrations
5. **Debug**: Use container logs for troubleshooting

### **Quick Changes (No Code Build Required)**
For configuration changes, static files, or data updates:
1. **Edit**: Modify files
2. **Quick Restart**: Run `./quick-restart.sh`
3. **Verify**: Test changes immediately

## 🤖 **AI Service Integration Testing**

### **Verify External Service Access**
```bash
# Test image accessibility from external services
curl -I http://192.155.91.109:3000/api/static/input/models/MODEL_1.png
curl -I http://192.155.91.109:3000/api/static/input/outfits/top_1.jpeg
curl -I http://192.155.91.109:3000/api/static/input/outfits/bottom_1.jpeg
```

### **Create Test Run**
```bash
curl -X POST http://192.155.91.109:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"model":"MODEL_1","top":"top_1","bottom":"bottom_1"}'
```

### **Test AI Service Integration**
```bash
# FitRoom integration
curl -X POST http://192.155.91.109:3000/api/fitroom/generate \
  -H "Content-Type: application/json" \
  -d '{"runId":"latest"}'

# FASHN integration
curl -X POST http://192.155.91.109:3000/api/fashn/generate \
  -H "Content-Type: application/json" \
  -d '{"runId":"latest"}'

# HuHu integration
curl -X POST http://192.155.91.109:3000/api/huhu/generate \
  -H "Content-Type: application/json" \
  -d '{"runId":"latest"}'
```

### **Monitor ServiceLogger**
```bash
# Real-time monitoring of AI service calls
tail -f data/results/*/run_metadata.json

# Check latest run logs
ls -la data/results/ | tail -5
```

## 🔍 **Troubleshooting Reference**

### **Container Management**
```bash
# Check container status
docker ps | grep kozangen

# View real-time logs
docker logs -f kozangen-nextjs-container

# View last 50 log lines
docker logs --tail 50 kozangen-nextjs-container

# Access container shell
docker exec -it kozangen-nextjs-container sh

# Restart container only
docker restart kozangen-nextjs-container
```

### **File System Issues**
```bash
# Check file permissions
ls -la input/models/
ls -la input/outfits/

# Fix permissions if needed
chown -R 1001:1001 input/
chmod -R 644 input/models/* input/outfits/*
```

### **Network Testing**
```bash
# Test internal container access
docker exec kozangen-nextjs-container curl -I http://localhost:3000/api/runs

# Test external access
curl -I http://192.155.91.109:3000/api/runs

# Test static file serving
curl -I http://192.155.91.109:3000/api/static/input/models/MODEL_1.png
```

### **Common Issues & Solutions**

**Issue**: Container won't start
```bash
# Check logs for errors
docker logs kozangen-nextjs-container
# Common causes: port conflicts, permission issues, build failures
```

**Issue**: Static files return 404
```bash
# Check file exists and permissions
ls -la input/models/MODEL_1.png
chown -R 1001:1001 input/
```

**Issue**: AI services can't access images
```bash
# Verify external URL accessibility
curl -I http://192.155.91.109:3000/api/static/input/models/MODEL_1.png
# Should return 200 OK with proper MIME type
```

## 👥 **Team Development Guidelines**

### **Individual Developer Setup**
1. Get SSH access from team lead
2. Follow Phase 1-3 setup steps
3. Create personal feature branch
4. Test changes on VPS before pushing

### **Collaboration Workflow**
1. **Feature Development**: Work on individual branches
2. **Testing**: Use shared VPS for AI integration testing
3. **Code Review**: Standard git PR process
4. **Deployment**: Team lead runs production deployment

### **Branch Management**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Work and test on VPS
./dev-restart.sh

# Push when ready
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name
```

## 🔒 **Security Considerations**
- SSH key-based authentication only
- VPS firewall configured (ports 22, 80, 3000)
- Container runs as non-root user (nextjs:nodejs)
- Volume mounts with proper file permissions
- Regular security updates recommended

## 📈 **Performance Optimization**
- **Build Optimization**: Multi-stage Docker build reduces image size
- **Caching**: Static files served with cache headers
- **Resource Limits**: Container configured for VPS resource limits
- **Log Rotation**: Monitor log sizes to prevent disk issues

## 📝 **Development Scripts Reference**

### **Available Scripts**
- `./dev-restart.sh` - Full rebuild and restart (use for code changes)
- `./quick-restart.sh` - Container restart only (use for config changes)
- `./deploy.sh` - Production deployment (existing script)

### **Custom Script Creation**
```bash
# Create debug script for detailed logging
cat > debug.sh << 'EOF'
#!/bin/bash
echo "🔍 Debug Information:"
echo "Container Status:"
docker ps | grep kozangen
echo -e "\nLast 20 Log Lines:"
docker logs --tail 20 kozangen-nextjs-container
echo -e "\nFile Permissions:"
ls -la input/models/ | head -3
echo -e "\nDisk Usage:"
df -h /opt/kozangen/
EOF

chmod +x debug.sh
```

## 🎯 **Success Validation Checklist**
- [ ] SSH access working
- [ ] VS Code Remote SSH connected
- [ ] Development scripts created and tested
- [ ] Container builds and starts successfully
- [ ] Application accessible at http://192.155.91.109:3000
- [ ] Static files return 200 OK from external calls
- [ ] AI service integration tests pass
- [ ] ServiceLogger captures run metadata
- [ ] Team members can connect and develop

## 🚀 **Advanced Development Tips**

### **Hot Reload for Development**
For faster iteration during development:
```bash
# Install nodemon in container for hot reload
docker exec kozangen-nextjs-container npm install -g nodemon

# Or use development mode with volume mounts
docker run -d \
  --name kozangen-dev \
  -p 3001:3000 \
  -v $(pwd):/app \
  -e NODE_ENV=development \
  node:18-alpine \
  sh -c "cd /app && npm install && npm run dev"
```

### **Multiple Environment Testing**
```bash
# Run staging environment on different port
docker run -d \
  --name kozangen-staging \
  -p 3001:3000 \
  -v $(pwd)/data-staging:/app/data \
  -v $(pwd)/input:/app/input \
  -e NODE_ENV=production \
  kozangen-nextjs:latest
```

## 📞 **Support & Resources**
- **VPS Access Issues**: Contact team lead for SSH key setup
- **Container Problems**: Check troubleshooting section above
- **AI Service Issues**: Verify external URL accessibility
- **Performance Issues**: Monitor `docker stats kozangen-nextjs-container`

---

**🎉 Ready to develop! Your VPS environment is configured for seamless AI integration testing.**

*Last Updated: August 26, 2025*
*Version: 1.0.0*