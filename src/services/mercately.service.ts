import 'dotenv/config'
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createEmailServiceError } from '../utils/error-handler';

// TypeScript interfaces for Mercately API responses
export interface MercatelyCategory {
  web_id: string;
  name: string;
  description?: string;
  products_count?: number;
  active_products_count?: number;
  subcategories?: MercatelySubcategory[];
}

export interface MercatelySubcategory {
  web_id: string;
  name: string;
  description?: string;
  products_count?: number;
  active_products_count?: number;
}

export interface MercatelyProduct {
  web_id: string;
  title: string;
  description: string;
  quantity: number;
  price: string;
  active: boolean;
  deleted: boolean;
  url: string | null;
  sku: string;
  images: string[];
  subcategory: MercatelySubcategory;
  category: MercatelyCategory;
}

export interface MercatelyProductsResponse {
  products: MercatelyProduct[];
  total_pages: number;
}

export interface MercatelyCreateProductRequest {
  product: {
    title: string;
    description: string;
    sku: string;
    quantity: number;
    active: string;
    image_urls: string[];
    subcategory_id: string;
    price: number;
  };
}

export interface MercatelyUpdateProductRequest {
  product: {
    title?: string;
    description?: string;
    sku?: string;
    quantity?: number;
    active?: string;
    image_urls?: string[];
    subcategory_id?: string;
    price?: number;
  };
}

export interface MercatelyApiResponse<T> {
  message?: string;
  product?: T;
}

export interface MercatelyCategoriesResponse {
  categories: MercatelyCategory[];
}

export class MercatelyService {
  private readonly apiClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string = 'https://app.mercately.shop/api/v1';

  constructor() {
    this.apiKey = process.env.MERCATELY_API_KEY!;
    
    if (!this.apiKey) {
      throw new Error('MERCATELY_API_KEY environment variable is required');
    }

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Get all products from Mercately store
   * @param page - Page number for pagination (optional)
   * @returns Promise with products list and pagination info
   */
  async getAllProducts(page?: number): Promise<MercatelyProductsResponse> {
    try {
      const params = page ? { page } : {};
      const response: AxiosResponse<MercatelyProductsResponse> = await this.apiClient.get('/products', { params });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching products from Mercately:', error.response?.data || error.message);
      throw createEmailServiceError('Failed to fetch products from Mercately API');
    }
  }

  /**
   * Get a single product by its web_id
   * @param productId - The web_id of the product
   * @returns Promise with single product data
   */
  async getProductById(productId: string): Promise<MercatelyProduct> {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Product ID is required and must be a string');
      }

      const response: AxiosResponse<MercatelyProduct> = await this.apiClient.get(`/products/${productId}`);
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching product ${productId} from Mercately:`, error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      throw createEmailServiceError(`Failed to fetch product ${productId} from Mercately API`);
    }
  }

  /**
   * Create a new product in Mercately store
   * @param productData - Product data to create
   * @returns Promise with created product data
   */
  async createProduct(productData: MercatelyCreateProductRequest): Promise<MercatelyProduct> {
    try {
      const response: AxiosResponse<MercatelyApiResponse<MercatelyProduct>> = await this.apiClient.post('/products', productData);
      
      if (!response.data.product) {
        throw new Error('Invalid response from Mercately API');
      }
      
      return response.data.product;
    } catch (error: any) {
      console.error('Error creating product in Mercately:', error.response?.data || error.message);
      throw createEmailServiceError('Failed to create product in Mercately API');
    }
  }

  /**
   * Update an existing product in Mercately store
   * @param productId - The web_id of the product to update
   * @param productData - Product data to update
   * @returns Promise with updated product data
   */
  async updateProduct(productId: string, productData: MercatelyUpdateProductRequest): Promise<MercatelyProduct> {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Product ID is required and must be a string');
      }

      const response: AxiosResponse<MercatelyApiResponse<MercatelyProduct>> = await this.apiClient.put(`/products/${productId}`, productData);
      
      if (!response.data.product) {
        throw new Error('Invalid response from Mercately API');
      }
      
      return response.data.product;
    } catch (error: any) {
      console.error(`Error updating product ${productId} in Mercately:`, error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      throw createEmailServiceError(`Failed to update product ${productId} in Mercately API`);
    }
  }

  /**
   * Delete a product from Mercately store (soft delete)
   * @param productId - The web_id of the product to delete
   * @returns Promise with deleted product data
   */
  async deleteProduct(productId: string): Promise<MercatelyProduct> {
    try {
      if (!productId || typeof productId !== 'string') {
        throw new Error('Product ID is required and must be a string');
      }

      const response: AxiosResponse<MercatelyApiResponse<MercatelyProduct>> = await this.apiClient.delete(`/products/${productId}`);
      
      if (!response.data.product) {
        throw new Error('Invalid response from Mercately API');
      }
      
      return response.data.product;
    } catch (error: any) {
      console.error(`Error deleting product ${productId} from Mercately:`, error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      throw createEmailServiceError(`Failed to delete product ${productId} from Mercately API`);
    }
  }

  /**
   * Get products filtered by category
   * @param categoryId - The web_id of the category
   * @param page - Page number for pagination (optional)
   * @returns Promise with filtered products list
   */
  async getProductsByCategory(categoryId: string, page?: number): Promise<MercatelyProductsResponse> {
    try {
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Category ID is required and must be a string');
      }

      // Since Mercately API doesn't support filtering by category directly,
      // we need to fetch all products and filter them locally
      let allProducts: MercatelyProduct[] = [];
      let currentPage = 1;
      let totalPages = 1;

      // Fetch all products from all pages
      do {
        const response: AxiosResponse<MercatelyProductsResponse> = await this.apiClient.get('/products', { 
          params: { page: currentPage } 
        });
        
        allProducts = allProducts.concat(response.data.products);
        totalPages = response.data.total_pages;
        currentPage++;
      } while (currentPage <= totalPages);

      // Filter products by category
      const filteredProducts = allProducts.filter(product => 
        product.category && product.category.web_id === categoryId
      );

      // Apply pagination to filtered results
      const itemsPerPage = 20; // Default pagination size
      const startIndex = page ? (page - 1) * itemsPerPage : 0;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
      const filteredTotalPages = Math.ceil(filteredProducts.length / itemsPerPage);

      return {
        products: paginatedProducts,
        total_pages: filteredTotalPages
      };
    } catch (error: any) {
      console.error(`Error fetching products by category ${categoryId} from Mercately:`, error.response?.data || error.message);
      throw createEmailServiceError(`Failed to fetch products by category ${categoryId} from Mercately API`);
    }
  }

  /**
   * Get products filtered by subcategory
   * @param subcategoryId - The web_id of the subcategory
   * @param page - Page number for pagination (optional)
   * @returns Promise with filtered products list
   */
  async getProductsBySubcategory(subcategoryId: string, page?: number): Promise<MercatelyProductsResponse> {
    try {
      if (!subcategoryId || typeof subcategoryId !== 'string') {
        throw new Error('Subcategory ID is required and must be a string');
      }

      const params = { subcategory_id: subcategoryId, ...(page && { page }) };
      const response: AxiosResponse<MercatelyProductsResponse> = await this.apiClient.get('/products', { params });
      
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching products by subcategory ${subcategoryId} from Mercately:`, error.response?.data || error.message);
      throw createEmailServiceError(`Failed to fetch products by subcategory ${subcategoryId} from Mercately API`);
    }
  }

  /**
   * Get all categories from Mercately store
   * @returns Promise with categories list
   */
  async getAllCategories(): Promise<MercatelyCategoriesResponse> {
    try {
      const response: AxiosResponse<MercatelyCategoriesResponse> = await this.apiClient.get('/categories');
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching categories from Mercately:', error.response?.data || error.message);
      throw createEmailServiceError('Failed to fetch categories from Mercately API');
    }
  }
}