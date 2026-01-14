# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopieer package files
COPY package*.json ./

# Installeer dependencies (inclusief devDependencies voor de build)
RUN npm install

# Kopieer broncode
COPY . .

# Bouw de NestJS app (maakt de /dist map aan)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Kopieer package files
COPY package*.json ./

# Installeer alleen productie dependencies (kleinere image)
RUN npm install --only=production

# Kopieer de gebouwde app vanuit de builder
COPY --from=builder /app/dist ./dist

# Stel de poort in (NestJS luistert vaak naar process.env.PORT)
ENV PORT=5000
EXPOSE 5000

# Start commando (voor NestJS productie)
CMD ["node", "dist/main"]