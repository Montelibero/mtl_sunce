import React from "react"
import { AccountsProvider } from "../contexts/accounts"
import { CachingProviders } from "../contexts/caches"
import { NotificationsProvider } from "../contexts/notifications"
import { SettingsProvider } from "../contexts/settings"
import { SignatureDelegationProvider } from "../contexts/signatureDelegation"
import { StellarProvider } from "../contexts/stellar"
import { TransactionRequestProvider } from "../contexts/transactionRequest"
import { DialogsProvider } from "~App/contexts/dialogs"
import { SavedAddressesProvider } from "~App/contexts/savedAddresses"

export function ContextProviders(props: { children: React.ReactNode }) {
  return (
    <StellarProvider>
      <AccountsProvider>
        <SavedAddressesProvider>
          <SettingsProvider>
            <TransactionRequestProvider>
              <CachingProviders>
                <NotificationsProvider>
                  <DialogsProvider>
                    <SignatureDelegationProvider>{props.children}</SignatureDelegationProvider>
                  </DialogsProvider>
                </NotificationsProvider>
              </CachingProviders>
            </TransactionRequestProvider>
          </SettingsProvider>
        </SavedAddressesProvider>
      </AccountsProvider>
    </StellarProvider>
  )
}
