import { Realtime } from "@upstash/realtime";
import z from "zod/v4";
import { redis } from "./redis";

const schema = {
  ai: { chunk: z.any() as z.ZodType<unknown> },
};

export const realtime = redis ? new Realtime({ schema, redis }) : null;

export type RealtimeSchema = typeof schema;
