export interface PostInput {
  title: string;
  bodyText?: string;
  imageUrl?: string;
}

export interface Post {
  id: string;
  title: string
  bodyText?: string
  imageUrl?: string
  authorId: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
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