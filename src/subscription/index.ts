import { SubscriptionPlan, Subscription as Sub } from "@prisma/client";
import { db } from "../db";

export class Subscription {
  private plan: SubscriptionPlan;

  constructor(plan?: SubscriptionPlan) {
    this.plan = plan;
  }

  getDuration() {
    switch (this.plan) {
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

  getPriceId() {
    switch (this.plan) {
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

  getEndDate() {
    const currentDate = new Date();
    const endedAt = new Date(currentDate);
    const durationInMonths = this.getDuration();
    endedAt.setMonth(endedAt.getMonth() + durationInMonths);
    return endedAt;
  }

  async create(id: string) {
    const priceId = this.getPriceId();
    const endedAt = this.getEndDate();
    try {
      const subscription = await db.subscription.create({
        data: {
          sessionId: id,
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

  private async get(id: string) {
    let subscriptions = await db.subscription.findMany({
      where: {
        sessionId: id,
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

  async remaining(id: string) {
    const subscriptions = await this.get(id);

    const duration = subscriptions
      .map((sub) => {
        const diff = this.getDateDifference(sub.createdAt, sub.endedAt);
        return diff;
      })
      .reduce((a, b) => a + b, 0);

    return duration;
  }

  async isSubscribed(id: string) {
    const subscriptions = await this.get(id);
    return subscriptions.length > 0;
  }
}
