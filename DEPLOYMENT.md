# Deploying the Conference Management System to Render

This guide provides step-by-step instructions for deploying the Conference Management System to Render's free tier.

## Prerequisites

- A [Render](https://render.com) account
- Your GitHub repository at https://github.com/Aryaman129/GDG

## Deployment Steps

### 1. Prepare Your Repository

Your repository is already configured with the necessary files for deployment:
- `render.yaml` - Blueprint configuration for Render
- Updated server code to initialize the database with seed data
- Demo user accounts for testing

### 2. Deploy Using the Blueprint

1. Log in to your Render account at https://render.com
2. Click on the "New" button in the top right corner
3. Select "Blueprint" from the dropdown menu
4. Connect your GitHub repository if you haven't already
5. Select the repository "Aryaman129/GDG"
6. Render will automatically detect the `render.yaml` file and set up your services
7. Review the configuration and click "Apply"

### 3. Monitor the Deployment

- The deployment process will take a few minutes
- You can monitor the progress in the Render dashboard
- Once complete, you'll see two services:
  - `conference-management-backend`
  - `conference-management-frontend`

### 4. Test Your Deployment

1. Access the frontend at: https://conference-management-frontend.onrender.com
2. The first request may take 30-60 seconds as the service wakes up
3. Log in using one of the demo accounts:
   - Regular User: user@example.com / password123
   - Speaker: speaker@example.com / password123

## Understanding the Demo Environment

The deployed application has the following characteristics:

### Database Behavior

- **SQLite Database**: The application uses SQLite, which is stored in the service's filesystem
- **Automatic Seeding**: The database is automatically seeded with demo data on first startup
- **Data Persistence**:
  - New data created during your session will persist as long as the service doesn't go to sleep (after 15 minutes of inactivity)
  - Data may be reset during deployments or maintenance
  - If you return to the demo after some time, your previously created data may still be available, but it's not guaranteed

### Service Behavior

- **Sleep Mode**: The service goes to sleep after 15 minutes of inactivity
- **Cold Start**: The first request after inactivity may take 30-60 seconds to respond
- **Automatic Deployment**: Any changes pushed to the main branch will trigger a new deployment

## Troubleshooting

If you encounter issues during deployment:

1. **Check the build logs** in the Render dashboard for error messages
2. **Verify environment variables** are correctly set
3. **Ensure the database is properly initialized** by checking the logs for seed script execution
4. **Check for port conflicts** if the services fail to start

## Important Notes for Demo Purposes

- This deployment is intended for demonstration purposes only
- For a production environment, consider:
  - Using a persistent database solution like PostgreSQL
  - Upgrading to a paid tier that doesn't sleep
  - Implementing proper backup strategies

## Updating the Deployment

To update your deployment after making changes:

1. Push your changes to the GitHub repository
2. Render will automatically detect the changes and trigger a new deployment
3. Monitor the deployment progress in the Render dashboard
