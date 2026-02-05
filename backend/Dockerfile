FROM python:3.11-slim-bookworm

# Install system dependencies for PostgreSQL and GIS
RUN apt-get update && apt-get install -y \
    libpq-dev gcc python3-dev binutils libproj-dev gdal-bin \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000