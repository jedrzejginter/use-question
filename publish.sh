#!/bin/sh

set -eo pipefail

rm -rf lib
npm run build
npm publish --access public
