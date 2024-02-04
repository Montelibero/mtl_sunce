#!/bin/bash

# CSC_LINK=~/secret-certificates/macos.p12    # point to your local certificate file
# APPLE_ID="developer@company.com"
# APPLE_ID_TEAM="123ABCDEFG"

PLATFORM="$1"
ENV_FILE="signing-$PLATFORM.env"

if [ -f "./$ENV_FILE" ]; then
  echo "Loading signing config from $ENV_FILE..."
  source "./$ENV_FILE"
fi

echo "Enter password for the signing certificate vault: "
read -s CSC_KEY_PASSWORD

export CSC_LINK
export CSC_KEY_PASSWORD

if [ "$PLATFORM" = "mac" ]; then
  if [ -z "$APPLE_ID_PASSWORD" ]; then
    echo "Enter app-specific password from Apple ID $APPLE_ID: "
    read -s APPLE_ID_PASSWORD
  fi

  export APPLE_ID
  export APPLE_ID_PASSWORD
  export APPLE_ID_TEAM
fi
