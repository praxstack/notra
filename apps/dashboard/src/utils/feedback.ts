import type { FeedbackSentimentOption } from "@/types/dashboard/feedback";

export const FEEDBACK_SENTIMENT_OPTIONS: FeedbackSentimentOption[] = [
  { value: "sad_crying", emoji: "😢", label: "Very unhappy" },
  { value: "sad", emoji: "🙁", label: "Unhappy" },
  { value: "happy", emoji: "🙂", label: "Happy" },
  { value: "excited", emoji: "😄", label: "Excited" },
];
