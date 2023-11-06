import { SubscriptionPlan } from "@prisma/client";

export type PayloadType = {
  period: SubscriptionPlan;
  provider_token: string;
};
