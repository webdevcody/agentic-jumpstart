# Use Node.js 22 LTS as the base image (Debian-based to avoid Alpine/musl native dependency issues)
FROM node:22

# Set working directory
WORKDIR /app

# Install ffmpeg for audio/video processing and ImageMagick for thumbnail optimization
RUN apt-get update && apt-get install -y \
    ffmpeg \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

ARG VITE_RECAPTCHA_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_HOST_NAME

# Build the application
RUN npm run build

# Expose the port your app runs on (adjust if needed)
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
