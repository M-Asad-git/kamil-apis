import { Request, Response } from 'express';
import { prisma } from '../db';
import { Product, Category } from '../types';

export const addProduct = async (req: Request, res: Response) => {
  const { name, category, description, price, images, stock }: Product = req.body;

  if (!name || !category || !description || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        id: require('crypto').randomUUID(),
        name,
        category,
        description,
        price,
        images: images || [],
        stock: stock ?? 0,
      },
    });
    res.status(201).json({ message: 'Product added', id: product.id });
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: (error as Error).message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) { return res.status(404).json({ error: 'Product not found' }); }
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Database error', details: (error as Error).message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, description, price, images,stock }: Partial<Product> = req.body;

  try {
    const data: Partial<Product> = {};
    if (name) data.name = name;
    if (category) data.category = category;
    if (description) data.description = description;
    if (price) data.price = price;
    if (images) data.images = images;
    if (stock) data.stock = stock;
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });
    res.json({ message: 'Product updated' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Database error', details: (error as Error).message });
  }
};

export const removeProduct = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.product.delete({
      where: { id },
    });
    res.json({ message: 'Product removed' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(500).json({ error: 'Database error', details: (error as Error).message });
  }
};

export const searchProductsByCategory = async (req: Request, res: Response) => {
  const { category, name, limit = '50', skip = '0' } = req.query;

  // Validate limit and skip
  if (typeof limit !== 'string' || isNaN(parseInt(limit)) || parseInt(limit) < 0) {
    return res.status(400).json({ error: 'Invalid limit parameter' });
  }
  if (typeof skip !== 'string' || isNaN(parseInt(skip)) || parseInt(skip) < 0) {
    return res.status(400).json({ error: 'Invalid skip parameter' });
  }

  try {
    let whereClause: any = {};
    
    // Enhanced search logic
    if (category && category !== 'All') {
      // Handle category search with smart matching
      const categoryLower = (category as string).toLowerCase();
      
      // Map common search terms to actual categories
      const categoryMap: { [key: string]: string[] } = {
        'laptop': ['Laptops'],
        'laptops': ['Laptops'],
        'notebook': ['Laptops'],
        'notebooks': ['Laptops'],
        'ultrabook': ['Laptops'],
        'ultrabooks': ['Laptops'],
        'desktop': ['Desktops'],
        'desktops': ['Desktops'],
        'pc': ['Desktops'],
        'computer': ['Desktops', 'Laptops'],
        'computers': ['Desktops', 'Laptops'],
        'accessory': ['Accessories'],
        'accessories': ['Accessories'],
        'mouse': ['Accessories'],
        'keyboard': ['Accessories'],
        'monitor': ['Accessories'],
        'headphone': ['Accessories'],
        'headphones': ['Accessories'],
        'gaming': ['Laptops', 'Desktops', 'Accessories'],
        'gamer': ['Laptops', 'Desktops', 'Accessories'],
        'professional': ['Laptops', 'Desktops'],
        'workstation': ['Desktops'],
        'business': ['Laptops', 'Desktops'],
        'student': ['Laptops', 'Desktops'],
        'home': ['Laptops', 'Desktops', 'Accessories'],
        'office': ['Laptops', 'Desktops', 'Accessories']
      };
      
      // Check if search term maps to specific categories
      const mappedCategories = categoryMap[categoryLower] || [category as string];
      
      if (mappedCategories.length > 1) {
        // Multiple categories - use OR condition
        whereClause.OR = mappedCategories.map(cat => ({ category: cat }));
      } else {
        whereClause.category = mappedCategories[0];
      }
    }
    
    // Handle name search with partial matching
    if (name && (name as string).trim()) {
      const searchTerm = (name as string).trim();
      
      // Create OR conditions for comprehensive search
      const nameSearchConditions = [
        // Exact name match (highest priority)
        { name: { equals: searchTerm, mode: 'insensitive' } },
        // Contains search term
        { name: { contains: searchTerm, mode: 'insensitive' } },
        // Contains search term in description
        { description: { contains: searchTerm, mode: 'insensitive' } },
        // Starts with search term
        { name: { startsWith: searchTerm, mode: 'insensitive' } },
        // Ends with search term
        { name: { endsWith: searchTerm, mode: 'insensitive' } }
      ];
      
      // If we also have category filter, combine them
      if (whereClause.category || whereClause.OR) {
        const categoryFilter = whereClause.category || whereClause.OR;
        whereClause = {
          AND: [
            { OR: nameSearchConditions },
            { OR: Array.isArray(categoryFilter) ? categoryFilter.map(cat => ({ category: cat })) : [{ category: categoryFilter }] }
          ]
        };
      } else {
        whereClause.OR = nameSearchConditions;
      }
    }
    
    // If no search criteria, return all products
    if (Object.keys(whereClause).length === 0) {
      whereClause = {};
    }
    
    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: [
        // Prioritize exact matches first
        { name: 'asc' },
        { created_at: 'desc' }
      ],
      take: parseInt(limit),
      skip: parseInt(skip)
    });
    
    res.json(products);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: (error as Error).message });
  }
};