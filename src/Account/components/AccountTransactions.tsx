import React from "react"
import { useTranslation } from "react-i18next"
import DoneAllIcon from "@material-ui/icons/DoneAll"
import CreditCardIcon from "@material-ui/icons/CreditCard"
import UpdateIcon from "@material-ui/icons/Update"
import { Account } from "~App/contexts/accounts"
import { SettingsContext } from "~App/contexts/settings"
import { SignatureDelegationContext } from "~App/contexts/signatureDelegation"
import { useHorizonURLs } from "~Generic/hooks/stellar"
import { useLiveAccountData } from "~Generic/hooks/stellar-subscriptions"
import { useIsMobile, useRouter } from "~Generic/hooks/userinterface"
import { useLoadingState } from "~Generic/hooks/util"
import { DecodedTransactionResponse } from "~Generic/hooks/_caches"
import useFilteredTransactions from "~Generic/hooks/useFilteredTransactions"
import * as routes from "~App/routes"
import MainSelectionButton from "~Generic/components/MainSelectionButton"
import { VerticalLayout } from "~Layout/components/Box"
import FriendbotButton from "./FriendbotButton"
import OfferList from "./OfferList"
import { InteractiveSignatureRequestList } from "./SignatureRequestList"
import TransactionList from "./TransactionList"
import { isDustTransaction } from "~Generic/lib/transaction"

const excludeClaimableFilter = (tx: DecodedTransactionResponse) =>
  !tx.decodedTx.operations.every(o => o.type === "createClaimableBalance" || o.type === "claimClaimableBalance")

const excludeDustFilter = (account: Account, tx: DecodedTransactionResponse) =>
  !isDustTransaction(tx.decodedTx, account)

function PendingMultisigTransactions(props: { account: Account }) {
  const { pendingSignatureRequests } = React.useContext(SignatureDelegationContext)
  const { t } = useTranslation()

  const cosignIcon = React.useMemo(() => <DoneAllIcon />, [])
  const waitingIcon = React.useMemo(() => <UpdateIcon style={{ opacity: 0.5 }} />, [])

  const pendingRequestsToCosign = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request.status !== "submitted" &&
        request.signers.some(signer => signer === props.account.publicKey) &&
        request.signed_by.indexOf(props.account.publicKey) === -1
    )
  }, [props.account, pendingSignatureRequests])

  const pendingRequestsWaitingForOthers = React.useMemo(() => {
    return pendingSignatureRequests.filter(
      request =>
        request.status !== "submitted" &&
        request.signers.some(signer => signer === props.account.publicKey) &&
        request.signed_by.indexOf(props.account.publicKey) > -1
    )
  }, [props.account, pendingSignatureRequests])

  return (
    <>
      <InteractiveSignatureRequestList
        account={props.account}
        icon={cosignIcon}
        signatureRequests={pendingRequestsToCosign}
        title={t("account.transactions.signature-request-list.title.requests-to-cosign")}
      />
      <InteractiveSignatureRequestList
        account={props.account}
        icon={waitingIcon}
        signatureRequests={pendingRequestsWaitingForOthers}
        title={t("account.transactions.signature-request-list.title.requests-waiting-for-others")}
      />
    </>
  )
}

function AccountTransactions(props: { account: Account }) {
  const { account } = props
  const { showDust, showClaimableBalanceTxs } = React.useContext(SettingsContext)
  const { t } = useTranslation()
  const accountData = useLiveAccountData(account.accountID, account.testnet)
  const horizonURLs = useHorizonURLs(account.testnet)
  const isSmallScreen = useIsMobile()
  const [moreTxsLoadingState, handleMoreTxsFetch] = useLoadingState()

  const txsFilter = React.useCallback(
    (txs: DecodedTransactionResponse[]) =>
      txs.filter(tx => {
        return (showClaimableBalanceTxs || excludeClaimableFilter(tx)) && (showDust || excludeDustFilter(account, tx))
      }),
    []
  )

  const { transactions, olderTransactionsAvailable, fetchMoreTransactions } = useFilteredTransactions(
    account.accountID,
    account.testnet,
    txsFilter
  )

  const router = useRouter()
  const settings = React.useContext(SettingsContext)

  const handleFetchMoreTransactions = React.useCallback(() => handleMoreTxsFetch(fetchMoreTransactions()), [
    fetchMoreTransactions,
    handleMoreTxsFetch
  ])

  const navigateToDeposit = React.useCallback(() => router.history.push(routes.depositAsset(account.id)), [
    account,
    router
  ])

  return (
    <>
      {accountData.balances.length > 0 ? (
        <>
          {settings.multiSignature ? <PendingMultisigTransactions account={account} /> : null}
          <OfferList account={account} title={t("account.transactions.offer-list.title")} />
          <TransactionList
            account={account}
            background="transparent"
            loadingMoreTransactions={moreTxsLoadingState.type === "pending"}
            olderTransactionsAvailable={olderTransactionsAvailable}
            onFetchMoreTransactions={handleFetchMoreTransactions}
            title={t("account.transactions.transaction-list.title")}
            transactions={transactions}
          />
        </>
      ) : (
        <>
          <VerticalLayout
            alignItems="stretch"
            margin="0 auto"
            style={{ padding: isSmallScreen ? "16px 28px" : "32px 28px", width: "fit-content" }}
          >
            {account.testnet ? (
              <FriendbotButton
                horizonURL={horizonURLs[0]}
                publicKey={account.publicKey}
                style={{ marginBottom: isSmallScreen ? 16 : 32 }}
              />
            ) : null}
            <MainSelectionButton
              Icon={CreditCardIcon}
              description={t("account.transactions.action.navigate-to-deposit.description")}
              label={t("account.transactions.action.navigate-to-deposit.label")}
              onClick={navigateToDeposit}
            />
          </VerticalLayout>
        </>
      )}
    </>
  )
}

export default React.memo(AccountTransactions)
