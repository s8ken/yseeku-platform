# Log Directory

This directory contains application logs. Log files are automatically ignored by git.

## Log Files
- `error.log` - Error level logs only
- `combined.log` - All log levels

## Log Rotation
Logs are automatically rotated when they reach 5MB, keeping the last 5 files.

## Production Logging
In production environments, logs are output to stdout/stderr in JSON format for container log aggregation (e.g., CloudWatch, Datadog, etc.).

## Development Logging
In development, logs are colorized and output to both console and files for easier debugging.
