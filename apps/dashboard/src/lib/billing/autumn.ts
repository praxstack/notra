import { Autumn } from "autumn-js";

const AUTUMN_SECRET_KEY = process.env.AUTUMN_SECRET_KEY;

export const autumn = AUTUMN_SECRET_KEY
  ? new Autumn({ secretKey: AUTUMN_SECRET_KEY })
  : null;

export async function ensureAutumnCustomer(params: {
  customerId: string;
  name?: string | null;
  email?: string | null;
  metadata?: Record<string, string>;
}) {
  if (!autumn) {
    return;
  }

  await autumn.customers.getOrCreate({
    customerId: params.customerId,
    ...(params.name ? { name: params.name } : {}),
    ...(params.email ? { email: params.email } : {}),
    ...(params.metadata ? { metadata: params.metadata } : {}),
  });
}
