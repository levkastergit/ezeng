#!/bin/bash
# Deploys the EzEng API as a standalone Docker container. Run on the server as root:
#   bash /opt/ezeng/app/deploy.sh
# Touches only /opt/ezeng, the "ezeng-api" container and one ufw rule (8443/tcp).
set -euo pipefail

APP=/opt/ezeng/app
DATA=/opt/ezeng/data
IP="${EZENG_IP:-217.28.220.146}"
PORT="${EZENG_PORT:-8443}"

mkdir -p "$APP" "$DATA/tls" "$DATA/progress"
chmod 700 "$DATA"

# Self-signed certificate for the server IP, valid 10 years. The public cert is pinned inside the app.
if [ ! -f "$DATA/tls/cert.pem" ]; then
  openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes -days 3650 \
    -keyout "$DATA/tls/key.pem" -out "$DATA/tls/cert.pem" \
    -subj "/CN=EzEng API" -addext "subjectAltName=IP:$IP" >/dev/null 2>&1
  chmod 600 "$DATA/tls/key.pem"
  echo "certificate created"
fi

docker pull -q node:22-alpine >/dev/null
docker rm -f ezeng-api >/dev/null 2>&1 || true
docker run -d --name ezeng-api --restart unless-stopped \
  -p "$PORT:$PORT" -e DATA_DIR=/data -e PORT="$PORT" \
  -v "$DATA:/data" -v "$APP:/app:ro" \
  --memory 256m --cpus 0.5 \
  node:22-alpine node /app/server.js >/dev/null

ufw allow "$PORT/tcp" >/dev/null
sleep 2
docker logs --tail 3 ezeng-api
echo "deployed: https://$IP:$PORT/api/v1/health"
