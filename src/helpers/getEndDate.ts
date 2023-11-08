import { SubscriptionPlan } from "@prisma/client";
import { getDuration } from "./getSubscriptionInfo";

export const getEndDate = (period: SubscriptionPlan) => {
  const currentDate = new Date();
  const endedAt = new Date(currentDate);
  const durationInMonths = getDuration(period);
  endedAt.setMonth(endedAt.getMonth() + durationInMonths);
  return endedAt;
};
