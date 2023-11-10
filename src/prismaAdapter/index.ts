import { type StorageAdapter } from "grammy";
import { type SessionDelegate } from "../types/session";

export * from "../types/session";

export class PrismaAdapter<T> implements StorageAdapter<T> {
  private sessionDelegate: SessionDelegate;

  constructor(repository: SessionDelegate) {
    this.sessionDelegate = repository;
  }

  async read(key: string) {
    const session = await this.sessionDelegate.findUnique({
      where: { id: key },
    });
    return session?.value ? (JSON.parse(session.value) as T) : undefined;
  }

  async write(key: string, data: T) {
    const value = JSON.stringify(data);
    await this.sessionDelegate.upsert({
      where: { id: key },
      create: { id: key, value },
      update: { value },
    });
  }

  async delete(key: string) {
    await this.sessionDelegate.delete({ where: { id: key } }).catch((err) => {
      // Record does not exist in database
      if (err?.code === "P2025") return;
      return Promise.reject(err);
    });
  }
}
