import { db } from "../db";
import { getDateDifference } from "../helpers";

export const getSubscription = async (sessionId: string) => {
  const subscriptions = await db.subscription.findMany({
    where: {
      sessionId: sessionId,
    },
  });
  const duration = subscriptions.map((sub) =>
    getDateDifference(sub.createdAt, sub.endedAt),
  );

  const daysLeft = duration.reduce((a, b) => a + b, 0);
  return daysLeft;
};
