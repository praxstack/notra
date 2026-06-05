import { Neon } from "@notra/ui/components/ui/svgs/neon";
import { Upstash } from "@notra/ui/components/ui/svgs/upstash";
import type { Sponsor } from "~types/sponsors";

export const SPONSORS: Sponsor[] = [
  {
    name: "Upstash",
    url: "https://upstash.com",
    description:
      "Serverless data platform for Redis, Kafka, QStash, and Sandboxes.",
    logo: Upstash,
  },
  {
    name: "Neon",
    url: "https://neon.com",
    description:
      "Serverless Postgres with branching, autoscaling, and bottomless storage.",
    logo: Neon,
  },
];
