import type { CliAuthOrganization } from "./poll";

export interface CliAuthFormProps {
  sessionId: string;
  organizations: CliAuthOrganization[];
}
