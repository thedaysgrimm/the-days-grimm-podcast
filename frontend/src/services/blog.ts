export interface RedditBlogPost {
  id: string;
  title: string;
  selftext: string;
  url: string;
  createdUtc: number;
  author: string;
  flair: string | null;
  thumbnail: string | null;
}

export interface RedditBlogResponse {
  posts: RedditBlogPost[];
  error?: string;
  message?: string;
  debug?: {
    request: { subreddit: string; requiredFlair: string; allowedAuthor: string; limit: number; url: string };
    redditStatus: number;
    totalChildren: number;
    filteredCount: number;
    sample: Array<{ id: string; title: string; flair: string | null; author: string }>;
  };
}

export const fetchRedditBlogPosts = async (limit = 6, options?: { flair?: string; author?: string; debug?: boolean }): Promise<RedditBlogResponse> => {
  const params = new URLSearchParams({ limit: String(limit) });
  if (options?.flair) params.set('flair', options.flair);
  if (options?.author) params.set('author', options.author);
  if (options?.debug) params.set('debug', '1');

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  const response = await fetch(`${apiBase}/api/blog/reddit?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};


