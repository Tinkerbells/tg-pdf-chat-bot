import axios from "axios";
import { env } from "../env";

interface Amount {
  currencyCode: string;
  amount: string;
}

interface Payload {
  amount: Amount;
  description: string;
  externalId: string;
  timeoutSeconds: number;
  customerTelegramUserId: string;
  returnUrl: string;
  failReturnUrl: string;
}
interface ApiResponseData {
  payLink: string;
}

interface ApiResponse {
  status: string;
  data: ApiResponseData;
}

export const getPayLink = async () => {
  const headers = {
    "Wpay-Store-Api-Key": env.WALLET_API_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const payload: Payload = {
    amount: { currencyCode: "USD", amount: "1.00" },
    description: "Goods and service.",
    externalId: "XXX-YYY-ZZZ",
    timeoutSeconds: 60 * 60 * 24,
    customerTelegramUserId: "999666999",
    returnUrl: "https://t.me/pdf_ai_chat_bot",
    failReturnUrl: "https://t.me/wallet",
  };

  try {
    const response = await axios<ApiResponse>({
      url: "https://pay.wallet.tg/wpay/store-api/v1/order",
      method: "post",
      headers: headers,
      data: payload,
      // timeout: 10000, // timeout in milliseconds
    });

    const data = response.data;

    if (
      response.status !== 200 ||
      ["SUCCESS", "ALREADY"].includes(data["status"])
    ) {
      console.warn("# code: %d, json: ", response.status, data);
      return "";
    }

    return data["data"]["payLink"];
  } catch (error) {
    // handle error here if needed
    console.log(error);
    return "";
  }
};
