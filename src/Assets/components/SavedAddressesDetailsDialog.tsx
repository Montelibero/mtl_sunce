import React from "react"
import { useTranslation } from "react-i18next"
import MainTitle from "~Generic/components/MainTitle"
import DialogBody from "~Layout/components/DialogBody"
import { TextField } from "@material-ui/core"
import CloseIcon from "@material-ui/icons/Close"
import { useForm } from "react-hook-form"
import { nanoid } from "nanoid"
import { isMuxedAddress, isPublicKey, isStellarAddress } from "~Generic/lib/stellar-address"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"

export interface SavedAddressDetailsDialogProps {
  address?: string
  label?: string
  onClose: () => void
  onSave: (address: string, label: string) => void
  onRemove: (address: string) => void
}

export interface SavedAddressValues {
  address: string
  label: string
}

function SavedAddressDetailsDialog(props: SavedAddressDetailsDialogProps) {
  const { t } = useTranslation()

  const form = useForm<SavedAddressValues>({
    defaultValues: {
      address: props.address || "",
      label: props.label || ""
    }
  })

  const formID = React.useMemo(() => nanoid(), [])

  const handleFormSubmission = () => {
    const values = form.getValues()
    if (!values.address) return
    props.onSave(values.address, values.label)
  }

  return (
    <DialogBody excessWidth={12} top={<MainTitle onBack={props.onClose} title={props.label} />}>
      <form id={formID} noValidate onSubmit={form.handleSubmit(handleFormSubmission)}>
        <TextField
          error={Boolean(form.errors.address)}
          fullWidth
          inputProps={{
            style: { textOverflow: "ellipsis" }
          }}
          inputRef={form.register({
            required: t<string>("account.saved-address-details.validation.no-address"),
            validate: value =>
              isPublicKey(value) ||
              isMuxedAddress(value) ||
              isStellarAddress(value) ||
              t<string>("account.saved-address-details.validation.invalid-address")
          })}
          label={form.errors.address ? form.errors.address.message : t("account.saved-address-details.address.label")}
          margin="normal"
          name="address"
          onChange={event => form.setValue("address", event.target.value.trim())}
          placeholder={t("account.saved-address-details.address.placeholder")}
        />
        <TextField
          error={Boolean(form.errors.label)}
          fullWidth
          label={form.errors.label ? form.errors.label.message : t("account.saved-address-details.label.label")}
          margin="normal"
          name="label"
          inputRef={form.register({
            validate: {
              length: value =>
                value.length <= 1024 ||
                t<string>("account.saved-address-details.validation.label-too-long", { max: 1024 })
            }
          })}
          onChange={event => {
            form.setValue("label", event.target.value)
          }}
          placeholder={t("account.saved-address-details.label.label")}
        />
        <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
          {props.address && (
            <ActionButton
              icon={<CloseIcon />}
              onClick={() => props.onRemove(props.address || "")}
              style={{ maxWidth: "none" }}
              type="secondary"
            >
              {t("account.saved-address-details.button.remove.label")}
            </ActionButton>
          )}

          <ActionButton form={formID} onClick={() => undefined} type="submit">
            {t("account.saved-address-details.button.add.label")}
          </ActionButton>
        </DialogActionsBox>
      </form>
    </DialogBody>
  )
}

export default React.memo(SavedAddressDetailsDialog)
