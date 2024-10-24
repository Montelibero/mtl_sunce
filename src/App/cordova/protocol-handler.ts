import { Messages } from "~shared/ipc"
import { expose } from "./ipc"

export function registerURLHandler(contentWindow: Window, iframeReady: Promise<void>) {
  window.handleOpenURL = handleOpenURL(contentWindow, iframeReady)

  // there is no way we can check for default handler in cordova
  expose(Messages.IsDefaultProtocolClient, () => {
    return true
  })

  expose(Messages.IsDifferentHandlerInstalled, () => {
    return false
  })

  expose(Messages.SetAsDefaultProtocolClient, () => {
    return true
  })
}

const handleOpenURL = (contentWindow: Window, iframeReady: Promise<void>) => (url: string) => {
  iframeReady.then(() => {
    contentWindow.postMessage({ messageType: Messages.DeepLinkURL, result: url }, "*")
  })
}
