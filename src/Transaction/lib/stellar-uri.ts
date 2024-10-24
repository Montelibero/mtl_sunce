import i18next from "../../App/i18n"
import { parseStellarUri } from "@stellarguard/stellar-uri"
import { CustomError } from "~Generic/lib/errors"

export interface VerificationOptions {
  allowUnsafeTestnetURIs?: boolean
}

export async function verifyTransactionRequest(request: string, options: VerificationOptions = {}) {
  const parsedURI = parseStellarUri(request)
  const isSignatureValid = await parsedURI.verifySignature()

  if (!isSignatureValid) {
    if (parsedURI.isTestNetwork && options.allowUnsafeTestnetURIs) {
      // ignore
    } else {
      throw CustomError("StellarUriVerificationError", i18next.t("stellar-uri-verification-error"))
    }
  }

  return parsedURI
}
