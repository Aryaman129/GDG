#!/bin/bash

# Test API endpoints
echo "Testing API endpoints..."

# Base URL
API_URL="http://localhost:8000/api"

# Test server health
echo -e "\n1. Testing server health..."
curl -s $API_URL

# Test auth endpoints
echo -e "\n\n2. Testing auth endpoints..."
echo -e "\n2.1 Signup endpoint:"
curl -s -X POST $API_URL/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User","phone":"+1234567890"}'

echo -e "\n\n2.2 Verify OTP endpoint:"
curl -s -X POST $API_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

echo -e "\n\n2.3 Login endpoint:"
curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Test speakers endpoints
echo -e "\n\n3. Testing speakers endpoints..."
echo -e "\n3.1 List speakers:"
curl -s $API_URL/speakers

# Test bookings endpoints
echo -e "\n\n4. Testing bookings endpoints..."
echo -e "\n4.1 List bookings (requires auth):"
curl -s $API_URL/bookings/my \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test admin endpoints
echo -e "\n\n5. Testing admin endpoints..."
echo -e "\n5.1 Admin stats (requires admin auth):"
curl -s $API_URL/admin/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"

echo -e "\n\nAPI testing completed."
