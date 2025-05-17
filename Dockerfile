FROM node:18-slim

# Instala Chromium y librerías necesarias para wppconnect/puppeteer
RUN apt-get update && apt-get install -y \
  chromium \
  libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libgbm1 libasound2 \
  libpangocairo-1.0-0 libxss1 libgtk-3-0 libxshmfence1 libglu1 \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Evita que Puppeteer descargue su propio Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Exponer puerto para Railway
EXPOSE 3000

# Comando de inicio
CMD ["node", "index.js"]
