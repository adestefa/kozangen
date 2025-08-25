#!/bin/bash
# Complete VPS Initialization Script for Kozan AI Dashboard
# Run this script on the VPS to set up everything from scratch

set -e

echo "🚀 Starting Kozan AI Dashboard VPS initialization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    print_warning "Running as root. Some commands will be adjusted."
    SUDO=""
else
    print_status "Running as regular user with sudo."
    SUDO="sudo"
fi

# Step 1: Update system
print_status "Updating system packages..."
$SUDO apt update && $SUDO apt upgrade -y

# Step 2: Install Node.js and npm
print_status "Installing Node.js and npm..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
    $SUDO apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Step 3: Install PM2 globally
print_status "Installing PM2 process manager..."
if ! command -v pm2 &> /dev/null; then
    $SUDO npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 4: Install Nginx
print_status "Installing and configuring Nginx..."
if ! command -v nginx &> /dev/null; then
    $SUDO apt install -y nginx
    $SUDO systemctl enable nginx
    $SUDO systemctl start nginx
    print_success "Nginx installed and started"
else
    print_success "Nginx already installed"
fi

# Step 5: Create application directory
print_status "Creating application directories..."
$SUDO mkdir -p /opt/kozangen-dashboard
$SUDO mkdir -p /opt/dashboard_data/input
$SUDO mkdir -p /opt/dashboard_data/results

# Set ownership to current user
if [[ $EUID -ne 0 ]]; then
    $SUDO chown -R $USER:$USER /opt/kozangen-dashboard
    $SUDO chown -R $USER:$USER /opt/dashboard_data
fi

print_success "Application directories created"

# Step 6: Clone the repository
print_status "Cloning Kozan AI Dashboard repository..."
cd /opt/kozangen-dashboard
if [ -d ".git" ]; then
    print_warning "Repository already exists, pulling latest changes..."
    git pull origin main
else
    # Remove directory contents if not a git repo
    rm -rf /opt/kozangen-dashboard/*
    git clone https://github.com/adestefa/kozangen.git .
fi
print_success "Repository cloned/updated"

# Step 7: Install dependencies
print_status "Installing application dependencies..."
npm ci --production
print_success "Dependencies installed"

# Step 8: Create production environment file
print_status "Creating production environment configuration..."
VPS_IP=$(hostname -I | awk '{print $1}')
cat > .env.production << EOF
NODE_ENV=production
VPS_HOST=$VPS_IP
IMAGE_BASE_URL=http://$VPS_IP
PORT=3000
EOF
print_success "Environment configuration created for IP: $VPS_IP"

# Step 9: Build the application
print_status "Building the application..."
npm run build
print_success "Application built successfully"

# Step 10: Configure Nginx
print_status "Configuring Nginx reverse proxy..."
$SUDO tee /etc/nginx/sites-available/kozangen > /dev/null << EOF
server {
    listen 80;
    server_name $VPS_IP;
    
    # Main Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Increase timeouts for AI service calls
        proxy_connect_timeout       60s;
        proxy_send_timeout          60s;
        proxy_read_timeout          60s;
    }
    
    # Static files for input images
    location /input/ {
        alias /opt/dashboard_data/input/;
        expires 1d;
        add_header Cache-Control "public, immutable";
        
        # CORS headers for AI services
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "Origin, Content-Type, Accept";
    }
    
    # Results images
    location /results/ {
        alias /opt/dashboard_data/results/;
        expires 1h;
        add_header Cache-Control "public";
    }
}
EOF

# Enable the site
$SUDO ln -sf /etc/nginx/sites-available/kozangen /etc/nginx/sites-enabled/
$SUDO rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
$SUDO nginx -t
$SUDO systemctl reload nginx
print_success "Nginx configured and reloaded"

# Step 11: Start the application with PM2
print_status "Starting application with PM2..."
# Stop existing process if running
pm2 delete kozangen 2>/dev/null || true

# Start new process
pm2 start npm --name "kozangen" -- start
pm2 save
pm2 startup | grep -v "PM2" | $SUDO bash || true

print_success "Application started with PM2"

# Step 12: Setup firewall (optional but recommended)
print_status "Configuring basic firewall..."
if command -v ufw &> /dev/null; then
    $SUDO ufw --force enable
    $SUDO ufw allow ssh
    $SUDO ufw allow http
    $SUDO ufw allow https
    print_success "Firewall configured"
else
    print_warning "UFW not available, skipping firewall setup"
fi

# Step 13: Final status check
echo ""
echo "🎉 Kozan AI Dashboard VPS initialization complete!"
echo ""
echo "📊 System Status:"
echo "  • Node.js: $(node --version)"
echo "  • npm: $(npm --version)"
echo "  • PM2: $(pm2 --version)"
echo "  • Nginx: $(nginx -v 2>&1)"
echo ""
echo "🌐 Application URLs:"
echo "  • Dashboard: http://$VPS_IP"
echo "  • Status: http://$VPS_IP/api/runs"
echo ""
echo "📋 Management Commands:"
echo "  • Check app status: pm2 status"
echo "  • View app logs: pm2 logs kozangen"
echo "  • Restart app: pm2 restart kozangen"
echo "  • Deploy updates: cd /opt/kozangen-dashboard && git pull && ./deploy.sh"
echo ""
echo "🔧 Configuration Files:"
echo "  • App directory: /opt/kozangen-dashboard"
echo "  • Data directory: /opt/dashboard_data"
echo "  • Nginx config: /etc/nginx/sites-available/kozangen"
echo "  • Environment: /opt/kozangen-dashboard/.env.production"
echo ""

# Step 14: Test the application
print_status "Testing application connectivity..."
sleep 5
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Application is responding locally"
else
    print_error "Application is not responding locally"
fi

if curl -s http://$VPS_IP > /dev/null; then
    print_success "Application is accessible via public IP"
else
    print_warning "Application may not be accessible via public IP (check firewall/networking)"
fi

print_success "VPS initialization completed successfully!"
print_status "You can now access the Kozan AI Dashboard at: http://$VPS_IP"