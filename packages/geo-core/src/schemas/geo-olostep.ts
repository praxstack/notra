import { array, boolean, number, object, string, union } from "zod";

const geoOlostepSourceSchema = object({
  url: string(),
  title: string().nullish(),
  label: string().nullish(),
  text: string().nullish(),
  cited: boolean().nullish(),
});

const geoOlostepQuerySchema = object({ query: string() });

/**
 * Fields shared by Olostep's GEO parsers (ChatGPT, Perplexity, Gemini,
 * Copilot, Google AI Mode). Engine-specific modules are ignored.
 */
export const geoOlostepAnswerSchema = object({
  answer_markdown: string().nullish(),
  inline_references: array(geoOlostepSourceSchema).nullish(),
  sources: array(geoOlostepSourceSchema).nullish(),
  search_model_queries: array(geoOlostepQuerySchema).nullish(),
  network_search_calls: object({
    search_queries: array(geoOlostepQuerySchema).nullish(),
  }).nullish(),
});

export const geoOlostepBatchSchema = object({
  id: string(),
  status: string(),
});

export const geoOlostepBatchItemsSchema = object({
  items: array(object({ custom_id: string(), retrieve_id: string() })),
  cursor: union([number(), string()]).nullish(),
});

export const geoOlostepRetrieveSchema = object({
  json_content: string().nullish(),
});
