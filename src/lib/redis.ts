import Redis from "ioredis";
import { env } from "../env";

export const redis = new Redis({ password: env.REDIS_PASSWORD }); // for defualt localhost:6379
