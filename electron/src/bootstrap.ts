import { app } from "electron"

// Quick-fix for "io.solarwallet.app" being shown in Mac app menu
app.name = "Sunce Wallet"

// Needs to match the value in electron-build.yml
app.setAppUserModelId("org.montelibero.sunce")
