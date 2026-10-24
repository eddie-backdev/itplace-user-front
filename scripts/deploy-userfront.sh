#!/usr/bin/env bash
set -Eeuo pipefail

IMAGE_TAG="${1:-}"
if [[ -z "$IMAGE_TAG" ]]; then echo "Usage: $0 <image-tag>" >&2; exit 2; fi
GHCR_USERNAME="${2:-}"

IMAGE_REPOSITORY="${IMAGE_REPOSITORY:-ghcr.io/eddie-backdev/itplace-user-front}"
IMAGE="${IMAGE_REPOSITORY}:${IMAGE_TAG}"
LOCAL_IMAGE_NAME="${LOCAL_IMAGE_NAME:-itplace-user-front}"
LOCAL_IMAGE="${LOCAL_IMAGE_NAME}:${IMAGE_TAG}"
APP_NETWORK="${APP_NETWORK:-app-network}"
ENV_FILE="${ENV_FILE:-/home/ubuntu/app/env/userfront.env}"
UPSTREAM_FILE="${UPSTREAM_FILE:-/home/ubuntu/app/nginx/conf.d/userfront-upstream.conf}"
NGINX_CONTAINER="${NGINX_CONTAINER:-nginx-proxy}"
STATIC_DIR="${STATIC_DIR:-/home/ubuntu/app/userfront-static}"
LOCK_FILE="${LOCK_FILE:-/home/ubuntu/app/userfront-deploy.lock}"
HEALTH_CHECK_IMAGE="${HEALTH_CHECK_IMAGE:-curlimages/curl:8.7.1}"
HEALTH_CHECK_MAX_ATTEMPTS="${HEALTH_CHECK_MAX_ATTEMPTS:-30}"
HEALTH_CHECK_INTERVAL_SECONDS="${HEALTH_CHECK_INTERVAL_SECONDS:-2}"

[[ -f "$ENV_FILE" ]] || { echo "[userfront] env file not found: $ENV_FILE" >&2; exit 1; }
mkdir -p "$STATIC_DIR" "$(dirname "$LOCK_FILE")"
exec 9>"$LOCK_FILE"
flock -n 9 || { echo "[userfront] another deployment is running" >&2; exit 1; }

UPSTREAM_TEMPLATE="${UPSTREAM_TEMPLATE:-${UPSTREAM_FILE%/*}/userfront-upstream.conf.template}"
[[ -f "$UPSTREAM_TEMPLATE" ]] || { echo "[userfront] upstream template not found: $UPSTREAM_TEMPLATE" >&2; exit 1; }
UPSTREAM_EXISTED=false
if [[ -f "$UPSTREAM_FILE" ]]; then
  UPSTREAM_EXISTED=true
  if grep -q 'userfront-blue' "$UPSTREAM_FILE"; then ACTIVE=blue; INACTIVE=green; else ACTIVE=green; INACTIVE=blue; fi
else
  ACTIVE=none
  INACTIVE=blue
fi
NEW_CONTAINER="userfront-${INACTIVE}"
OLD_CONTAINER="userfront-${ACTIVE}"
BACKUP=""
CONFIG_WRITTEN=false
SWITCHED=false
NEW_CREATED=false
ASSET_CREATED=false
GHCR_CONFIG=""

rollback() {
  local rc=$?
  if [[ "$rc" -ne 0 && "$CONFIG_WRITTEN" == true ]]; then
    echo "[userfront] restoring previous Nginx upstream" >&2
    if [[ "$UPSTREAM_EXISTED" == true ]]; then cp "$BACKUP" "$UPSTREAM_FILE"; else rm -f "$UPSTREAM_FILE"; fi
    docker exec "$NGINX_CONTAINER" nginx -t >/dev/null 2>&1 || true
    docker exec "$NGINX_CONTAINER" nginx -s reload >/dev/null 2>&1 || true
  fi
  if [[ "$rc" -ne 0 && "$SWITCHED" == false && "$NEW_CREATED" == true ]]; then docker rm -f "$NEW_CONTAINER" >/dev/null 2>&1 || true; fi
  if [[ "$ASSET_CREATED" == true ]]; then docker rm -f "$ASSET_CONTAINER" >/dev/null 2>&1 || true; fi
  [[ -z "$BACKUP" ]] || rm -f "$BACKUP"
  [[ -z "$GHCR_CONFIG" ]] || rm -rf "$GHCR_CONFIG"
  return "$rc"
}
trap rollback EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ -n "$GHCR_USERNAME" ]]; then
  GHCR_CONFIG="$(mktemp -d)"
  export DOCKER_CONFIG="$GHCR_CONFIG"
  docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

echo "[userfront] deploying ${IMAGE} to ${NEW_CONTAINER}; current=${OLD_CONTAINER}"
docker pull "$IMAGE"
docker tag "$IMAGE" "$LOCAL_IMAGE"
docker rm -f "$NEW_CONTAINER" >/dev/null 2>&1 || true

# Keep every hashed Next.js asset so pages already open in a browser survive a release.
ASSET_CONTAINER="userfront-assets-${INACTIVE}"
docker rm -f "$ASSET_CONTAINER" >/dev/null 2>&1 || true
docker create --name "$ASSET_CONTAINER" "$LOCAL_IMAGE" >/dev/null
ASSET_CREATED=true
docker cp "$ASSET_CONTAINER:/app/.next/static/." "$STATIC_DIR/"
docker rm "$ASSET_CONTAINER" >/dev/null
ASSET_CREATED=false

NEW_CREATED=true
docker run -d \
  --name "$NEW_CONTAINER" --restart unless-stopped \
  --network "$APP_NETWORK" --memory 1g --memory-reservation 512m --cpus 1.5 \
  --env-file "$ENV_FILE" -e PORT=3000 -e HOSTNAME=0.0.0.0 \
  -v "$STATIC_DIR:/app/.next/static:ro" \
  --label itplace.service=user-front "$LOCAL_IMAGE" >/dev/null

echo "[userfront] waiting for ${NEW_CONTAINER}/login"
for ((i=1; i<=HEALTH_CHECK_MAX_ATTEMPTS; i++)); do
  if docker run --rm --network "$APP_NETWORK" "$HEALTH_CHECK_IMAGE" --connect-timeout 5 --max-time 15 -fsS "http://${NEW_CONTAINER}:3000/login" >/dev/null; then break; fi
  if [[ "$i" -eq "$HEALTH_CHECK_MAX_ATTEMPTS" ]]; then echo "[userfront] health check failed" >&2; docker logs --tail 150 "$NEW_CONTAINER" >&2 || true; exit 1; fi
  sleep "$HEALTH_CHECK_INTERVAL_SECONDS"
done

for path in / "/_next/static/$(find "$STATIC_DIR" -type f -print -quit | sed "s#^$STATIC_DIR/##")"; do
  [[ "$path" != "/_next/static/" ]] || { echo "[userfront] no static assets found" >&2; exit 1; }
  docker run --rm --network "$APP_NETWORK" "$HEALTH_CHECK_IMAGE" --connect-timeout 5 --max-time 15 -fsS "http://${NEW_CONTAINER}:3000${path}" >/dev/null \
    || { echo "[userfront] smoke check failed: ${path}" >&2; exit 1; }
done

if [[ "$UPSTREAM_EXISTED" == true ]]; then
  BACKUP="$(mktemp "${UPSTREAM_FILE}.backup.XXXXXX")"
  cp "$UPSTREAM_FILE" "$BACKUP"
fi
sed "s/__USERFRONT_CONTAINER__/${NEW_CONTAINER}/g" "$UPSTREAM_TEMPLATE" > "${UPSTREAM_FILE}.new"
mv "${UPSTREAM_FILE}.new" "$UPSTREAM_FILE"
CONFIG_WRITTEN=true
docker exec "$NGINX_CONTAINER" nginx -t
docker exec "$NGINX_CONTAINER" nginx -s reload
SWITCHED=true
CONFIG_WRITTEN=false
rm -f "$BACKUP"
BACKUP=""
echo "[userfront] traffic switched to ${NEW_CONTAINER}; kept ${OLD_CONTAINER} for recovery"
