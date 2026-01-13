# Operations Guide

## 🚀 Deployment

### Quick Deploy
```bash
# Build all packages
npm run build

# Start development
npm run dev

# Production deployment
npm run build
npm run start
```

### Enterprise Deployment
- [Enterprise Architecture](../architecture/ENTERPRISE_ARCHITECTURE.md)
- [Backup & Disaster Recovery](backup-disaster-recovery.md)
- [Key Rotation](key-rotation.md)

## 🔧 Configuration

### Environment Variables
- `SONATE_PUBLIC_KEY` - Trust receipt verification
- `SONATE_PRIVATE_KEY` - Development signing key
- `REDIS_URL` - Rate limiting and caching
- `DATABASE_URL` - Production database

### Docker Deployment
```bash
# Production stack
docker-compose up -d

# Pilot environment
docker-compose -f docker-compose.pilot.yml up -d
```

## 📊 Monitoring

### Health Checks
- `/api/health` - System health
- `/api/metrics` - Performance metrics
- `/api/status` - Service status

### Performance Monitoring
- Response time monitoring
- Error rate tracking
- Resource utilization

## 🔒 Security

### Security Operations
- [Security Guide](../security/SECURITY_GUIDE.md)
- Security audit workflow
- Vulnerability scanning
- Access control

### Backup Procedures
- Database backups
- Configuration backups
- Disaster recovery testing

## 🛠️ Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version >= 20.0.0
2. **Memory Issues**: Increase Node.js heap size
3. **Database Connection**: Verify connection string
4. **Redis Connection**: Check Redis service status

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 📈 Scaling

### Horizontal Scaling
- Load balancer configuration
- Service discovery
- Health checks

### Vertical Scaling
- Resource allocation
- Performance tuning
- Memory optimization

## 🔍 Auditing

### Audit Logs
- Trust receipt verification
- API access logs
- Security events

### Compliance
- SOC 2 compliance
- GDPR compliance
- ISO 27001 alignment
