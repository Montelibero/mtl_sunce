import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import Dialog from "@material-ui/core/Dialog"
import List from "@material-ui/core/List"
import AddIcon from "@material-ui/icons/Add"
import { FullscreenDialogTransition } from "~App/theme"
import ButtonListItem from "~Generic/components/ButtonListItem"
import MainTitle from "~Generic/components/MainTitle"
import ViewLoading from "~Generic/components/ViewLoading"
import DialogBody from "~Layout/components/DialogBody"
import { ListItem, ListItemText } from "@material-ui/core"
import ContactDetailsDialog from "./ContactDetailsDialog"
import { PublicKey } from "~Generic/components/PublicKey"
import { useIsMobile } from "~Generic/hooks/userinterface"

type SavedAddresses = {
  [address: string]: { label: string }
}

interface SavedAddressesProps {
  addresses: SavedAddresses
  onClick: (address: string) => void
  testnet: boolean
}

const SavedAddresses = React.memo(function SavedAddresses(props: SavedAddressesProps) {
  const isSmallScreen = useIsMobile()

  return (
    <>
      {Object.keys(props.addresses).map(address => {
        return (
          <ListItem
            button={Boolean(props.onClick) as any}
            onClick={() => {
              return props.onClick(address)
            }}
          >
            <ListItemText
              primary={props.addresses[address].label}
              secondary={
                <PublicKey publicKey={address} testnet={props.testnet} variant={isSmallScreen ? "short" : "full"} />
              }
            />
          </ListItem>
        )
      })}
    </>
  )
})

interface ContactListDialogProps {
  testnet: boolean
  readonly?: boolean
  onSelect?: (address: string) => void
  onClose: () => void
}

function ContactListDialog(props: ContactListDialogProps) {
  const { t } = useTranslation()

  const storageKey = `sunce:favorites:${props.testnet ? "testnet" : "mainnet"}`

  const [editingAddress, setEditingAddress] = useState<{ label: string; address: string } | null>(null)

  const [contactList, setContactList] = useState<SavedAddresses>(() => {
    return JSON.parse(localStorage.getItem(storageKey) || "[]")
  })

  const openAddAddressDialog = () => {
    setEditingAddress({ address: "", label: "" })
  }

  const closeAddAddressDialog = () => {
    setEditingAddress(null)
  }

  const openAddressDetails = (address: string) => {
    const entry = contactList[address]
    setEditingAddress({ address, label: entry?.label || "" })
  }

  const handleSaveAddress = (address: string, label: string) => {
    setContactList((contactList: SavedAddresses) => {
      const newList = {
        ...contactList,
        [address]: { label }
      }
      localStorage.setItem(storageKey, JSON.stringify(newList))
      return newList
    })
    closeAddAddressDialog()
  }

  const handleRemoveAddress = (address: string) => {
    setContactList((contactList: SavedAddresses) => {
      const { [address]: _, ...newList } = contactList
      localStorage.setItem(storageKey, newList.toString())
      return newList
    })
    closeAddAddressDialog()
  }

  const handleAddressClick = (address: string) => {
    if (props.onSelect) return props.onSelect(address)
    if (!props.readonly) return openAddressDetails(address)
  }

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title={t("account.contact-list.title")} />}>
      <List style={{ margin: "0 -8px" }}>
        {!props.readonly && (
          <ButtonListItem gutterBottom onClick={openAddAddressDialog}>
            <AddIcon />
            &nbsp;&nbsp;{t("account.contact-list.button.add.label")}
          </ButtonListItem>
        )}
        <SavedAddresses addresses={contactList} onClick={handleAddressClick} testnet={props.testnet} />
      </List>
      <Dialog
        fullScreen
        open={!!editingAddress}
        onClose={closeAddAddressDialog}
        TransitionComponent={FullscreenDialogTransition}
      >
        <React.Suspense fallback={<ViewLoading />}>
          <ContactDetailsDialog
            address={editingAddress?.address}
            label={editingAddress?.label}
            onSave={handleSaveAddress}
            onRemove={handleRemoveAddress}
            onClose={closeAddAddressDialog}
          />
        </React.Suspense>
      </Dialog>
    </DialogBody>
  )
}

export default React.memo(ContactListDialog)
