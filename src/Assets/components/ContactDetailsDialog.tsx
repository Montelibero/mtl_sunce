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

interface ContactDetailsDialogProps {
  address?: string
  label?: string
  onClose: () => void
  onSave: (address: string, label: string) => void
  onRemove: (address: string) => void
}

export interface ContactDetailsValues {
  address: string
  label: string
}

function ContactDetailsDialog(props: ContactDetailsDialogProps) {
  const { t } = useTranslation()

  const form = useForm<ContactDetailsValues>({
    defaultValues: {
      address: props.address || "",
      label: props.label || ""
    }
  })

  const formID = React.useMemo(() => nanoid(), [])

  const handleFormSubmission = () => {
    const values = form.getValues()
    console.log({ values })
    if (!values.address || !values.label) return
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
            required: t<string>("account.contact-details.validation.no-address"),
            validate: value =>
              isPublicKey(value) ||
              isMuxedAddress(value) ||
              isStellarAddress(value) ||
              t<string>("account.contact-details.validation.invalid-address")
          })}
          label={form.errors.address ? form.errors.address.message : t("account.contact-details.address.label")}
          margin="normal"
          name="address"
          onChange={event => form.setValue("address", event.target.value.trim())}
          placeholder={t("account.contact-details.address.placeholder")}
        />
        <TextField
          error={Boolean(form.errors.label)}
          fullWidth
          label={form.errors.label ? form.errors.label.message : t("account.contact-details.label.label")}
          margin="normal"
          name="label"
          inputRef={form.register({
            validate: {
              length: value => value.length <= 28 || t<string>("account.contact-details.validation.label-too-long"),
              labelRequired: value => value.length > 0 || t<string>("account.contact-details.validation.no-label")
            }
          })}
          onChange={event => {
            form.setValue("label", event.target.value)
          }}
          placeholder={t("account.contact-details.label.label")}
        />
        <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
          {props.address && (
            <ActionButton
              icon={<CloseIcon />}
              onClick={() => props.onRemove(props.address || "")}
              style={{ maxWidth: "none" }}
              type="secondary"
            >
              {t("account.contact-details.button.remove.label")}
            </ActionButton>
          )}

          <ActionButton form={formID} onClick={() => undefined} type="submit">
            {t("account.contact-details.button.add.label")}
          </ActionButton>
        </DialogActionsBox>
      </form>
    </DialogBody>
  )
}

export default React.memo(ContactDetailsDialog)
