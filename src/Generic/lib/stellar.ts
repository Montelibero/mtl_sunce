import BigNumber from "big.js"
import fetch from "isomorphic-fetch"
import {
  xdr,
  Asset,
  Horizon,
  Keypair,
  NotFoundError,
  Server,
  Transaction,
  LiquidityPoolAsset,
  getLiquidityPoolId
} from "stellar-sdk"
import { OfferAsset } from "stellar-sdk/lib/types/offer"
import { AssetRecord } from "../hooks/stellar-ecosystem"
import { AccountData, BalanceLine } from "./account"

const MAX_INT64 = "9223372036854775807"

// Used as a fallback if fetching the friendbot href from horizon fails
const SDF_FRIENDBOT_HREF = "https://friendbot.stellar.org/{?addr}"

const dedupe = <T>(array: T[]) => Array.from(new Set(array))

// FIXME: Needs to be queried from horizon
export const BASE_RESERVE = 0.5

export const networkPassphrases = {
  mainnet: "Public Global Stellar Network ; September 2015",
  testnet: "Test SDF Network ; September 2015"
}

export function getAllSources(tx: Transaction) {
  return dedupe([
    tx.source,
    ...(tx.operations.map(operation => operation.source).filter(source => Boolean(source)) as string[])
  ])
}

// FIXME: Wait for proper solution in stellar-sdk: <https://github.com/stellar/js-stellar-sdk/pull/403>
export function isNotFoundError(error: any): error is NotFoundError {
  return (
    (error && error instanceof Error && error.message === "Request failed with status code 404") ||
    (error.response && error.response.status === 404)
  )
}

export function balancelineToAsset(balanceline: BalanceLine): Asset {
  return balanceline.asset_type === "native"
    ? Asset.native()
    : new Asset(balanceline.asset_code, balanceline.asset_issuer)
}

/** Reversal of stringifyAsset() */
export function parseAssetID(assetID: string) {
  if (assetID === "XLM") {
    return Asset.native()
  } else {
    const [issuer, code] = assetID.split(":")
    return new Asset(code, issuer)
  }
}

export function getLiquidityPoolIdFromAsset(asset: Pick<LiquidityPoolAsset, "assetA" | "assetB" | "fee">) {
  const poolId = getLiquidityPoolId("constant_product", {
    assetA: asset.assetA,
    assetB: asset.assetB,
    fee: asset.fee
  }).toString("hex")
  return poolId
}

export function stringifyAssetToReadableString(asset: Asset | LiquidityPoolAsset) {
  if (asset instanceof Asset) {
    return asset.isNative() ? "XLM" : asset.getCode()
  } else {
    return `Liquidity Pool '${asset.assetA.code} <-> ${asset.assetB.code}'`
  }
}

export function stringifyAsset(assetOrTrustline: Asset | BalanceLine) {
  if (assetOrTrustline instanceof Asset) {
    const asset: Asset = assetOrTrustline
    return asset.isNative() ? "XLM" : `${asset.getIssuer()}:${asset.getCode()}`
  } else {
    const line: BalanceLine = assetOrTrustline
    return line.asset_type === "native" ? "XLM" : `${line.asset_issuer}:${line.asset_code}`
  }
}

export async function friendbotTopup(horizonURL: string, publicKey: string) {
  const horizonMetadata = await (await fetch(horizonURL)).json()
  const templatedFriendbotHref = horizonMetadata._links.friendbot.href || SDF_FRIENDBOT_HREF
  const friendBotHref = templatedFriendbotHref.replace(/\{\?.*/, "")

  const response = await fetch(friendBotHref + `?addr=${publicKey}`)
  return response.json()
}

export function getAccountMinimumBalance(accountData: Pick<AccountData, "subentry_count">) {
  return BigNumber(2) // 2 accounts for base reserve and signer reserve from own account
    .add(accountData.subentry_count)
    .mul(BASE_RESERVE)
}

export function getSpendableBalance(accountMinimumBalance: BigNumber, balanceLine?: BalanceLine) {
  if (balanceLine !== undefined) {
    const fullBalance = BigNumber(balanceLine.balance)
    return balanceLine.asset_type === "native"
      ? fullBalance.minus(accountMinimumBalance).minus(balanceLine.selling_liabilities)
      : fullBalance.minus(balanceLine.selling_liabilities)
  } else {
    return BigNumber(0)
  }
}

export function getAssetsFromBalances(balances: BalanceLine[]) {
  return balances.map(balance =>
    balance.asset_type === "native"
      ? Asset.native()
      : new Asset((balance as Horizon.BalanceLineAsset).asset_code, (balance as Horizon.BalanceLineAsset).asset_issuer)
  )
}

export function findMatchingBalanceLine(balances: AccountData["balances"], asset?: Asset): BalanceLine | undefined {
  if (!asset) return undefined
  return balances.find((balance): balance is BalanceLine => balancelineToAsset(balance).equals(asset))
}

export function getHorizonURL(horizon: Server) {
  return horizon.serverURL.toString()
}

export function isSignedByAnyOf(signature: xdr.DecoratedSignature, publicKeys: string[]) {
  return publicKeys.some(publicKey => signatureMatchesPublicKey(signature, publicKey))
}

export function offerAssetToAsset(offerAsset: OfferAsset) {
  return offerAsset.asset_type === "native"
    ? Asset.native()
    : new Asset(offerAsset.asset_code as string, offerAsset.asset_issuer as string)
}

export function assetRecordToAsset(assetRecord: AssetRecord) {
  return assetRecord.issuer === "native" ? Asset.native() : new Asset(assetRecord.code, assetRecord.issuer)
}

export function signatureMatchesPublicKey(signature: xdr.DecoratedSignature, publicKey: string): boolean {
  const keypair = Keypair.fromPublicKey(publicKey)

  return signature.hint().equals(keypair.signatureHint())
}

export function trustlineLimitEqualsUnlimited(limit: string | number) {
  return String(limit).replace(".", "") === MAX_INT64
}
