# Deployment Guide

## Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy the frontend:
```bash
cd frontend
vercel
```

4. Configure environment variables in Vercel dashboard:
- `REACT_APP_API_URL`: Your Railway backend URL
- `REACT_APP_WS_URL`: Your Railway WebSocket URL

## Backend Deployment (Railway)

1. Install Railway CLI:
```bash
npm i -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Create a new project:
```bash
railway init
```

4. Link your repository:
```bash
railway link
```

5. Deploy the backend:
```bash
cd backend
railway up
```

6. Configure environment variables in Railway dashboard:
- `MONGODB_URI`: MongoDB connection string (Railway will provide this)
- `JWT_SECRET`: Your JWT secret key
- `MQTT_BROKER_URL`: Your MQTT broker URL
- `NODE_ENV`: "production"
- `CORS_ORIGIN`: Your Vercel frontend URL

## MongoDB Setup

1. Railway will automatically provision a MongoDB instance
2. Get the connection string from Railway dashboard
3. Add it to your backend environment variables

## MQTT Setup

1. Create a managed MQTT broker (recommended options):
   - HiveMQ Cloud (free tier available)
   - CloudMQTT
   - EMQ X Cloud

2. Configure MQTT environment variables:
   - `MQTT_BROKER_URL`
   - `MQTT_USERNAME`
   - `MQTT_PASSWORD`

## Post-Deployment Steps

1. Update frontend environment variables with actual backend URL
2. Test the health endpoint: `https://your-backend-url/health`
3. Test WebSocket connection
4. Test MQTT connection
5. Monitor application logs in Railway dashboard

## Monitoring

1. Set up monitoring in Railway dashboard:
   - CPU usage
   - Memory usage
   - Request latency
   - Error rates

2. Set up Vercel Analytics:
   - Page load times
   - User metrics
   - Error tracking

## Troubleshooting

### Frontend Issues
1. Check browser console for errors
2. Verify environment variables in Vercel dashboard
3. Check Vercel deployment logs
4. Verify API endpoints in Network tab

### Backend Issues
1. Check Railway logs
2. Verify MongoDB connection
3. Check MQTT broker status
4. Test health endpoint

### Common Problems
1. CORS errors: Verify CORS_ORIGIN in backend
2. WebSocket connection fails: Check WS_URL
3. Database connection issues: Verify MONGODB_URI
4. MQTT connection fails: Check broker credentials
