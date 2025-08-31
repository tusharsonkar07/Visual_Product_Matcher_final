const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image_path: string;
  description: string;
  brand: string;
  available: boolean;
  similarity?: number;
  similarity_percentage?: number;
}

export interface SearchResponse {
  query_id: string;
  results: Product[];
  total_results: number;
  timestamp: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  timestamp: string;
}

export interface CategoriesResponse {
  categories: string[];
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  models_loaded: boolean;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  async searchSimilarProducts(
    file?: File,
    imageUrl?: string,
    topK: number = 11,
    similarityThreshold: number = 0.0
  ): Promise<SearchResponse> {
    const formData = new FormData();
    
    if (file) {
      formData.append('file', file);
    }
    
    if (imageUrl) {
      formData.append('image_url', imageUrl);
    }
    
    formData.append('top_k', topK.toString());
    formData.append('similarity_threshold', similarityThreshold.toString());

    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Search failed' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async getProducts(
    category?: string,
    available?: boolean,
    limit?: number
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    
    if (category && category !== 'All') {
      params.append('category', category);
    }
    
    if (available !== undefined) {
      params.append('available', available.toString());
    }
    
    if (limit) {
      params.append('limit', limit.toString());
    }

    const queryString = params.toString();
    const endpoint = `/api/products${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProductsResponse>(endpoint);
  }

  async getCategories(): Promise<CategoriesResponse> {
    return this.request<CategoriesResponse>('/api/categories');
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/api/health');
  }

  // Utility method to get full image URL
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Handle both static/images/... and images/... paths
    const cleanPath = imagePath.startsWith('static/') ? imagePath : `static/${imagePath}`;
    return `${this.baseUrl}/${cleanPath}`;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Utility functions
export const searchProducts = apiClient.searchSimilarProducts.bind(apiClient);
export const getProducts = apiClient.getProducts.bind(apiClient);
export const getCategories = apiClient.getCategories.bind(apiClient);
export const healthCheck = apiClient.healthCheck.bind(apiClient);
export const getImageUrl = apiClient.getImageUrl.bind(apiClient);