export interface AutumnCheckBalance {
  remaining?: number;
  includedGrant?: number;
  prepaidGrant?: number;
  unlimited?: boolean;
}

export interface AutumnCheckResponse {
  allowed?: boolean;
  balance?: AutumnCheckBalance | null;
}

export interface AutumnBalanceCheckResponse {
  allowed?: boolean;
  balance?: {
    unlimited?: boolean;
    remaining?: number;
  } | null;
}
