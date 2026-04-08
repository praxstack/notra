import type { ReactElement } from "react";

export interface OwnedOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  memberCount: number;
  nextOwnerCandidate: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

export interface TransferDecision {
  orgId: string;
  action: "transfer" | "delete";
}

export interface DeleteAccountDialogProps {
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
