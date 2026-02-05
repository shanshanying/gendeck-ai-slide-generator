# GenDeck Frontend
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install simple static file server
RUN npm install -g serve

# Create entrypoint script for runtime config
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
# Create runtime config from env vars
cat > /app/dist/config.json << CONFIG
{
  "VITE_API_URL": "${VITE_API_URL:-http://localhost:3001/api}"
}
CONFIG

# Start server
exec serve -s dist -l 3000
EOF
RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]
