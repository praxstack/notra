export interface PostSummary {
  postId: string;
  title: string;
  recommendations: string | null;
}

export interface PostToolConfig {
  organizationId: string;
}
