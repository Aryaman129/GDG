#!/bin/bash

# Script to deploy the Conference Management System to Render

echo "Preparing to deploy Conference Management System to Render..."

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git and try again."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Not in a git repository. Please run this script from within the git repository."
    exit 1
fi

# Make sure we have the latest changes
echo "Pulling latest changes from repository..."
git pull

# Push changes to GitHub
echo "Pushing changes to GitHub..."
git push

echo "Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Log in to your Render account at https://render.com"
echo "2. If this is your first deployment, use the Blueprint option and select your repository"
echo "3. If you've already deployed, your changes will be automatically deployed"
echo ""
echo "Your application will be available at:"
echo "- Frontend: https://conference-management-frontend.onrender.com"
echo "- Backend: https://conference-management-backend.onrender.com"
echo ""
echo "Remember: This is a demo environment on Render's free tier."
echo "- The service will go to sleep after 15 minutes of inactivity"
echo "- The first request after sleep may take 30-60 seconds to respond"
echo "- Data persistence is not guaranteed between deployments"
echo ""
echo "For more information, see the DEPLOYMENT.md file."
