import { SubscriptionPlan } from "@prisma/client";

export type ProviderType = {
  name: string;
  token: string;
};

export type PayloadType = {
  period: SubscriptionPlan;
  provider: ProviderType;
};
