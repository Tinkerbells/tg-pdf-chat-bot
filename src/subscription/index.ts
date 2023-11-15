import { SubscriptionPlan } from "@prisma/client";
import { db } from "../db";

export class Subscription {
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  getDuration(plan: SubscriptionPlan) {
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
  }

  getPriceId(plan: SubscriptionPlan) {
    switch (plan) {
      case SubscriptionPlan.ONE_MONTH:
        return 1;
      case SubscriptionPlan.THREE_MONTH:
        return 2;
      case SubscriptionPlan.ONE_YEAR:
        return 3;
      default:
        throw new Error("Invalid subscription price id");
    }
  }

  getDateDifference(start: Date, end: Date) {
    const oneDay = 24 * 60 * 60 * 1000; // in milliseconds
    if (typeof start === "string") {
      start = new Date(start);
    }
    if (typeof end === "string") {
      end = new Date(end);
    }
    const difference = end.getTime() - start.getTime();
    const daysDifference = Math.floor(difference / oneDay);
    return daysDifference;
  }

  getEndDate(plan: SubscriptionPlan) {
    const currentDate = new Date();
    const endedAt = new Date(currentDate);
    const durationInMonths = this.getDuration(plan);
    endedAt.setMonth(endedAt.getMonth() + durationInMonths);
    return endedAt;
  }

  async create(plan: SubscriptionPlan) {
    const priceId = this.getPriceId(plan);
    const endedAt = this.getEndDate(plan);
    try {
      const subscription = await db.subscription.create({
        data: {
          sessionId: this.sessionId,
          priceId: priceId,
          endedAt: endedAt,
        },
      });
      console.log(`Subscription ${subscription.id} created!`);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  private async get() {
    let subscriptions = await db.subscription.findMany({
      where: {
        sessionId: this.sessionId,
      },
    });

    const updatedSubs = subscriptions.filter(async (sub) => {
      const diff = this.getDateDifference(sub.createdAt, sub.endedAt);
      if (diff < 0) {
        await db.subscription.delete({
          where: {
            id: sub.id,
          },
        });
        console.log(`Subscription ${sub.id} has ended`);
        return false;
      }
      return true;
    });

    return updatedSubs;
  }

  async remaining() {
    const subscriptions = await this.get();

    const duration = subscriptions
      .map((sub) => {
        const diff = this.getDateDifference(sub.createdAt, sub.endedAt);
        return diff;
      })
      .reduce((a, b) => a + b, 0);

    return duration;
  }

  async limits() {
    const subscriptions = await this.get();
    const limits = {
      maxFiles: subscriptions[0].maxFiles,
      maxPages: subscriptions[0].maxFiles,
    };
    return limits;
  }

  async isSubscribed() {
    const subscriptions = await this.get();
    return subscriptions.length > 0;
  }
}
