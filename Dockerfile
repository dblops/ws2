FROM node:18-slim

# Instala Chromium y dependencias requeridas por Puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 \
  libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# 🛑 Evita que Puppeteer descargue su propia versión de Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./

# 👇 Instala solo las dependencias necesarias
RUN npm ci --omit=dev

COPY . .

CMD ["node", "index.js"]
