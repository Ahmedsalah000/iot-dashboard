# IoT Dashboard Cloud Deployment Guide

## AWS Deployment

### Architecture Overview
```
                                     ┌─────────────┐
                                     │   Route53   │
                                     └──────┬──────┘
                                            │
                                     ┌──────┴──────┐
                                     │ CloudFront  │
                                     └──────┬──────┘
                                            │
                ┌───────────────────────────┴───────────────────────┐
                │                                                   │
         ┌──────┴──────┐                                    ┌──────┴──────┐
         │     S3      │                                    │    ALB      │
         │  (Frontend) │                                    │  (Backend)  │
         └─────────────┘                                    └──────┬──────┘
                                                                  │
                                                    ┌─────────────┴─────────────┐
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │   ECS/EKS   │             │     IoT     │
                                             │  (Backend)  │             │    Core     │
                                             └──────┬──────┘             └──────┬──────┘
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │  DocumentDB │             │     IoT     │
                                             │ (MongoDB)   │             │   Registry  │
                                             └─────────────┘             └─────────────┘
```

### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed
- Terraform (optional, for IaC)

### 1. Frontend Deployment (S3 + CloudFront)

#### Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://iot-dashboard-frontend

# Configure for static website hosting
aws s3 website s3://iot-dashboard-frontend \
    --index-document index.html \
    --error-document index.html

# Build and deploy frontend
npm run build
aws s3 sync build/ s3://iot-dashboard-frontend
```

#### CloudFront Configuration
```json
{
    "Distribution": {
        "Origins": [{
            "DomainName": "iot-dashboard-frontend.s3.amazonaws.com",
            "S3OriginConfig": {
                "OriginAccessIdentity": "origin-access-identity/cloudfront/XXXX"
            }
        }],
        "DefaultCacheBehavior": {
            "ViewerProtocolPolicy": "redirect-to-https",
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000
        },
        "CustomErrorResponses": [{
            "ErrorCode": 404,
            "ResponsePagePath": "/index.html",
            "ResponseCode": 200,
            "ErrorCachingMinTTL": 300
        }]
    }
}
```

### 2. Backend Deployment (ECS)

#### Create ECR Repository
```bash
# Create repository
aws ecr create-repository --repository-name iot-dashboard-backend

# Build and push Docker image
docker build -t iot-dashboard-backend .
docker tag iot-dashboard-backend:latest $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iot-dashboard-backend:latest
docker push $AWS_ACCOUNT.dkr.ecr.$REGION.amazonaws.com/iot-dashboard-backend:latest
```

#### ECS Task Definition
```json
{
    "family": "iot-dashboard-backend",
    "containerDefinitions": [{
        "name": "backend",
        "image": "${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/iot-dashboard-backend:latest",
        "memory": 512,
        "cpu": 256,
        "portMappings": [{
            "containerPort": 3001,
            "protocol": "tcp"
        }],
        "environment": [{
            "name": "MONGODB_URI",
            "value": "mongodb://documentdb-cluster:27017/iot-dashboard"
        }],
        "logConfiguration": {
            "logDriver": "awslogs",
            "options": {
                "awslogs-group": "/ecs/iot-dashboard-backend",
                "awslogs-region": "${REGION}",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }]
}
```

### 3. Database Deployment (DocumentDB)

#### Create DocumentDB Cluster
```bash
aws docdb create-db-cluster \
    --db-cluster-identifier iot-dashboard-cluster \
    --engine docdb \
    --master-username admin \
    --master-user-password <password> \
    --vpc-security-group-ids <security-group-id> \
    --db-subnet-group-name <subnet-group>
```

#### Configure Backup
```json
{
    "BackupRetentionPeriod": 7,
    "PreferredBackupWindow": "00:00-02:00",
    "PreferredMaintenanceWindow": "sun:02:00-sun:06:00"
}
```

### 4. IoT Core Setup

#### Create IoT Thing
```bash
# Create thing type
aws iot create-thing-type \
    --thing-type-name "IoTSensor" \
    --thing-type-properties \
    "thingTypeDescription=IoT Dashboard Sensor"

# Create thing
aws iot create-thing \
    --thing-name "sensor1" \
    --thing-type-name "IoTSensor"
```

#### Create IoT Policy
```json
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "iot:Connect",
            "iot:Publish",
            "iot:Subscribe",
            "iot:Receive"
        ],
        "Resource": [
            "arn:aws:iot:${REGION}:${ACCOUNT}:topic/sensor/*",
            "arn:aws:iot:${REGION}:${ACCOUNT}:client/${CLIENT_ID}"
        ]
    }]
}
```

## Azure Deployment

### Architecture Overview
```
                                     ┌─────────────┐
                                     │    Azure    │
                                     │ Front Door  │
                                     └──────┬──────┘
                                            │
                ┌───────────────────────────┴───────────────────────┐
                │                                                   │
         ┌──────┴──────┐                                    ┌──────┴──────┐
         │    Blob     │                                    │Application  │
         │   Storage   │                                    │  Gateway    │
         └─────────────┘                                    └──────┬──────┘
                                                                  │
                                                    ┌─────────────┴─────────────┐
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │     AKS     │             │    IoT      │
                                             │  (Backend)  │             │    Hub      │
                                             └──────┬──────┘             └──────┬──────┘
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │   Cosmos DB │             │Device Twin  │
                                             │ (MongoDB)   │             │  Registry   │
                                             └─────────────┘             └─────────────┘
```

### 1. Frontend Deployment (Static Web Apps)

```bash
# Create Static Web App
az staticwebapp create \
    --name iot-dashboard \
    --resource-group iot-dashboard-rg \
    --source https://github.com/username/iot-dashboard \
    --location "eastus2" \
    --branch main \
    --app-location "/frontend" \
    --output-location "build"
```

### 2. Backend Deployment (AKS)

```bash
# Create AKS cluster
az aks create \
    --resource-group iot-dashboard-rg \
    --name iot-dashboard-aks \
    --node-count 2 \
    --enable-addons monitoring \
    --generate-ssh-keys

# Deploy to AKS
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

### 3. Database (Cosmos DB)

```bash
# Create Cosmos DB account
az cosmosdb create \
    --name iot-dashboard-db \
    --resource-group iot-dashboard-rg \
    --kind MongoDB \
    --capabilities EnableAggregationPipeline \
    --default-consistency-level Session
```

## Google Cloud Deployment

### Architecture Overview
```
                                     ┌─────────────┐
                                     │   Cloud     │
                                     │    CDN      │
                                     └──────┬──────┘
                                            │
                ┌───────────────────────────┴───────────────────────┐
                │                                                   │
         ┌──────┴──────┐                                    ┌──────┴──────┐
         │   Cloud     │                                    │    Cloud    │
         │   Storage   │                                    │    Run      │
         └─────────────┘                                    └──────┬──────┘
                                                                  │
                                                    ┌─────────────┴─────────────┐
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │    GKE      │             │    IoT      │
                                             │  (Backend)  │             │    Core     │
                                             └──────┬──────┘             └──────┬──────┘
                                                    │                           │
                                             ┌──────┴──────┐             ┌──────┴──────┐
                                             │   MongoDB   │             │   Device    │
                                             │    Atlas    │             │  Registry   │
                                             └─────────────┘             └─────────────┘
```

### 1. Frontend Deployment (Cloud Storage + CDN)

```bash
# Create bucket
gsutil mb gs://iot-dashboard-frontend

# Configure for web hosting
gsutil web set -m index.html -e index.html gs://iot-dashboard-frontend

# Upload files
gsutil -m cp -r build/* gs://iot-dashboard-frontend/
```

### 2. Backend Deployment (Cloud Run)

```bash
# Build and push container
gcloud builds submit --tag gcr.io/$PROJECT_ID/iot-dashboard-backend

# Deploy to Cloud Run
gcloud run deploy iot-dashboard-backend \
    --image gcr.io/$PROJECT_ID/iot-dashboard-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## Continuous Deployment

### GitHub Actions Workflow

```yaml
name: Deploy IoT Dashboard

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Build
        run: cd frontend && npm run build
      - name: Deploy to S3
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl public-read --follow-symlinks --delete
        env:
          AWS_S3_BUCKET: iot-dashboard-frontend
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          SOURCE_DIR: frontend/build

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      - name: Build and push
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: iot-dashboard-backend
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG backend/
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster iot-dashboard --service backend --force-new-deployment
```

## Monitoring and Scaling

### AWS CloudWatch Dashboard

```json
{
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/ECS", "CPUUtilization", "ServiceName", "backend"],
                    [".", "MemoryUtilization", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1",
                "title": "ECS Metrics"
            }
        },
        {
            "type": "metric",
            "properties": {
                "metrics": [
                    ["AWS/IoT", "PublishIn.Count", "Protocol", "MQTT"],
                    [".", "SubscribeIn.Count", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "us-east-1",
                "title": "IoT Metrics"
            }
        }
    ]
}
```

### Auto Scaling Configuration

```json
{
    "TargetTrackingScalingPolicyConfiguration": {
        "TargetValue": 75.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        },
        "ScaleOutCooldown": 300,
        "ScaleInCooldown": 300
    }
}
```

## Cost Optimization

### AWS Cost Explorer Tags

```json
{
    "Tags": [
        {
            "Key": "Environment",
            "Value": "Production"
        },
        {
            "Key": "Project",
            "Value": "IoTDashboard"
        },
        {
            "Key": "Component",
            "Value": "Backend"
        }
    ]
}
```

### Resource Cleanup Script

```bash
#!/bin/bash

# Delete old ECR images
aws ecr list-images --repository-name iot-dashboard-backend \
    --query 'imageIds[?imagePushedAt<`2024-11-18`].[imageDigest]' \
    --output text | \
    xargs -I {} aws ecr batch-delete-image \
    --repository-name iot-dashboard-backend \
    --image-ids imageDigest={}

# Delete old CloudWatch logs
aws logs delete-log-group \
    --log-group-name /aws/ecs/iot-dashboard-backend

# Delete old backups
aws docdb delete-db-cluster-snapshot \
    --db-cluster-snapshot-identifier manual-snapshot-$(date -d '30 days ago' +%Y%m%d)
```
