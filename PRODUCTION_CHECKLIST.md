# Mehram Video Generator - Production Readiness Checklist

## ✅ Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing: `npm test`
- [ ] Linting passed: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] No console.log statements in production code
- [ ] Error handling implemented
- [ ] Security vulnerabilities checked: `npm audit`

### Configuration
- [ ] `.env` configured for production
- [ ] `NODE_ENV=production`
- [ ] All required environment variables set
- [ ] Database path configured
- [ ] Output directory path configured
- [ ] FFmpeg path verified
- [ ] Logging level set appropriately

### Security
- [ ] SSL/TLS certificates ready
- [ ] CORS configured if needed
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented if needed
- [ ] Sensitive data not logged

### Infrastructure
- [ ] Server/VM provisioned
- [ ] Firewall configured
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Logging aggregation set up
- [ ] Load balancer configured (if needed)
- [ ] CDN configured (if needed)

### Deployment
- [ ] Build process automated
- [ ] Deployment script tested
- [ ] Rollback plan documented
- [ ] Database migration plan ready
- [ ] Health check endpoint tested
- [ ] Graceful shutdown tested

### Documentation
- [ ] Deployment guide reviewed
- [ ] Architecture documented
- [ ] API documentation complete
- [ ] Troubleshooting guide prepared
- [ ] Emergency contacts listed

---

## 🐳 Quick Docker Deployment

```bash
# 1. Build image
docker build -t mehram:latest .

# 2. Run with compose
docker-compose up -d

# 3. Verify
docker-compose ps
curl http://localhost/health

# 4. View logs
docker-compose logs -f mehram
```

---

## 🚢 Deployment Commands by Platform

### Docker Compose
```bash
docker-compose up -d
docker-compose logs -f
```

### Traditional Linux Server
```bash
git pull origin main
npm install
npm run build
pm2 restart mehram
```

### Kubernetes
```bash
kubectl apply -f deployment.yaml
kubectl rollout status deployment/mehram
```

### AWS ECS
```bash
aws ecs update-service --cluster mehram --service mehram --force-new-deployment
```

---

## 📊 Post-Deployment Verification

```bash
# 1. Health check
curl http://your-domain/health

# 2. API check
curl http://your-domain/api

# 3. Database connection
# Check logs for any database errors

# 4. Performance check
# Monitor CPU and memory usage

# 5. File permissions
# Verify output directory is writable
```

---

## 🔄 Rollback Procedure

```bash
# If deployment fails, rollback to previous version

# Docker Compose
docker-compose down
git checkout previous-commit
docker-compose up -d

# PM2
pm2 restart mehram
pm2 logs mehram

# Kubernetes
kubectl rollout undo deployment/mehram
kubectl rollout history deployment/mehram
```

---

## 🆘 Emergency Procedures

### High CPU Usage
```bash
# Check what's consuming CPU
docker top mehram

# View application logs
docker-compose logs -f mehram | grep -i error

# Restart service
docker-compose restart mehram
```

### Disk Space Issues
```bash
# Check disk usage
df -h

# Clean temporary files
docker exec mehram npm run clean

# Prune docker
docker system prune -a
```

### Database Corruption
```bash
# Restore from backup
cp ./backups/mehram.db.backup ./mehram.db

# Restart service
docker-compose restart mehram
```

### Out of Memory
```bash
# Increase memory allocation
# Docker: Update docker-compose.yml
# VM: Increase RAM or swap

# Restart
docker-compose restart mehram
```

---

## 📞 Support Contacts

- **Developer**: rameshprasad2254
- **Repository**: https://github.com/rameshprasad2254/Mehram
- **Issues**: https://github.com/rameshprasad2254/Mehram/issues
