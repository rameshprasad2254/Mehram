# Mehram Video Generator - Deployment Guide

## 🚀 Deployment Options

### 1. Docker Deployment (Recommended)

#### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f mehram

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

#### Using Docker CLI

```bash
# Build image
docker build -t mehram:latest .

# Run container
docker run -d \
  --name mehram \
  -p 3000:3000 \
  -v mehram_output:/app/output \
  -v mehram_data:/app/data \
  -e NODE_ENV=production \
  mehram:latest

# View logs
docker logs -f mehram

# Stop container
docker stop mehram

# Remove container
docker rm mehram
```

### 2. Traditional Server Deployment

#### Prerequisites
- Node.js 18+
- npm or yarn
- FFmpeg installed
- Linux/Unix system (Ubuntu 20.04+ recommended)

#### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/rameshprasad2254/Mehram.git
cd Mehram

# 2. Install dependencies
npm install

# 3. Build project
npm run build

# 4. Set up environment
cp .env.example .env
# Edit .env with production settings

# 5. Create directories
mkdir -p ./output/{videos,thumbnails,temp,uploads}
mkdir -p ./backups

# 6. Start with PM2 (recommended for production)
npm install -g pm2
pm2 start dist/index.js --name mehram
pm2 save
pm2 startup
```

#### Using Systemd Service

Create `/etc/systemd/system/mehram.service`:

```ini
[Unit]
Description=Mehram Video Generator
After=network.target

[Service]
Type=simple
User=mehram
WorkingDirectory=/home/mehram/Mehram
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mehram
sudo systemctl start mehram
sudo systemctl status mehram
```

### 3. Cloud Deployment

#### Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create mehram-video-generator

# Add buildpack
heroku buildpacks:add heroku/nodejs
heroku buildpacks:add heroku/apt  # For FFmpeg

# Configure environment
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

#### AWS EC2

```bash
# SSH into instance
ssh -i key.pem ubuntu@instance-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg

# Clone and setup
git clone https://github.com/rameshprasad2254/Mehram.git
cd Mehram
npm install
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/index.js
pm2 save
```

#### DigitalOcean App Platform

```bash
# Connect GitHub repository
# Configure buildpack
# Set environment variables
# Deploy
```

### 4. Kubernetes Deployment

#### Helm Chart

Create `values.yaml`:

```yaml
replicaCount: 2

image:
  repository: mehram
  tag: latest
  pullPolicy: Always

service:
  type: LoadBalancer
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: mehram.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: mehram-tls
      hosts:
        - mehram.example.com

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70

persistence:
  enabled: true
  size: 10Gi
```

Deploy:

```bash
helm install mehram ./chart -f values.yaml
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use secrets management
# - GitHub Secrets (CI/CD)
# - AWS Secrets Manager
# - HashiCorp Vault
# - Docker Secrets (Swarm)
```

### 2. SSL/TLS
```bash
# Generate self-signed certificate (testing)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Use Let's Encrypt (production)
certbot certonly --standalone -d mehram.example.com
```

### 3. Reverse Proxy
- Use Nginx/Apache as reverse proxy
- Enable SSL/TLS termination
- Set security headers
- Implement rate limiting

### 4. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📊 Monitoring & Logging

### Docker Monitoring

```bash
# CPU and Memory usage
docker stats mehram

# Detailed container info
docker inspect mehram
```

### Application Logs

```bash
# Docker Compose
docker-compose logs -f mehram

# Docker
docker logs -f mehram

# PM2
pm2 logs mehram

# Systemd
sudo journalctl -u mehram -f
```

### Health Monitoring

```bash
# Check health endpoint
curl http://localhost:3000/health

# Monitor with uptime monitoring service
# - UptimeRobot
# - Pingdom
# - StatusCake
```

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and push Docker image
        run: |
          docker build -t mehram:${{ github.sha }} .
          docker push mehram:${{ github.sha }}
      - name: Deploy to server
        run: |
          # Deploy script here
```

---

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt-get install ffmpeg

# Or specify path in .env
FFMPEG_PATH=/custom/path/ffmpeg
```

### Database Lock
```bash
# Remove old database
rm mehram.db

# Restart application
```

### Out of Memory
```bash
# Increase swap
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📈 Performance Tuning

### Node.js
```bash
# Increase max workers
NODE_OPTIONS="--max-old-space-size=2048" node dist/index.js

# Enable clustering
# Implement in application code
```

### Database
```bash
# Optimize SQLite
PRAGMA optimize;
VACUUM;
```

### FFmpeg
```bash
# Use hardware acceleration
# GPU encoding (NVIDIA CUDA)
scale_npp=1920:1080,format=nv12|cuda
```

---

## 🆘 Support & Resources

- **Documentation**: https://github.com/rameshprasad2254/Mehram
- **Issues**: https://github.com/rameshprasad2254/Mehram/issues
- **Discussions**: https://github.com/rameshprasad2254/Mehram/discussions
