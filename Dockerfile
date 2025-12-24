# Use Node.js 22 as the base image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install ffmpeg for audio/video processing and ImageMagick for thumbnail optimization
RUN apk add --no-cache ffmpeg imagemagick

# Copy package files
COPY package*.json ./

# Install dependencies
# Remove package-lock.json to work around npm bug with optional deps across platforms
# (https://github.com/npm/cli/issues/4828) - this ensures correct platform binaries are resolved
RUN rm -f package-lock.json && npm install

# Copy the rest of the application code
COPY . .

ARG VITE_RECAPTCHA_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_HOST_NAME

# Increase Node.js memory limit for build process
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application
RUN npm run build

# Expose the port your app runs on (adjust if needed)
EXPOSE 4000

# Start the application
CMD ["npm", "start"]
