import { Dialog } from "@material-ui/core"
import React from "react"
import { FullscreenDialogTransition } from "~App/theme"
import ViewLoading from "~Generic/components/ViewLoading"
import SavedAddressesDialog, { SavedAddressesDialogProps } from "../../Assets/components/SavedAddressesDialog"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  isSavedAddressesOpened: boolean
  openSavedAddresses: (params: Partial<SavedAddressesDialogProps> | null) => void
}

const initialValues: ContextType = {
  isSavedAddressesOpened: false,
  openSavedAddresses: () => undefined
}

const DialogsContext = React.createContext<ContextType>(initialValues)

export function DialogsProvider(props: Props) {
  const [savedAddressesDialog, setSavedAddressesDialog] = React.useState<Partial<SavedAddressesDialogProps> | null>(
    null
  )

  const closeSavedAddressesDialog = React.useCallback(() => {
    savedAddressesDialog?.onClose?.()
    setSavedAddressesDialog(null)
  }, [savedAddressesDialog])

  const context = {
    isSavedAddressesOpened: !!savedAddressesDialog,
    openSavedAddresses: setSavedAddressesDialog
  }

  return (
    <DialogsContext.Provider value={context}>
      {props.children}
      <React.Suspense fallback={null}>
        <Dialog
          open={!!savedAddressesDialog}
          fullScreen
          onClose={closeSavedAddressesDialog}
          TransitionComponent={FullscreenDialogTransition}
        >
          <React.Suspense fallback={<ViewLoading />}>
            <SavedAddressesDialog {...(savedAddressesDialog || {})} onClose={closeSavedAddressesDialog} />
          </React.Suspense>
        </Dialog>
      </React.Suspense>
    </DialogsContext.Provider>
  )
}

export { ContextType as DialogsContextType, DialogsContext }
