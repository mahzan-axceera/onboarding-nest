export interface PostInput {
  title: string;
  bodyText?: string;
  imageUrl?: string;
}

export interface Post {
  id: number;
  title: string
  bodyText?: string
  imageUrl?: string
  authorId: number;
  createdAt: string;
  author: {
    id: number;
    name: string;
    email: string;
  };
}


export interface State {
  posts: Post[];
  searchResults: SearchResult[];
  loading: boolean;
  loadingUpdate: boolean;
  currentPage: number;
  totalPages: number;
  limit: number;
  totalPosts: number;
  isSearchActive: boolean;
  fetchedUserId: number | null;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

export interface SearchResult {
  query: string;
  posts: Post[];
  timestamp: number;
}