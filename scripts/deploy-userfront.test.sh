#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/bin" "$TMP/nginx/conf.d"
cp "$ROOT/infra/oci/userfront-upstream.conf.template" "$TMP/nginx/conf.d/"
cat > "$TMP/nginx/conf.d/userfront-upstream.conf" <<'EOF'
upstream userfront_active { server userfront-blue:3000; }
EOF
touch "$TMP/env"
cat > "$TMP/bin/docker" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
echo "$*" >> "$TRACE"
case "$1 $2" in
  "pull ghcr.io/eddie-backdev/itplace-user-front:test-tag")
    [[ "${FAIL_PULL:-0}" != 1 ]] || exit 1
    ;;
  "tag ghcr.io/eddie-backdev/itplace-user-front:test-tag")
    [[ "${FAIL_TAG:-0}" != 1 ]] || exit 1
    ;;
  "run --rm")
    [[ "${FAIL_HEALTH:-0}" != 1 ]] || exit 1
    ;;
  "exec nginx-proxy")
    if [[ "${FAIL_NGINX_TEST:-0}" == 1 && "${*: -1}" == "-t" ]]; then exit 1; fi
    if [[ "${FAIL_NGINX_RELOAD:-0}" == 1 && "${*: -1}" == "reload" && ! -f "$TRACE.reload-failed" ]]; then
      touch "$TRACE.reload-failed"
      exit 1
    fi
    ;;
esac
if [[ "$1 ${2:-} ${3:-}" == "rm -f userfront-green" && "${FAIL_OLD_REMOVE:-0}" == 1 ]]; then exit 1; fi
if [[ "$1" == cp ]]; then
  [[ "${FAIL_ASSET_COPY:-0}" != 1 ]] || exit 1
  mkdir -p "$3/chunks"
  touch "$3/chunks/test.js"
fi
if [[ "$1 $2" == "ps -a" ]]; then printf 'userfront-blue\nuserfront-green\n'; fi
MOCK
chmod +x "$TMP/bin/docker"
printf '#!/usr/bin/env bash\nexit 0\n' > "$TMP/bin/flock"
chmod +x "$TMP/bin/flock"

run_deploy() {
  PATH="$TMP/bin:$PATH" TRACE="$TMP/trace" \
    ENV_FILE="$TMP/env" UPSTREAM_FILE="$TMP/nginx/conf.d/userfront-upstream.conf" \
    STATIC_DIR="$TMP/static" LOCK_FILE="$TMP/deploy.lock" \
    HEALTH_CHECK_MAX_ATTEMPTS=1 HEALTH_CHECK_INTERVAL_SECONDS=0 \
    "$ROOT/scripts/deploy-userfront.sh" test-tag
}

if FAIL_HEALTH=1 run_deploy >/dev/null 2>&1; then echo "health failure unexpectedly deployed" >&2; exit 1; fi
! grep -Eq 'nginx-proxy nginx -s reload' "$TMP/trace"
! grep -Eq 'rm -f userfront-blue' "$TMP/trace"
grep -Eq 'server userfront-blue:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"

: > "$TMP/trace"
if FAIL_PULL=1 run_deploy >/dev/null 2>&1; then echo "pull failure unexpectedly deployed" >&2; exit 1; fi
! grep -Eq 'rm -f userfront-green' "$TMP/trace"

: > "$TMP/trace"
if FAIL_TAG=1 run_deploy >/dev/null 2>&1; then echo "tag failure unexpectedly deployed" >&2; exit 1; fi
! grep -Eq 'rm -f userfront-green|userfront-assets-green' "$TMP/trace"

: > "$TMP/trace"
if FAIL_ASSET_COPY=1 run_deploy >/dev/null 2>&1; then echo "asset copy failure unexpectedly deployed" >&2; exit 1; fi
grep -Eq 'rm -f userfront-assets-green' "$TMP/trace"

: > "$TMP/trace"
if FAIL_NGINX_TEST=1 run_deploy >/dev/null 2>&1; then echo "invalid Nginx config unexpectedly deployed" >&2; exit 1; fi
grep -Eq 'server userfront-blue:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"
grep -Eq 'nginx-proxy nginx -s reload' "$TMP/trace"
! grep -Eq 'rm -f userfront-blue' "$TMP/trace"

: > "$TMP/trace"
if FAIL_NGINX_RELOAD=1 run_deploy >/dev/null 2>&1; then echo "failed nginx reload unexpectedly deployed" >&2; exit 1; fi
grep -Eq 'server userfront-blue:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"
[[ "$(grep -c 'nginx-proxy nginx -s reload' "$TMP/trace")" -eq 2 ]]
! grep -Eq 'rm -f userfront-blue' "$TMP/trace"

: > "$TMP/trace"
run_deploy >/dev/null
grep -Eq 'server userfront-green:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"
grep -Fq 'pull ghcr.io/eddie-backdev/itplace-user-front:test-tag' "$TMP/trace"
grep -Fq 'tag ghcr.io/eddie-backdev/itplace-user-front:test-tag itplace-user-front:test-tag' "$TMP/trace"
grep -Fq 'create --name userfront-assets-green itplace-user-front:test-tag' "$TMP/trace"
grep -Fq -- '--label itplace.service=user-front itplace-user-front:test-tag' "$TMP/trace"
reload_line="$(grep -n 'nginx-proxy nginx -s reload' "$TMP/trace" | tail -n 1 | cut -d: -f1)"
old_remove_line="$(grep -n 'rm -f userfront-blue' "$TMP/trace" | tail -n 1 | cut -d: -f1)"
[[ "$old_remove_line" -gt "$reload_line" ]]

: > "$TMP/trace"
if FAIL_OLD_REMOVE=1 run_deploy >/dev/null 2>&1; then echo "old container removal failure unexpectedly succeeded" >&2; exit 1; fi
grep -Eq 'server userfront-blue:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"
[[ "$(grep -c 'nginx-proxy nginx -s reload' "$TMP/trace")" -eq 1 ]]
[[ "$(grep -c 'rm -f userfront-blue' "$TMP/trace")" -eq 1 ]]

rm "$TMP/nginx/conf.d/userfront-upstream.conf"
: > "$TMP/trace"
run_deploy >/dev/null
grep -Eq 'server userfront-blue:3000' "$TMP/nginx/conf.d/userfront-upstream.conf"
! grep -Eq 'rm -f userfront-none' "$TMP/trace"
echo "deploy-userfront checks passed"
