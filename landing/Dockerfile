FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application including env files
COPY . .
# Ensure .env.local is available for build
COPY .env.local .env.local

# Build the app
RUN npm run build

# Copy necessary files for standalone mode
RUN cp -r public .next/standalone/public 2>/dev/null || true
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true

# Set environment to production
ENV NODE_ENV production

EXPOSE 3000

CMD ["node", ".next/standalone/server.js"]