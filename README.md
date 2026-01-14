# Keuzekompas API

De backend REST API voor het Keuzekompas, gebouwd met NestJS. Deze service beheert gebruikers, data-opslag en algemene logica.

## Vereisten

*   **Node.js** (Versie 18+)
*   **npm** (meegeleverd met Node.js)
*   **Docker & Docker Compose** (voor Redis)
*   **MongoDB** (Lokaal of cloud connection string)

## Installatie

1.  **Clone de repository**
    ```bash
    git clone <REPOSITORY_URL>
    cd API
    ```

2.  **Installeer afhankelijkheden**
    ```bash
    npm install
    ```

## Configuratie

Maak een bestand genaamd `.env` in de hoofdmap en voeg de volgende configuratie toe:

```env
# Database
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority

# Port
PORT=3000

# Security
JWT_SECRET=verander_dit_naar_een_veilig_geheim

# Redis (Cache)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (SMTP)
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=jouw_email_user
MAIL_PASS=jouw_email_password
MAIL_FROM="KeuzeKompas <noreply@keuzekompas.nl>"
```

## Opstarten

1.  **Start infrastructurele services (Redis)**
    ```bash
    docker-compose up -d
    ```

2.  **Start de applicatie (Development)**
    ```bash
    npm run start:dev
    ```

De API is nu beschikbaar op: `http://localhost:3000` (standaardpoort).

## Testen

Voer de unit tests uit om de installatie te verifiëren:

```bash
npm run test
```