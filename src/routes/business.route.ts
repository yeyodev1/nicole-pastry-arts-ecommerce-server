import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  getProductsBySubcategory,
  getAllCategories
} from "../controllers/business.controller";

const router = Router();

/**
 * @route   GET /api/business/products
 * @desc    Get all products from Mercately
 * @access  Public
 * @query   page - Page number for pagination (default: 1)
 */
router.get("/products", getAllProducts);

/**
 * @route   GET /api/business/products/:id
 * @desc    Get a single product by ID from Mercately
 * @access  Public
 * @param   id - Product ID
 */
router.get("/products/:id", getProductById);

/**
 * @route   GET /api/business/products/category/:categoryId
 * @desc    Get products by category from Mercately
 * @access  Public
 * @param   categoryId - Category ID
 * @query   page - Page number for pagination (default: 1)
 */
router.get("/products/category/:categoryId", getProductsByCategory);

/**
 * @route   GET /api/business/products/subcategory/:subcategoryId
 * @desc    Get products by subcategory from Mercately
 * @access  Public
 * @param   subcategoryId - Subcategory ID
 * @query   page - Page number for pagination (default: 1)
 */
router.get("/products/subcategory/:subcategoryId", getProductsBySubcategory);

/**
 * @route   GET /api/business/categories
 * @desc    Get all categories from Mercately
 * @access  Public
 */
router.get("/categories", getAllCategories);

export default router;