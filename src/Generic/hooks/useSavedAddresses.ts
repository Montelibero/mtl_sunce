import { useCallback, useMemo, useState } from "react"

export type SavedAddresses = {
  [address: string]: { label: string }
}

const useSavedAddresses = (testnet: boolean) => {
  const storageKey = useMemo(() => `sunce:favorites:${testnet ? "testnet" : "mainnet"}`, [testnet])

  const [savedAddresses, setSavedAddresses] = useState<SavedAddresses>(
    (): SavedAddresses => JSON.parse(localStorage.getItem(storageKey) || "{}")
  )

  const write = useCallback(
    (addresses: SavedAddresses) => localStorage.setItem(storageKey, JSON.stringify(addresses)),
    [storageKey]
  )

  const add = useCallback(
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

  const remove = useCallback(
    (address: string) => {
      setSavedAddresses((addresses: SavedAddresses) => {
        const { [address]: _, ...newAddresses } = addresses
        write(newAddresses)
        return newAddresses
      })
    },
    [write]
  )

  return { savedAddresses, add, remove, write }
}

export default useSavedAddresses
