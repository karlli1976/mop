#!/usr/bin/env bash
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --allow-file-access-from-files "file://$APP_DIR/dist/index.html"