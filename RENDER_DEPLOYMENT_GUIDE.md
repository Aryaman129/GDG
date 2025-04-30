# Quick Deployment Guide for Render

This is a simplified guide for deploying your Conference Management System to Render.

## 1. Push Your Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push
```

## 2. Deploy to Render

1. **Log in to Render**: Go to https://render.com and sign in to your account

2. **Create a New Blueprint**:
   - Click "New" in the top right corner
   - Select "Blueprint" from the dropdown menu
   - Connect your GitHub repository if you haven't already
   - Select the repository "Aryaman129/GDG"

3. **Apply the Blueprint**:
   - Render will detect the `render.yaml` file and show you the services it will create
   - Review the configuration and click "Apply"

4. **Wait for Deployment**:
   - The deployment process will take a few minutes
   - You can monitor the progress in the Render dashboard

## 3. Test Your Deployment

Once deployment is complete:

1. **Access the Frontend**:
   - Go to https://conference-management-frontend.onrender.com
   - The first request may take 30-60 seconds as the service wakes up

2. **Log in with Demo Accounts**:
   - Regular User: user@example.com / password123
   - Speaker: speaker@example.com / password123

## 4. Important Notes

- **Sleep Mode**: The service goes to sleep after 15 minutes of inactivity
- **Cold Start**: The first request after inactivity may take 30-60 seconds to respond
- **Data Persistence**: Data is stored in a SQLite database that persists between service restarts, but may be reset during deployments or maintenance

## 5. Troubleshooting

If you encounter issues:

1. **Check Build Logs**: In the Render dashboard, check the build logs for error messages
2. **Verify Database Initialization**: Check the logs for seed script execution
3. **Restart Services**: If needed, you can manually restart the services from the Render dashboard

For more detailed information, see the full [DEPLOYMENT.md](./DEPLOYMENT.md) file.
