# Deployment Guide

## Overview

This guide covers various deployment strategies for the SONATE platform, from development environments to production-scale enterprise deployments. Whether you're deploying to cloud platforms, on-premise servers, or containerized environments, this guide has you covered.

## Table of Contents

- [Deployment Options](#deployment-options)
- [Environment Configuration](#environment-configuration)
- [Cloud Deployment](#cloud-deployment)
- [Container Deployment](#container-deployment)
- [On-Premise Deployment](#on-premise-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Considerations](#security-considerations)
- [Scaling Strategies](#scaling-strategies)
- [Troubleshooting](#troubleshooting)

## Deployment Options

### Development Environment

**Purpose**: Local development and testing
**Infrastructure**: Local machine or development server
**Database**: Local PostgreSQL/Redis instances
**Monitoring**: Development tools

```bash
# Quick development setup
npm install
npm run dev
```

### Staging Environment

**Purpose**: Pre-production testing
**Infrastructure**: Cloud VM or container
**Database**: Managed database service
**Monitoring**: Full observability stack

### Production Environment

**Purpose**: Live production deployment
**Infrastructure**: High-availability cloud infrastructure
**Database**: Enterprise database with replication
**Monitoring**: Comprehensive monitoring and alerting

## Environment Configuration

### Environment Variables

Create environment-specific configuration files:

#### `.env.development`
```bash
# Development Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# API Configuration
SONATE_API_BASE_URL=http://localhost:3001
SONATE_API_KEY=dev-api-key

# Database
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/sonate_dev
REDIS_URL=redis://localhost:6379

# Feature Flags
ENABLE_EXPERIMENTS=true
ENABLE_ANALYTICS=false
ENABLE_DEBUG_LOGS=true

# Security
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key
CORS_ORIGIN=http://localhost:3000
```

#### `.env.staging`
```bash
# Staging Configuration
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0

# API Configuration
SONATE_API_BASE_URL=https://staging-api.sonate.ai
SONATE_API_KEY=${STAGING_API_KEY}

# Database
DATABASE_URL=${STAGING_DATABASE_URL}
REDIS_URL=${STAGING_REDIS_URL}

# Feature Flags
ENABLE_EXPERIMENTS=true
ENABLE_ANALYTICS=true
ENABLE_DEBUG_LOGS=true

# Security
JWT_SECRET=${STAGING_JWT_SECRET}
ENCRYPTION_KEY=${STAGING_ENCRYPTION_KEY}
CORS_ORIGIN=https://staging.sonate.ai
```

#### `.env.production`
```bash
# Production Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# API Configuration
SONATE_API_BASE_URL=https://api.sonate.ai
SONATE_API_KEY=${PRODUCTION_API_KEY}

# Database
DATABASE_URL=${PRODUCTION_DATABASE_URL}
REDIS_URL=${PRODUCTION_REDIS_URL}
DATABASE_POOL_SIZE=20
REDIS_POOL_SIZE=10

# Feature Flags
ENABLE_EXPERIMENTS=false
ENABLE_ANALYTICS=true
ENABLE_DEBUG_LOGS=false

# Security
JWT_SECRET=${PRODUCTION_JWT_SECRET}
ENCRYPTION_KEY=${PRODUCTION_ENCRYPTION_KEY}
CORS_ORIGIN=https://sonate.ai

# Performance
CLUSTER_MODE=true
CLUSTER_WORKERS=4
COMPRESSION=true
```

### Configuration Management

```typescript
// src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific configuration
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  app: {
    name: 'SONATE Platform',
    version: process.env.APP_VERSION || '2.0.0',
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development'
  },
  
  api: {
    baseUrl: process.env.SONATE_API_BASE_URL || 'http://localhost:3001',
    key: process.env.SONATE_API_KEY || '',
    timeout: parseInt(process.env.API_TIMEOUT || '30000')
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
    ssl: process.env.NODE_ENV === 'production'
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    poolSize: parseInt(process.env.REDIS_POOL_SIZE || '5')
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || '',
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  features: {
    experiments: process.env.ENABLE_EXPERIMENTS === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    debugLogs: process.env.ENABLE_DEBUG_LOGS === 'true'
  }
};
```

## Cloud Deployment

### AWS Deployment

#### Infrastructure Setup

```yaml
# infrastructure/aws/cloudformation.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'SONATE Platform Infrastructure'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]
  
  InstanceType:
    Type: String
    Default: t3.medium
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-sonate-vpc'

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true

  # Application Load Balancer
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${Environment}-sonate-alb'
      Scheme: internet-facing
      Type: application
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup

  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub '${Environment}-sonate-cluster'
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT

  # RDS Database
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${Environment}-sonate-db'
      DBInstanceClass: db.t3.medium
      Engine: postgres
      EngineVersion: '14.6'
      MasterUsername: sonate
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 100
      StorageType: gp2
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      DBSubnetGroupName: !Ref DatabaseSubnetGroup

  # ElastiCache Redis
  Redis:
    Type: AWS::ElastiCache::CacheCluster
    Properties:
      CacheNodeType: cache.t3.micro
      Engine: redis
      NumCacheNodes: 1
      VpcSecurityGroupIds:
        - !Ref RedisSecurityGroup

Outputs:
  LoadBalancerDNS:
    Description: 'Load Balancer DNS Name'
    Value: !GetAtt LoadBalancer.DNSName
    Export:
      Name: !Sub '${Environment}-LoadBalancerDNS'
```

#### ECS Task Definition

```json
{
  "family": "sonate-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "sonate-platform",
      "image": "ACCOUNT.dkr.ecr.REGION.amazonaws.com/sonate-platform:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:sonate/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:sonate/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sonate-platform",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3
      }
    }
  ]
}
```

### Google Cloud Platform Deployment

#### Terraform Configuration

```hcl
# infrastructure/gcp/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# VPC Configuration
resource "google_compute_network" "sonate_vpc" {
  name                    = "${var.environment}-sonate-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "sonate_subnet" {
  name          = "${var.environment}-sonate-subnet"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.sonate_vpc.id
}

# Cloud Run Service
resource "google_cloud_run_service" "sonate_platform" {
  name     = "${var.environment}-sonate-platform"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/sonate-platform:${var.image_tag}"
        
        ports {
          container_port = 3000
        }

        env {
          name  = "NODE_ENV"
          value = var.environment
        }

        env {
          name  = "DATABASE_URL"
          value = var.database_url
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "2Gi"
          }
        }
      }

      container_concurrency = 100
      timeout_seconds       = 30
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud SQL Database
resource "google_sql_database_instance" "sonate_db" {
  name             = "${var.environment}-sonate-db"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier = "db-n1-standard-2"
    
    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "cloud-run"
        value = "0.0.0.0/0"
      }
    }
  }
}

# Memorystore Redis
resource "google_redis_instance" "sonate_redis" {
  name           = "${var.environment}-sonate-redis"
  tier           = "STANDARD_HA"
  memory_size_gb = 2
  region         = var.region
  
  authorized_network = google_compute_network.sonate_vpc.id
}
```

### Azure Deployment

#### ARM Template

```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "environment": {
      "type": "string",
      "defaultValue": "production",
      "allowedValues": ["development", "staging", "production"]
    },
    "location": {
      "type": "string",
      "defaultValue": "[resourceGroup().location]"
    }
  },
  "resources": [
    {
      "type": "Microsoft.ContainerRegistry/registries",
      "apiVersion": "2021-06-01-preview",
      "name": "[concat(parameters('environment'), 'sonateacr')]",
      "location": "[parameters('location')]",
      "sku": {
        "name": "Standard"
      },
      "properties": {
        "adminUserEnabled": true
      }
    },
    {
      "type": "Microsoft.ContainerInstance/containerGroups",
      "apiVersion": "2021-03-01",
      "name": "[concat(parameters('environment'), '-sonate-platform')]",
      "location": "[parameters('location')]",
      "properties": {
        "containers": [
          {
            "name": "sonate-platform",
            "properties": {
              "image": "[concat(parameters('environment'), 'sonateacr.azurecr.io/sonate-platform:latest')]",
              "ports": [
                {
                  "port": 3000,
                  "protocol": "TCP"
                }
              ],
              "resources": {
                "requests": {
                  "cpu": 1.0,
                  "memoryInGb": 2.0
                }
              },
              "environmentVariables": [
                {
                  "name": "NODE_ENV",
                  "value": "[parameters('environment')]"
                }
              ]
            }
          }
        ],
        "osType": "Linux",
        "restartPolicy": "Always"
      }
    }
  ]
}
```

## Container Deployment

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/*/package*.json ./packages/*/
COPY apps/*/package*.json ./apps/*/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

USER nodejs

CMD ["node", "dist/main.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  sonate-platform:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-development}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB:-sonate}
      - POSTGRES_USER=${POSTGRES_USER:-sonate}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - sonate-platform
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sonate-platform
  labels:
    app: sonate-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sonate-platform
  template:
    metadata:
      labels:
        app: sonate-platform
    spec:
      containers:
      - name: sonate-platform
        image: sonate/platform:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: sonate-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sonate-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sonate-platform-service
spec:
  selector:
    app: sonate-platform
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sonate-platform-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - sonate.ai
    secretName: sonate-tls
  rules:
  - host: sonate.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sonate-platform-service
            port:
              number: 80
```

## On-Premise Deployment

### System Requirements

**Hardware Requirements:**
- CPU: 8+ cores (16+ recommended for production)
- Memory: 32GB+ RAM
- Storage: 500GB+ SSD
- Network: 1Gbps+ connection

**Software Requirements:**
- OS: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- Docker: 20.10+
- Docker Compose: 2.0+
- NGINX: 1.20+

### Installation Script

```bash
#!/bin/bash
# install.sh - On-premise installation script

set -e

# Configuration
INSTALL_DIR="/opt/sonate-platform"
SERVICE_USER="sonate"
BACKUP_DIR="/var/backups/sonate-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ ! -f /etc/os-release ]]; then
        error "Cannot determine operating system"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check available memory
    AVAILABLE_MEM=$(free -g | awk '/^Mem:/{print $7}')
    if [[ $AVAILABLE_MEM -lt 16 ]]; then
        warn "Available memory is less than 16GB, performance may be impacted"
    fi
    
    log "System requirements check completed"
}

# Create service user
create_service_user() {
    log "Creating service user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        sudo useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
        sudo mkdir -p $INSTALL_DIR
        sudo chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    fi
    
    log "Service user created"
}

# Install application
install_application() {
    log "Installing SONATE platform..."
    
    # Create installation directory
    sudo mkdir -p $INSTALL_DIR
    cd $INSTALL_DIR
    
    # Download application files (replace with actual download URL)
    sudo wget -O sonate-platform.tar.gz https://releases.sonate.ai/v2.0.0/sonate-platform.tar.gz
    sudo tar -xzf sonate-platform.tar.gz
    sudo rm sonate-platform.tar.gz
    
    # Set permissions
    sudo chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR
    sudo chmod +x $INSTALL_DIR/scripts/*.sh
    
    log "Application installed"
}

# Configure services
configure_services() {
    log "Configuring services..."
    
    # Create environment file
    sudo tee $INSTALL_DIR/.env > /dev/null <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=\${DATABASE_URL}
REDIS_URL=\${REDIS_URL}
JWT_SECRET=\${JWT_SECRET}
EOF
    
    # Create systemd service
    sudo tee /etc/systemd/system/sonate-platform.service > /dev/null <<EOF
[Unit]
Description=SONATE Platform
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/docker-compose up -d
ExecStop=/usr/bin/docker-compose down
TimeoutStartSec=0
User=$SERVICE_USER
Group=$SERVICE_USER

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable sonate-platform
    
    log "Services configured"
}

# Setup backup
setup_backup() {
    log "Setting up backup configuration..."
    
    sudo mkdir -p $BACKUP_DIR
    sudo chown $SERVICE_USER:$SERVICE_USER $BACKUP_DIR
    
    # Create backup script
    sudo tee $INSTALL_DIR/scripts/backup.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/sonate-platform"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sonate-backup-$DATE.tar.gz"

# Create backup
docker-compose exec -T postgres pg_dump -U sonate sonate > $BACKUP_DIR/database_$DATE.sql
tar -czf $BACKUP_FILE -C $BACKUP_DIR database_$DATE.sql

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "sonate-backup-*.tar.gz" -mtime +7 -delete
rm $BACKUP_DIR/database_$DATE.sql

echo "Backup completed: $BACKUP_FILE"
EOF
    
    sudo chmod +x $INSTALL_DIR/scripts/backup.sh
    sudo chown $SERVICE_USER:$SERVICE_USER $INSTALL_DIR/scripts/backup.sh
    
    # Add to crontab
    (sudo crontab -l 2>/dev/null; echo "0 2 * * * $INSTALL_DIR/scripts/backup.sh") | sudo crontab -
    
    log "Backup configured"
}

# Main installation
main() {
    log "Starting SONATE platform installation..."
    
    check_requirements
    create_service_user
    install_application
    configure_services
    setup_backup
    
    log "Installation completed successfully!"
    log "Start the service with: sudo systemctl start sonate-platform"
    log "Check status with: sudo systemctl status sonate-platform"
}

# Run installation
main "$@"
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy SONATE Platform

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
    
    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add staging deployment commands here
    
    - name: Run smoke tests
      run: |
        echo "Running smoke tests"
        # Add smoke test commands here

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add production deployment commands here
    
    - name: Run health checks
      run: |
        echo "Running health checks"
        # Add health check commands here
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: registry.gitlab.com
  IMAGE_NAME: $CI_PROJECT_PATH

test:
  stage: test
  image: node:20-alpine
  parallel:
    matrix:
      - NODE_VERSION: [18, 20]
  
  before_script:
    - npm ci
  
  script:
    - npm run lint
    - npm run test:coverage
  
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  only:
    - main
    - develop
  
  script:
    - docker build -t $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA .
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA
    - docker tag $DOCKER_REGISTRY/$IMAGE_NAME:$CI_COMMIT_SHA $DOCKER_REGISTRY/$IMAGE_NAME:latest
    - docker push $DOCKER_REGISTRY/$IMAGE_NAME:latest

deploy-staging:
  stage: deploy-staging
  image: alpine:latest
  only:
    - develop
  environment:
    name: staging
    url: https://staging.sonate.ai
  
  script:
    - echo "Deploying to staging"
    - apk add --no-cache curl
    - curl -X POST "$STAGING_DEPLOY_WEBHOOK" -H "Authorization: Bearer $STAGING_TOKEN"

deploy-production:
  stage: deploy-production
  image: alpine:latest
  only:
    - main
  when: manual
  environment:
    name: production
    url: https://sonate.ai
  
  script:
    - echo "Deploying to production"
    - apk add --no-cache curl
    - curl -X POST "$PRODUCTION_DEPLOY_WEBHOOK" -H "Authorization: Bearer $PRODUCTION_TOKEN"
```

## Monitoring and Logging

### Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'sonate-platform'
    static_configs:
      - targets: ['sonate-platform:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "SONATE Platform Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Phase-Shift Velocity",
        "type": "graph",
        "targets": [
          {
            "expr": "phase_shift_velocity",
            "legendFormat": "{{agent_id}}"
          }
        ]
      },
      {
        "title": "Constitutional Compliance",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(constitutional_compliance_score)",
            "legendFormat": "Average Score"
          }
        ]
      }
    ]
  }
}
```

### ELK Stack Configuration

```yaml
# logging/elasticsearch.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## Security Considerations

### Security Headers

```typescript
// src/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.sonate.ai"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
];
```

### Rate Limiting

```typescript
// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authLimiter = createRateLimit(15 * 60 * 1000, 5);  // 5 auth requests per 15 minutes
```

### SSL/TLS Configuration

```nginx
# nginx/nginx.conf
server {
    listen 80;
    server_name sonate.ai www.sonate.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sonate.ai www.sonate.ai;

    ssl_certificate /etc/nginx/ssl/sonate.ai.crt;
    ssl_certificate_key /etc/nginx/ssl/sonate.ai.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    location / {
        proxy_pass http://sonate-platform:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Scaling Strategies

### Horizontal Scaling

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: sonate-platform-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: sonate-platform
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling

```typescript
// src/config/database.ts
import { Pool } from 'pg';

export class DatabaseManager {
  private primaryPool: Pool;
  private readReplicaPools: Pool[];
  
  constructor(config: DatabaseConfig) {
    this.primaryPool = new Pool({
      connectionString: config.primaryUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
    
    this.readReplicaPools = config.readReplicaUrls?.map(url => 
      new Pool({
        connectionString: url,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      })
    ) || [];
  }
  
  async query(text: string, params?: any[]): Promise<any> {
    // Use read replica for SELECT queries
    if (text.trim().toLowerCase().startsWith('select') && this.readReplicaPools.length > 0) {
      const randomReplica = this.readReplicaPools[Math.floor(Math.random() * this.readReplicaPools.length)];
      return randomReplica.query(text, params);
    }
    
    // Use primary for all other queries
    return this.primaryPool.query(text, params);
  }
}
```

### Caching Strategy

```typescript
// src/cache/redisManager.ts
import Redis from 'ioredis';

export class RedisManager {
  private redis: Redis;
  private localCache: Map<string, any> = new Map();
  
  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3
    });
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Check local cache first
    if (this.localCache.has(key)) {
      return this.localCache.get(key);
    }
    
    // Check Redis
    const value = await this.redis.get(key);
    if (value) {
      const parsed = JSON.parse(value);
      this.localCache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    
    // Set in both Redis and local cache
    await this.redis.setex(key, ttl, serialized);
    this.localCache.set(key, value);
    
    // Remove from local cache after TTL
    setTimeout(() => {
      this.localCache.delete(key);
    }, ttl * 1000);
  }
}
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
docker logs sonate-platform

# Check environment variables
docker exec sonate-platform env

# Check port availability
netstat -tlnp | grep :3000
```

#### Database Connection Issues

```bash
# Test database connectivity
docker exec sonate-platform npm run test:db

# Check database logs
docker logs postgres

# Test connection manually
psql $DATABASE_URL -c "SELECT 1;"
```

#### Performance Issues

```bash
# Check resource usage
docker stats sonate-platform

# Monitor database queries
docker exec postgres psql -U sonate -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Check Redis performance
redis-cli info stats
```

### Health Checks

```typescript
// src/health/healthCheck.ts
export class HealthCheck {
  async checkDatabase(): Promise<boolean> {
    try {
      await this.database.query('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async checkExternalAPIs(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.SONATE_API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
  
  async getHealthStatus(): Promise<HealthStatus> {
    const [database, redis, externalAPIs] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs()
    ]);
    
    return {
      status: database && redis && externalAPIs ? 'healthy' : 'unhealthy',
      checks: { database, redis, externalAPIs },
      timestamp: new Date().toISOString()
    };
  }
}
```

### Debug Mode

```typescript
// src/utils/debug.ts
export class DebugLogger {
  private isDebugMode: boolean;
  
  constructor() {
    this.isDebugMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG === 'true';
  }
  
  log(message: string, data?: any): void {
    if (this.isDebugMode) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  }
  
  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || '');
  }
  
  performance<T>(operation: string, fn: () => T): T {
    if (this.isDebugMode) {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;
      this.log(`Performance: ${operation} took ${duration.toFixed(2)}ms`);
      return result;
    }
    return fn();
  }
}
```

---

This deployment guide provides comprehensive coverage of deployment strategies for the SONATE platform. Choose the approach that best fits your infrastructure requirements and organizational constraints.