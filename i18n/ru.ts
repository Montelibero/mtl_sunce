import AccountSettings from "./locales/ru/account-settings.json"
import Account from "./locales/ru/account.json"
import App from "./locales/ru/app.json"
import AppSettings from "./locales/ru/app-settings.json"
import CreateAccount from "./locales/ru/create-account.json"
import Generic from "./locales/ru/generic.json"
import Operations from "./locales/ru/operations.json"
import Payment from "./locales/ru/payment.json"
import Trading from "./locales/ru/trading.json"
import TransactionRequest from "./locales/ru/transaction-request.json"
import TransferService from "./locales/ru/transfer-service.json"

const translations = {
  "account-settings": AccountSettings,
  account: Account,
  app: App,
  "app-settings": AppSettings,
  "create-account": CreateAccount,
  generic: Generic,
  operations: Operations,
  payment: Payment,
  trading: Trading,
  "transaction-request": TransactionRequest,
  "transfer-service": TransferService
} as const

export default translations
