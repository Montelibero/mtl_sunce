#!/bin/bash
ROOT_DIR=$1
cp $ROOT_DIR/scripts/android/MainActivity.java $ROOT_DIR/platforms/android/app/src/main/java/org/montelibero/solar/MainActivity.java
cp $ROOT_DIR/scripts/android/CDVIonicKeyboard.java $ROOT_DIR/platforms/android/app/src/main/java/io/ionic/keyboard/CDVIonicKeyboard.java
