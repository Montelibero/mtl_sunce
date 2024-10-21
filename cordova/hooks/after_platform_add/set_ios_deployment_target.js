const fs = require("fs")
const path = require("path")

// Путь к файлу project.pbxproj в CordovaLib
const pbxprojPath = path.join(
  __dirname,
  "..",
  "..",
  "platforms",
  "ios",
  "CordovaLib",
  "CordovaLib.xcodeproj",
  "project.pbxproj"
)

// Читаем файл project.pbxproj
let pbxprojContent = fs.readFileSync(pbxprojPath, "utf8")

// Замена версии IPHONEOS_DEPLOYMENT_TARGET на 12.0
pbxprojContent = pbxprojContent.replace(/IPHONEOS_DEPLOYMENT_TARGET = \d+.\d+;/g, "IPHONEOS_DEPLOYMENT_TARGET = 12.0;")

// Записываем изменения обратно в файл
fs.writeFileSync(pbxprojPath, pbxprojContent)

console.log("IPHONEOS_DEPLOYMENT_TARGET успешно обновлён до 12.0 в CordovaLib")
