#!/bin/sh
set -e

if [ ! -x node_modules/.bin/next ]; then
  npm install
fi

exec "$@"
