# Use Node.js 20 LTS as the base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install ffmpeg for audio/video processing and ImageMagick for thumbnail optimization
RUN apk add --no-cache ffmpeg imagemagick

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm i

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
