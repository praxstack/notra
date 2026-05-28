import type { ReactNode } from "react";

export interface NotraBlogAuthor {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
}

export interface NotraBlogPost {
  id: string;
  title: string;
  content: string;
  markdown: string;
  recommendations: string | null;
  contentType: string;
  sourceMetadata: null;
  status: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  excerpt: string;
  authors: NotraBlogAuthor[];
}

interface BlogPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description: ReactNode;
}

export interface BlogTimelineItem {
  id: string;
  title: string;
  description: string;
  href: string;
  date: string;
}

interface BlogTimelineProps {
  items: BlogTimelineItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}

interface BlogHtmlArticleProps {
  html: string;
}

export interface BlogEntryPageProps {
  params: Promise<{ slug: string }>;
}

export interface BlogFaqEntry {
  question: string;
  answer: string;
}

export interface BlogJsonLdInput {
  post: NotraBlogPost;
  url: string;
  imageUrl: string;
}

export interface BlogArticleProps {
  html: string;
}
