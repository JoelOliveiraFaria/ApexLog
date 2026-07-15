# ApexLog

ApexLog turns a motorcycle's OBD-II port into a trip logger. Pair a Bluetooth ELM327 adapter with the mobile app, ride, and ApexLog records RPM, speed, throttle position, and engine temperature for the whole trip — then hand it off to a web dashboard for review.

## How it works

1. **Pair** — the mobile app connects to an ELM327 BLE adapter plugged into the motorcycle's OBD-II port.
2. **Ride** — while recording, it polls the bike's PIDs (RPM, speed, throttle, coolant temp) roughly every 150ms and buffers the samples. An Android foreground service keeps polling alive even with the screen locked, and batches are streamed to the API every few seconds so a dropped connection doesn't lose the whole ride.
3. **Finish** — ending the trip closes it out on the backend, which aggregates max speed, average speed, and max RPM from the recorded points.
4. **Review** — the web dashboard lists trips per motorcycle and renders the recorded telemetry as charts (speed, RPM, throttle, temperature over time) alongside the trip's summary stats.

Users can also manage multiple motorcycles (make, model, year, nickname) and everything is scoped per-account behind JWT-authenticated login/registration.

## Architecture

- **API** (`ApexLog/`) — ASP.NET Core Web API following Clean Architecture:
  - `ApexLog.Domain` — entities (`User`, `Motorcycle`, `Trip`, `TelemetryPoint`)
  - `ApexLog.Application` — services, DTOs, interfaces
  - `ApexLog.Infrastructure` — EF Core `DbContext`, repositories, migrations (PostgreSQL)
  - `ApexLog.API` — controllers (`Auth`, `Motorcycles`, `Trips`), JWT authentication, Swagger
- **Mobile** (`mobile/`) — Expo / React Native app that pairs with an ELM327 BLE adapter, parses OBD PIDs, and logs trip telemetry
- **Web** (`web/`) — React + Vite + Tailwind dashboard for authentication, motorcycle management, and trip/telemetry visualization (Recharts)
- **Database** — PostgreSQL, run via Docker Compose

## Prerequisites

- [.NET SDK](https://dotnet.microsoft.com/download) (8.0+)
- [Node.js](https://nodejs.org/) (18+) and npm
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Expo Go](https://expo.dev/go) app or an Android/iOS emulator, for the mobile app
- A physical ELM327 Bluetooth OBD-II adapter, to log real telemetry from a motorcycle

## Getting started

### 1. Database

Create a `.env` file in the repo root (see `docker-compose.yml` for the required variables):

```env
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=apexlog_telemetry
```

Then start PostgreSQL:

```bash
docker compose up -d
```

### 2. API

```bash
cd ApexLog
dotnet user-secrets set "Jwt:SigningKey" "<a-long-random-secret>" --project ApexLog.API
dotnet user-secrets set "ConnectionStrings:PostgresConnection" "Host=localhost;Port=5432;Database=apexlog_telemetry;Username=your_user;Password=your_password" --project ApexLog.API
dotnet ef database update --project ApexLog.Infrastructure --startup-project ApexLog.API
dotnet run --project ApexLog.API
```

The API exposes Swagger UI at `/swagger` in development.

### 3. Web dashboard

```bash
cd web
npm install
npm run dev
```

### 4. Mobile app

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go, or run `npm run android` / `npm run ios` for an emulator/device build. Bluetooth features require a physical device.

## Tech stack

| Layer    | Stack |
|----------|-------|
| Backend  | ASP.NET Core, Entity Framework Core, PostgreSQL, JWT auth |
| Web      | React, Vite, TypeScript, Tailwind CSS, Recharts |
| Mobile   | Expo, React Native, react-native-ble-plx, react-native-background-actions |
