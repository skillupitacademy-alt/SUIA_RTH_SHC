#!/bin/bash
for f in \
  /opt/platform/env/shared/.env \
  /opt/platform/env/brands/skillhubcore.env \
  /opt/platform/env/brands/skillup.env \
  /opt/platform/env/brands/realtutorialhub.env \
  /opt/platform/env/services/skillhubcore-admin.env \
  /opt/platform/env/services/skillup-web.env \
  /opt/platform/env/services/realtutorialhub-web.env \
  /opt/platform/env/services/skillup-admin.env \
  /opt/platform/env/services/realtutorialhub-admin.env
do
  echo "=== $f ==="

  if [ ! -f "$f" ]; then
    echo "FILE: ABSENT"
    continue
  fi

  echo "FILE: PRESENT"

  if grep -q '^INTERNAL_GATEWAY_SECRET=' "$f"; then
    echo "SECRET: PRESENT"
    grep '^INTERNAL_GATEWAY_SECRET=' "$f" | \
      sed 's/^INTERNAL_GATEWAY_SECRET=//' | \
      tr -d '"' | \
      tr -d "'" | \
      sha256sum | \
      cut -c1-16
  else
    echo "SECRET: ABSENT"
  fi
done
