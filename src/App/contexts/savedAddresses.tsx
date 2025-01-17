import React from "react"

export type SavedAddresses = {
  [address: string]: { label: string }
}

const storageKey = "sunce:favorites:mainnet"

interface Props {
  children: React.ReactNode
}

interface ContextType {
  savedAddresses: SavedAddresses
  add: (address: string, label: string) => void
  remove: (address: string) => void
  bulkUpdate: (addresses: SavedAddresses) => void
}

const initialValues: ContextType = {
  savedAddresses: {},
  add: (address: string, label: string) => {},
  remove: (address: string) => {},
  bulkUpdate: (addresses: SavedAddresses) => {}
}

const SavedAddressesContext = React.createContext<ContextType>(initialValues)

export function SavedAddressesProvider(props: Props) {
  const [savedAddresses, setSavedAddresses] = React.useState<SavedAddresses>(
    (): SavedAddresses => JSON.parse(localStorage.getItem(storageKey) || "{}")
  )

  const write = React.useCallback(
    (addresses: SavedAddresses) => localStorage.setItem(storageKey, JSON.stringify(addresses)),
    []
  )

  const bulkUpdate = React.useCallback(
    (addresses: SavedAddresses) => {
      write(addresses)
      setSavedAddresses(addresses)
    },
    [write]
  )

  const add = React.useCallback(
    (address: string, label: string) => {
      setSavedAddresses((addresses: SavedAddresses) => {
        const newAddresses = {
          ...addresses,
          [address]: { label }
        }
        write(newAddresses)
        return newAddresses
      })
    },
    [write]
  )

  const remove = React.useCallback(
    (address: string) => {
      setSavedAddresses((addresses: SavedAddresses) => {
        const { [address]: _, ...newAddresses } = addresses
        write(newAddresses)
        return newAddresses
      })
    },
    [write]
  )
  const context = {
    savedAddresses,
    add,
    remove,
    bulkUpdate
  }

  return <SavedAddressesContext.Provider value={context}>{props.children}</SavedAddressesContext.Provider>
}

export { ContextType as SavedAddressesContextType, SavedAddressesContext }
