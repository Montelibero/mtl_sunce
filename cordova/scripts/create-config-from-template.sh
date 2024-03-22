#!/bin/bash

ENVIRONMENT="$1"
PLATFORM="$2"
TEMPLATE_FILE="config.template"

cd "$(dirname $0)"

if [ -f "../config/$TEMPLATE_FILE" ]; then
  echo "Creating config file from $TEMPLATE_FILE ..."

  export HTML_ENTRYPOINT="index.$ENVIRONMENT-$PLATFORM.html"
  export PACKAGE_VERSION="$(cat ../../package.json | ../node_modules/.bin/json version)"
  aligned_build_version=$(($(TZ=UTC date +%s)-1708020000))
  export ANDROID_VERSIONCODE="$aligned_build_version"
  export IOS_BUNDLE_VERSION="$PACKAGE_VERSION.$aligned_build_version"

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
