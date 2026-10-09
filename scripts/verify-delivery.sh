#!/usr/bin/env bash
# [R-53] Проверка доставки сайта по адресу: код сжат, файлы с хешем кэшируются надолго,
# главная страница — не кэшируется. Запуск: scripts/verify-delivery.sh https://wanmax.nodeport.ru
set -uo pipefail
BASE="${1:?адрес сайта}"
fail=0
ok()  { echo "  ✓ $*"; }
bad() { echo "  ✗ $*"; fail=1; }

INDEX_HEADERS=$(curl -s -D - -o /tmp/verify-delivery-index.html "$BASE/")
JS=$(grep -oE '/(static|assets)/[^"]+\.js' /tmp/verify-delivery-index.html | head -1)
[ -n "$JS" ] || { echo "не нашёл основной js в $BASE/"; exit 2; }
echo "Сайт: $BASE · основной код: $JS"

RAW=$(curl -s -o /dev/null -w '%{size_download}' "$BASE$JS")
JS_HEADERS=$(curl -s -D - -o /dev/null -H 'Accept-Encoding: gzip, br' "$BASE$JS")
SENT=$(curl -s -o /dev/null -w '%{size_download}' -H 'Accept-Encoding: gzip, br' "$BASE$JS")

echo "[R-53.1] сжатие"
if echo "$JS_HEADERS" | grep -qiE '^content-encoding: *(gzip|br)'; then ok "Content-Encoding есть"; else bad "код идёт без сжатия"; fi
PCT=$(( SENT * 100 / RAW ))
# Порог — «сжат минимум вдвое» (R-53.1, ревизия 09.10: было ≤ 30% — подбиралось под вывод CRA).
if [ "$PCT" -le 50 ]; then ok "передано $SENT из $RAW байт ($PCT% ≤ 50%)"; else bad "передано $SENT из $RAW байт ($PCT% > 50%)"; fi

echo "[R-53.2] кэш файлов с хешем"
CC=$(echo "$JS_HEADERS" | grep -i '^cache-control:' | tr -d '\r')
if echo "$CC" | grep -q 'max-age=31536000' && echo "$CC" | grep -q 'immutable'; then ok "$CC"; else bad "Cache-Control у кода: '${CC:-нет}' (нужно max-age=31536000, immutable)"; fi

echo "[R-53.3] главная страница не кэшируется"
ICC=$(echo "$INDEX_HEADERS" | grep -i '^cache-control:' | tr -d '\r')
if echo "$ICC" | grep -qE 'no-cache|no-store|max-age=0'; then ok "$ICC"; else bad "Cache-Control у главной: '${ICC:-нет}'"; fi

[ "$fail" = 0 ] && echo "ИТОГ: OK" || echo "ИТОГ: НЕ ВЫПОЛНЕНО"
exit "$fail"
