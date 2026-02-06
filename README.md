## Overview
This project is a Plot Management System that allows users to:
1. Draw agricultural plots (polygons) on a Mapbox satellite map.
2. Automatically calculate the surface area in Hectares/m².
3. Save plot details (Name, Culture Type, Description) to a PostgreSQL database.
4. Retrieve and visualize saved plots with color-coding based on culture type.

## Tech Stack
* **Frontend:** React, Mapbox GL JS, Mapbox Draw, Turf.js
* **Backend:** Django REST Framework, Python 3.11
* **Database:** PostgreSQL with PostGIS (via Docker)
* **Infrastructure:** Docker Compose

## Prerequisites
* Docker & Docker Compose installed.
* (Optional) Node.js if running frontend locally outside Docker.

## How to Run

1. **Clone/Unzip the repository:**
   ```bash
   cd sowit-hometest
Build and Start with Docker:
This command sets up the Postgres DB, runs Django migrations, and starts the Backend and Frontend.

Bash
docker-compose up --build
Access the App:

Frontend: http://localhost:3000

Backend API: http://localhost:8000/api/plots/

## Features Implemented

✅ Draw & Calculate: Uses Mapbox Draw and Turf.js to calculate area immediately upon closing a polygon.

✅ Auto-Form: The drawing action automatically triggers a modal form to enter details.

✅ Save to DB: Persists Geometry (GeoJSON), Area, Name, and Culture Type to Postgres.

✅ Visualization: Saved plots are rendered on the map with specific colors (Yellow for Wheat, Green for Olives, etc.).

✅ Interactive Map: Clicking a saved plot shows a popup with detailed info; clicking a sidebar item flies the camera to the plot.
<img width="1576" height="708" alt="image" src="https://github.com/user-attachments/assets/4a6b3da3-3fae-47d0-836f-e0f749666c25" />
<img width="1515" height="518" alt="image" src="https://github.com/user-attachments/assets/e61912c1-1579-4232-9f61-b7177ae26780" />



