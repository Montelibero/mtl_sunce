import React from "react"
import { DecodedTransactionResponse } from "./_caches"
import { useLiveRecentTransactions, useOlderTransactions } from "./stellar-subscriptions"

function useFilteredTransactions(
  accountId: string,
  testnet: boolean,
  filter: (txs: DecodedTransactionResponse[]) => DecodedTransactionResponse[]
) {
  const [refetchKey, setRefetchKey] = React.useState<number>(Date.now())
  const limit = 15
  const { transactions, olderTransactionsAvailable } = useLiveRecentTransactions(accountId, testnet, refetchKey)
  const fetchMore = useOlderTransactions(accountId, testnet)
  const txs = React.useMemo(() => filter(transactions), [transactions])

  const fetchMoreTransactions = async (count: number = 0): Promise<void> => {
    if (count >= limit) {
      setRefetchKey(Date.now())
      return
    }
    const unfiltered = await fetchMore()
    const moreTxs = filter(unfiltered)
    return fetchMoreTransactions(count + moreTxs.length)
  }

  React.useEffect(() => {
    if (txs.length < limit) {
      fetchMoreTransactions(txs.length)
    }
  }, [txs])

  return {
    olderTransactionsAvailable,
    transactions: txs,
    fetchMoreTransactions
  }
}

export default useFilteredTransactions
