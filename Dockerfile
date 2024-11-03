# Use an official Node.js runtime as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

ENV NEXT_PUBLIC_CLIENT_ID="519888108539-i8g9fa2e12d2t6s0cgov7f16mi45efjp.apps.googleusercontent.com"
ENV NEXT_PUBLIC_ENCRYPTION_KEY="6'l&v%XcM)('C^Q"

# Build the Next.js application for production
RUN npm run build

# Stage 2: Use a lightweight Node.js image for the final build
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Set environment variables from .env file
ENV NEXT_PUBLIC_CLIENT_ID="519888108539-i8g9fa2e12d2t6s0cgov7f16mi45efjp.apps.googleusercontent.com"
ENV NEXT_PUBLIC_ENCRYPTION_KEY="6'l&v%XcM)('C^Q"

# Expose the port that Next.js will run on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "run", "start"]