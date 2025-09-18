FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]