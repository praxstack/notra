export interface ProductFeature {
  text: string;
  overageText?: string;
  overageTooltip?: string;
}

export interface FeatureData {
  id: string;
  name: string;
  balance: number | null;
  included: number | null;
  unlimited: boolean;
}
