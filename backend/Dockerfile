FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip
COPY pyproject.toml ./
COPY app ./app
COPY seeds ./seeds
COPY alembic ./alembic
COPY alembic.ini ./
RUN pip install --no-cache-dir -e .

EXPOSE 8000
