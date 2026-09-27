FROM node:20-alpine AS runner

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependency definition
COPY package.json ./

# Install all dependencies including build tools
RUN npm install --include=dev

# Copy application source
COPY . .

# Build application
RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npm", "start"]
