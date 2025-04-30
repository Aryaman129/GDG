FROM node:18-alpine

WORKDIR /app

# Copy package.json files for both backend and frontend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN cd backend && npx prisma generate

# Build the frontend
RUN cd frontend && npm run build

# Expose ports
EXPOSE 3000 8000

# Start both services in production mode
CMD ["sh", "-c", "cd backend && npm run start & cd frontend && npm run start"]
