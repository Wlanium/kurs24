FROM python:3.11-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    sqlite

# Copy requirements first for better Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY run.py .

# Create data directory
RUN mkdir -p /app/data

# Initialize database
RUN python -c "from app import create_app, init_db; app = create_app(); init_db(app)"

EXPOSE 5000

CMD ["python", "run.py"]