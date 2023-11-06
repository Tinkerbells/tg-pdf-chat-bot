import { SubscriptionPlan } from "@prisma/client";

export const getDuration = (plan: SubscriptionPlan) => {
  switch (plan) {
    case SubscriptionPlan.ONE_MONTH:
      return 1;
    case SubscriptionPlan.THREE_MONTH:
      return 3;
    case SubscriptionPlan.ONE_YEAR:
      return 12;
    default:
      throw new Error("Invalid subscription plan");
  }
};

export const getPriceId = (plan: SubscriptionPlan) => {
  switch (plan) {
    case SubscriptionPlan.ONE_MONTH:
      return 1;
    case SubscriptionPlan.THREE_MONTH:
      return 2;
    case SubscriptionPlan.ONE_YEAR:
      return 4;
    default:
      throw new Error("Invalid subscription plan");
  }
};
