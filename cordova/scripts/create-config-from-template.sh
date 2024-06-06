#!/bin/bash

ENVIRONMENT="$1"
PLATFORM="$2"
TEMPLATE_FILE="config.template"

cd "$(dirname $0)"

if [ -f "../config/$TEMPLATE_FILE" ]; then
  echo "Creating config file from $TEMPLATE_FILE ..."

  # Check if versions are already provided
  if [ "$PACKAGE_VERSION" == "" ]; then
    echo "Package version is not provided. Reading from package.json..."
    export PACKAGE_VERSION="$(cat ../../package.json | ../node_modules/.bin/json version)"
  fi
  if [ "$BUILD_VERSION" == "" ]; then
    echo "Build version is not provided. Generating..."
    export BUILD_VERSION="$(($(TZ=UTC date +%s)-1710000000))"
  fi
  echo "Generate config version $PACKAGE_VERSION.$BUILD_VERSION"

  export IOS_BUNDLE_VERSION="$PACKAGE_VERSION.$BUILD_VERSION"
  export HTML_ENTRYPOINT="index.$ENVIRONMENT-$PLATFORM.html"

  if [ "$PACKAGE_VERSION" == "" ]; then
    echo "Error: Could not read app version." 1>&2
    exit 1
  fi

  if [ $PLATFORM == "ios" ]; then
    export SPLASH_SCREEN_DELAY="3000"
    export AUTO_HIDE="false"
  else 
    export SPLASH_SCREEN_DELAY="0"
    export AUTO_HIDE="true"
  fi

  ./envsubst.js ../config/config.template > ../config.xml
fi
