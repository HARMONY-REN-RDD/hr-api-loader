#!/bin/bash

set -e
npx tsc
node ./dist/index.js "$@"
