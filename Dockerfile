FROM node:20-alpine

WORKDIR /app

# Install dependencies (runs on Linux FS — no Windows NTFS issues)
COPY package.json package-lock.json* ./
RUN npm install
 
# Copy source and build the web export
COPY . .

ENV EXPO_OFFLINE=1
RUN npx expo export --platform web --output-dir dist

EXPOSE 8081

CMD ["node", "serve.js"]
