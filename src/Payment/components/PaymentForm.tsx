import { ButtonBase, Dialog } from "@material-ui/core"
import InputAdornment from "@material-ui/core/InputAdornment"
import TextField from "@material-ui/core/TextField"
import AccountBoxIcon from "@material-ui/icons/AccountBox"
import CloseIcon from "@material-ui/icons/Close"
import SendIcon from "@material-ui/icons/Send"
import { parseStellarUri, isStellarUri, PayStellarUri, StellarUriType } from "@stellarguard/stellar-uri"
import BigNumber from "big.js"
import { nanoid } from "nanoid"
import React from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Asset, Memo, MemoType, Server, Transaction } from "stellar-sdk"
import { Account } from "~App/contexts/accounts"
import { FullscreenDialogTransition } from "~App/theme"
import SavedAddressesDialog from "~Assets/components/SavedAddressesDialog"
import AssetSelector from "~Generic/components/AssetSelector"
import { ActionButton, DialogActionsBox } from "~Generic/components/DialogActions"
import { PriceInput, QRReader } from "~Generic/components/FormFields"
import Portal from "~Generic/components/Portal"
import ViewLoading from "~Generic/components/ViewLoading"
import { useFederationLookup } from "~Generic/hooks/stellar"
import { AccountRecord, useWellKnownAccounts } from "~Generic/hooks/stellar-ecosystem"
import { RefStateObject, useIsMobile } from "~Generic/hooks/userinterface"
import { AccountData } from "~Generic/lib/account"
import { formatBalance } from "~Generic/lib/balances"
import { CustomError } from "~Generic/lib/errors"
import { FormBigNumber, isValidAmount, replaceCommaWithDot } from "~Generic/lib/form"
import {
  balancelineToAsset,
  findMatchingBalanceLine,
  getAccountMinimumBalance,
  getSpendableBalance
} from "~Generic/lib/stellar"
import { isMuxedAddress, isPublicKey, isStellarAddress } from "~Generic/lib/stellar-address"
import { createPaymentOperation, createTransaction, multisigMinimumFee } from "~Generic/lib/transaction"
import { HorizontalLayout } from "~Layout/components/Box"

export interface PaymentParams {
  amount?: string
  asset?: Asset
  destination?: string
  memo?: string
  memoType?: MemoType
}

export interface PaymentFormValues {
  amount: string
  asset: Asset
  destination: string
  memoValue: string
}

type ExtendedPaymentFormValues = PaymentFormValues & { memoType: MemoType }

interface MemoMetadata {
  label: string
  placeholder: string
  requiredType: MemoType | undefined
}

function createMemo(memoType: MemoType, memoValue: string) {
  switch (memoType) {
    case "id":
      return Memo.id(memoValue)
    case "text":
      return Memo.text(memoValue)
    default:
      return Memo.none()
  }
}

interface PaymentFormProps {
  accountData: AccountData
  actionsRef: RefStateObject
  onCancel?: () => void
  onSubmit: (
    formValues: ExtendedPaymentFormValues,
    spendableBalance: BigNumber,
    wellknownAccount?: AccountRecord
  ) => void
  openOrdersCount: number
  preselectedParams?: PaymentParams
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
}

const PaymentForm = React.memo(function PaymentForm(props: PaymentFormProps) {
  const isSmallScreen = useIsMobile()
  const formID = React.useMemo(() => nanoid(), [])
  const { t } = useTranslation()
  const wellknownAccounts = useWellKnownAccounts(props.testnet)

  const [matchingWellknownAccount, setMatchingWellknownAccount] = React.useState<AccountRecord | undefined>(undefined)
  const [memoType, setMemoType] = React.useState<MemoType>("none")
  const [memoMetadata, setMemoMetadata] = React.useState<MemoMetadata>({
    label: t("payment.memo-metadata.label.default"),
    placeholder: t("payment.memo-metadata.placeholder.optional"),
    requiredType: undefined
  })
  const form = useForm<PaymentFormValues>({
    defaultValues: {
      amount: "",
      asset: undefined,
      destination: "",
      memoValue: ""
    }
  })

  const formValues = form.watch()
  const { preselectedParams } = props
  const { setValue } = form

  const spendableBalance = getSpendableBalance(
    getAccountMinimumBalance(props.accountData),
    findMatchingBalanceLine(props.accountData.balances, formValues.asset)
  )

  React.useEffect(() => {
    if (!preselectedParams) return

    if (preselectedParams.amount) setValue("amount", preselectedParams.amount)
    if (preselectedParams.asset) setValue("asset", preselectedParams.asset)
    if (preselectedParams.destination) setValue("destination", preselectedParams.destination)
    if (preselectedParams.memo) setValue("memoValue", preselectedParams.memo)
  }, [preselectedParams, setValue])

  React.useEffect(() => {
    if (!isPublicKey(formValues.destination) && !isStellarAddress(formValues.destination)) {
      if (matchingWellknownAccount) {
        setMatchingWellknownAccount(undefined)
      }
      return
    }

    const knownAccount = wellknownAccounts.lookup(formValues.destination)
    setMatchingWellknownAccount(knownAccount)

    if (preselectedParams && preselectedParams.memo && preselectedParams.memoType) {
      setMemoType(preselectedParams.memoType)
      setMemoMetadata({
        label:
          preselectedParams.memoType === "id"
            ? t("payment.memo-metadata.label.id")
            : t("payment.memo-metadata.label.text"),
        placeholder: t("payment.memo-metadata.placeholder.mandatory"),
        requiredType: preselectedParams.memoType
      })
    } else if (knownAccount && knownAccount.tags.indexOf("exchange") !== -1) {
      const acceptedMemoType = knownAccount.accepts && knownAccount.accepts.memo
      const requiredType = acceptedMemoType === "MEMO_ID" ? "id" : "text"
      setMemoType(requiredType)
      setMemoMetadata({
        label:
          acceptedMemoType === "MEMO_ID" ? t("payment.memo-metadata.label.id") : t("payment.memo-metadata.label.text"),
        placeholder: t("payment.memo-metadata.placeholder.mandatory"),
        requiredType
      })
    } else {
      setMemoType(formValues.memoValue.length === 0 ? "none" : "text")
      setMemoMetadata({
        label: t("payment.memo-metadata.label.default"),
        placeholder: t("payment.memo-metadata.placeholder.optional"),
        requiredType: undefined
      })
    }
  }, [
    formValues.destination,
    formValues.memoValue,
    matchingWellknownAccount,
    memoType,
    preselectedParams,
    t,
    wellknownAccounts
  ])

  const handleFormSubmission = () => {
    props.onSubmit({ memoType, ...form.getValues() }, spendableBalance, matchingWellknownAccount)
  }

  const handlePaymentLink = React.useCallback((uri: PayStellarUri) => {
    setValue("destination", uri.destination)

    if (uri.amount) {
      setValue("amount", uri.amount)
    }

    if (uri.assetCode && uri.assetIssuer) {
      setValue("asset", new Asset(uri.assetCode, uri.assetIssuer))
    }

    if (uri.memo) {
      setMemoType(uri.memoType || "text")
      setValue("memoValue", uri.memo)
    }
  }, [])

  const handleQRScan = React.useCallback(
    (scanResult: string) => {
      // handle SEP-07 Pay uri
      if (isStellarUri(scanResult)) {
        const stellarUri = parseStellarUri(scanResult)
        if (stellarUri.operation === StellarUriType.Pay) {
          handlePaymentLink(stellarUri as PayStellarUri)
        }
        form.triggerValidation()
        return
      }

      const [destination, query] = scanResult.split("?")

      // handle plain address or Kraken-style uri (<destination>?dt=<memoid>)
      if (isStellarAddress(destination)) {
        setValue("destination", destination)

        if (!query) {
          return
        }

        const searchParams = new URLSearchParams(query)
        const memoValue = searchParams.get("dt")

        if (memoValue) {
          setMemoType("id")
          setValue("memoValue", memoValue)
        }
      }
    },
    [setValue, form]
  )

  const [showSavedAddresses, setShowSavedAddresses] = React.useState<boolean>(false)

  const handleOnSavedAddressClick = React.useCallback(
    (address: string) => {
      form.setValue("destination", address)
      form.triggerValidation("destination")
      setShowSavedAddresses(false)
    },
    [form]
  )

  const handleContractListClick = React.useCallback(() => {
    setShowSavedAddresses(true)
  }, [])

  const qrReaderAdornment = React.useMemo(
    () => (
      <InputAdornment disableTypography position="end">
        <QRReader onScan={handleQRScan} />
        <AccountBoxIcon onClick={handleContractListClick} style={{ cursor: "pointer" }} />
      </InputAdornment>
    ),
    [handleQRScan, handleContractListClick]
  )

  const destinationInput = React.useMemo(
    () => (
      <TextField
        autoFocus={process.env.PLATFORM !== "ios"}
        disabled={Boolean(preselectedParams?.destination)}
        error={Boolean(form.errors.destination)}
        fullWidth
        inputProps={{
          style: { textOverflow: "ellipsis" }
        }}
        InputProps={{
          endAdornment: !Boolean(preselectedParams?.destination) ? qrReaderAdornment : undefined
        }}
        inputRef={form.register({
          required: t<string>("payment.validation.no-destination"),
          validate: value =>
            isPublicKey(value) ||
            isMuxedAddress(value) ||
            isStellarAddress(value) ||
            t<string>("payment.validation.invalid-destination")
        })}
        label={form.errors.destination ? form.errors.destination.message : t("payment.inputs.destination.label")}
        margin="normal"
        name="destination"
        onChange={event => setValue("destination", event.target.value.trim())}
        placeholder={t("payment.inputs.destination.placeholder")}
      />
    ),
    [form, qrReaderAdornment, preselectedParams, setValue, t]
  )

  const assetSelector = React.useMemo(
    () => (
      <Controller
        as={
          <AssetSelector
            assets={props.accountData.balances}
            disableUnderline
            disabled={Boolean(preselectedParams?.asset)}
            showXLM
            style={{ alignSelf: "center" }}
            testnet={props.testnet}
            value={formValues.asset}
          />
        }
        control={form.control}
        name="asset"
      />
    ),
    [form, formValues.asset, preselectedParams, props.accountData.balances, props.testnet]
  )

  const maxSendButton = React.useMemo(
    () => (
      <ButtonBase
        onClick={() => {
          form.setValue("amount", spendableBalance.toString())
          form.triggerValidation("amount")
        }}
        style={{ fontSize: "inherit", fontWeight: "inherit", textAlign: "inherit" }}
      >
        {t("payment.inputs.price.placeholder")} {formatBalance(spendableBalance.toString())}
      </ButtonBase>
    ),
    [form, spendableBalance, t]
  )

  const priceInput = React.useMemo(
    () => (
      <PriceInput
        assetCode={assetSelector}
        disabled={Boolean(preselectedParams?.amount)}
        error={Boolean(form.errors.amount)}
        inputRef={form.register({
          required: t<string>("payment.validation.no-price"),
          validate: value => {
            if (!form.getValues()["asset"]) {
              return t<string>("payment.validation.asset-missing")
            }
            if (!isValidAmount(value) || FormBigNumber(value).eq(0)) {
              return t<string>("payment.validation.invalid-price")
            } else if (FormBigNumber(value).gt(spendableBalance)) {
              return t<string>("payment.validation.not-enough-funds")
            } else {
              return undefined
            }
          }
        })}
        label={form.errors.amount ? form.errors.amount.message : t("payment.inputs.price.label")}
        margin="normal"
        name="amount"
        placeholder={t("payment.inputs.price.label")}
        helperText={form.getValues()["asset"] ? maxSendButton : null}
        style={{
          flexGrow: isSmallScreen ? 1 : undefined,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230,
          maxWidth: isSmallScreen ? undefined : "60%"
        }}
      />
    ),
    [assetSelector, form, isSmallScreen, preselectedParams, spendableBalance, t]
  )

  const memoInput = React.useMemo(
    () => (
      <TextField
        disabled={Boolean(preselectedParams?.memo)}
        error={Boolean(form.errors.memoValue)}
        inputProps={{ maxLength: 28 }}
        label={form.errors.memoValue ? form.errors.memoValue.message : memoMetadata.label}
        margin="normal"
        name="memoValue"
        inputRef={form.register({
          validate: {
            length: value => value.length <= 28 || t<string>("payment.validation.memo-too-long"),
            memoRequired: value =>
              !memoMetadata.requiredType ||
              !matchingWellknownAccount ||
              value.length > 0 ||
              t<string>(
                "payment.validation.memo-required",
                `Set a memo when sending funds to ${matchingWellknownAccount.name}`,
                {
                  destination: matchingWellknownAccount.name
                }
              ),
            idPattern: value =>
              memoType !== "id" || value.match(/^[0-9]+$/) || t<string>("payment.validation.integer-memo-required")
          }
        })}
        onChange={event => {
          const { value } = event.target
          if (!memoMetadata.requiredType) {
            // only change memo type if no type is required
            const newMemoType = value.length === 0 ? "none" : "text"
            setMemoType(newMemoType)
          }
          setValue("memoValue", value)
        }}
        placeholder={memoMetadata.placeholder}
        style={{
          flexGrow: 1,
          marginLeft: 24,
          marginRight: 24,
          minWidth: 230
        }}
      />
    ),
    [
      form,
      memoType,
      matchingWellknownAccount,
      memoMetadata.label,
      memoMetadata.placeholder,
      memoMetadata.requiredType,
      preselectedParams,
      setValue,
      t
    ]
  )

  const dialogActions = React.useMemo(
    () => (
      <DialogActionsBox desktopStyle={{ marginTop: 64 }}>
        {props.onCancel && (
          <ActionButton icon={<CloseIcon style={{ fontSize: 16 }} />} onClick={props.onCancel}>
            {t("payment.actions.dismiss")}
          </ActionButton>
        )}
        <ActionButton
          form={formID}
          icon={<SendIcon style={{ fontSize: 16 }} />}
          loading={props.txCreationPending}
          onClick={() => undefined}
          type="submit"
        >
          {t("payment.actions.submit")}
        </ActionButton>
      </DialogActionsBox>
    ),
    [formID, props.onCancel, props.txCreationPending, t]
  )

  return (
    <>
      <form id={formID} noValidate onSubmit={form.handleSubmit(handleFormSubmission)}>
        {destinationInput}
        <HorizontalLayout justifyContent="space-between" alignItems="top" margin="0 -24px" wrap="wrap">
          {priceInput}
          {memoInput}
        </HorizontalLayout>
        <Portal target={props.actionsRef.element}>{dialogActions}</Portal>
      </form>
      <Dialog
        open={showSavedAddresses}
        fullScreen
        onClose={() => setShowSavedAddresses(false)}
        TransitionComponent={FullscreenDialogTransition}
      >
        <React.Suspense fallback={<ViewLoading />}>
          <SavedAddressesDialog
            testnet={props.testnet}
            readonly={false}
            onClose={() => setShowSavedAddresses(false)}
            onSelect={handleOnSavedAddressClick}
          />
        </React.Suspense>
      </Dialog>
    </>
  )
})

interface Props {
  accountData: AccountData
  actionsRef: RefStateObject
  openOrdersCount: number
  preselectedParams?: PaymentParams
  testnet: boolean
  trustedAssets: Asset[]
  txCreationPending?: boolean
  onCancel?: () => void
  onSubmit: (createTx: (horizon: Server, account: Account) => Promise<Transaction>) => any
}

function PaymentFormContainer(props: Props) {
  const { lookupFederationRecord } = useFederationLookup()

  const createPaymentTx = async (horizon: Server, account: Account, formValues: ExtendedPaymentFormValues) => {
    const asset = props.trustedAssets.find(trustedAsset => trustedAsset.equals(formValues.asset))
    const federationRecord =
      formValues.destination.indexOf("*") > -1 ? await lookupFederationRecord(formValues.destination) : null
    const destination = federationRecord ? federationRecord.account_id : formValues.destination

    const userMemo = createMemo(formValues.memoType, formValues.memoValue)
    const federationMemo =
      federationRecord && federationRecord.memo && federationRecord.memo_type
        ? new Memo(federationRecord.memo_type as MemoType, federationRecord.memo)
        : Memo.none()

    if (userMemo.type !== "none" && federationMemo.type !== "none") {
      throw CustomError(
        "MemoAlreadySpecifiedError",
        `Cannot set a custom memo. Federation record of ${formValues.destination} already specifies memo.`,
        { destination: formValues.destination }
      )
    }

    const isMultisigTx = props.accountData.signers.length > 1

    const payment = await createPaymentOperation({
      asset: asset || Asset.native(),
      amount: replaceCommaWithDot(formValues.amount),
      destination,
      horizon
    })
    const tx = await createTransaction([payment], {
      accountData: props.accountData,
      memo: federationMemo.type !== "none" ? federationMemo : userMemo,
      minTransactionFee: isMultisigTx ? multisigMinimumFee : 0,
      horizon,
      walletAccount: account
    })
    return tx
  }

  const submitForm = (formValues: ExtendedPaymentFormValues) => {
    props.onSubmit((horizon, account) => createPaymentTx(horizon, account, formValues))
  }

  return <PaymentForm {...props} onSubmit={submitForm} />
}

export default React.memo(PaymentFormContainer)
