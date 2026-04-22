import type { ReactElement } from "react";

export type FeedbackSentiment = "sad_crying" | "sad" | "happy" | "excited";

export interface FeedbackSentimentOption {
  value: FeedbackSentiment;
  emoji: string;
  label: string;
}

export interface FeedbackContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openFeedback: () => void;
}

export interface FeedbackFormProps {
  onSubmitted?: () => void;
  autoFocus?: boolean;
}

export type FeedbackPopoverSide = "top" | "right" | "bottom" | "left";
export type FeedbackPopoverAlign = "start" | "center" | "end";

export interface FeedbackPopoverProps {
  trigger?: ReactElement;
  side?: FeedbackPopoverSide;
  align?: FeedbackPopoverAlign;
  sharedState?: boolean;
}
