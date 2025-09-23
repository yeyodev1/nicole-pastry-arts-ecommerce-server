import type { Request, Response, NextFunction } from "express";
import { HttpStatusCode } from "axios";
import { MercatelyService } from "../services/mercately.service";
import { handleControllerError, createValidationError } from "../utils/error-handler";

// Initialize Mercately service
const mercatelyService = new MercatelyService();

/**
 * Get all products from Mercately
 * @route GET /api/business/products
 * @access Public
 */
export async function getAllProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = 1 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError("Page must be a positive number");
    }

    // Fetch products from Mercately
    const productsResponse = await mercatelyService.getAllProducts(pageNum);

    res.status(HttpStatusCode.Ok).send({
      message: "Products retrieved successfully",
      data: productsResponse.products,
      pagination: {
        currentPage: pageNum,
        totalPages: productsResponse.total_pages,
        hasNextPage: pageNum < productsResponse.total_pages,
        hasPrevPage: pageNum > 1
      }
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get all products");
    return;
  }
}

/**
 * Get a single product by ID from Mercately
 * @route GET /api/business/products/:id
 * @access Public
 */
export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    // Validate product ID
    if (!id || id.trim() === '') {
      throw createValidationError("Product ID is required");
    }

    // Fetch product from Mercately
    const product = await mercatelyService.getProductById(id.trim());

    res.status(HttpStatusCode.Ok).send({
      message: "Product retrieved successfully",
      data: product
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get product by ID");
    return;
  }
}

/**
 * Get products by category from Mercately
 * @route GET /api/business/products/category/:categoryId
 * @access Public
 */
export async function getProductsByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { categoryId } = req.params;
    const { page = 1 } = req.query;

    // Validate category ID
    if (!categoryId || categoryId.trim() === '') {
      throw createValidationError("Category ID is required");
    }

    // Validate pagination parameters
    const pageNum = parseInt(page as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError("Page must be a positive number");
    }

    // Fetch products by category from Mercately
    const productsResponse = await mercatelyService.getProductsByCategory(categoryId.trim(), pageNum);

    res.status(HttpStatusCode.Ok).send({
      message: "Products by category retrieved successfully",
      data: productsResponse.products,
      category: {
        id: categoryId
      },
      pagination: {
        currentPage: pageNum,
        totalPages: productsResponse.total_pages,
        hasNextPage: pageNum < productsResponse.total_pages,
        hasPrevPage: pageNum > 1
      }
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get products by category");
    return;
  }
}

/**
 * Get products by subcategory from Mercately
 * @route GET /api/business/products/subcategory/:subcategoryId
 * @access Public
 */
export async function getProductsBySubcategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { subcategoryId } = req.params;
    const { page = 1 } = req.query;

    // Validate subcategory ID
    if (!subcategoryId || subcategoryId.trim() === '') {
      throw createValidationError("Subcategory ID is required");
    }

    // Validate pagination parameters
    const pageNum = parseInt(page as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw createValidationError("Page must be a positive number");
    }

    // Fetch products by subcategory from Mercately
    const productsResponse = await mercatelyService.getProductsBySubcategory(subcategoryId.trim(), pageNum);

    res.status(HttpStatusCode.Ok).send({
      message: "Products by subcategory retrieved successfully",
      data: productsResponse.products,
      subcategory: {
        id: subcategoryId
      },
      pagination: {
        currentPage: pageNum,
        totalPages: productsResponse.total_pages,
        hasNextPage: pageNum < productsResponse.total_pages,
        hasPrevPage: pageNum > 1
      }
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get products by subcategory");
    return;
  }
}

/**
 * Get all categories from Mercately
 * @route GET /api/business/categories
 * @access Public
 */
export async function getAllCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Fetch categories from Mercately
    const categoriesResponse = await mercatelyService.getAllCategories();

    res.status(HttpStatusCode.Ok).send({
      message: "Categories retrieved successfully",
      data: categoriesResponse.categories
    });
    return;

  } catch (error) {
    handleControllerError(error, res, "Get all categories");
    return;
  }
}