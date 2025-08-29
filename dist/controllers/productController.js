"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProductsByCategory = exports.removeProduct = exports.updateProduct = exports.getProductById = exports.addProduct = void 0;
const db_1 = require("../db");
const addProduct = async (req, res) => {
    const { name, category, description, price, images, stock } = req.body;
    if (!name || !category || !description || !price) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    try {
        const product = await db_1.prisma.product.create({
            data: {
                id: require('crypto').randomUUID(),
                name,
                category,
                description,
                price,
                images: images || [],
                stock: stock !== null && stock !== void 0 ? stock : 0,
            },
        });
        res.status(201).json({ message: 'Product added', id: product.id });
    }
    catch (error) {
        res.status(500).json({ error: 'Database error', details: error.message });
    }
};
exports.addProduct = addProduct;
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await db_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        res.status(500).json({ error: 'Database error', details: error.message });
    }
};
exports.getProductById = getProductById;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, category, description, price, images, stock } = req.body;
    try {
        const data = {};
        if (name)
            data.name = name;
        if (category)
            data.category = category;
        if (description)
            data.description = description;
        if (price)
            data.price = price;
        if (images)
            data.images = images;
        if (stock)
            data.stock = stock;
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }
        const product = await db_1.prisma.product.update({
            where: { id },
            data,
        });
        res.json({ message: 'Product updated' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Database error', details: error.message });
    }
};
exports.updateProduct = updateProduct;
const removeProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await db_1.prisma.product.delete({
            where: { id },
        });
        res.json({ message: 'Product removed' });
    }
    catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.status(500).json({ error: 'Database error', details: error.message });
    }
};
exports.removeProduct = removeProduct;
const searchProductsByCategory = async (req, res) => {
    const { category, name, limit = '50', skip = '0' } = req.query;
    // Validate limit and skip
    if (typeof limit !== 'string' || isNaN(parseInt(limit)) || parseInt(limit) < 0) {
        return res.status(400).json({ error: 'Invalid limit parameter' });
    }
    if (typeof skip !== 'string' || isNaN(parseInt(skip)) || parseInt(skip) < 0) {
        return res.status(400).json({ error: 'Invalid skip parameter' });
    }
    try {
        let whereClause = {};
        // Enhanced search logic
        if (category && category !== 'All') {
            // Handle category search with smart matching
            const categoryLower = category.toLowerCase();
            // Map common search terms to actual categories
            const categoryMap = {
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
            const mappedCategories = categoryMap[categoryLower] || [category];
            if (mappedCategories.length > 1) {
                // Multiple categories - use OR condition
                whereClause.OR = mappedCategories.map(cat => ({ category: cat }));
            }
            else {
                whereClause.category = mappedCategories[0];
            }
        }
        // Handle name search with partial matching
        if (name && name.trim()) {
            const searchTerm = name.trim();
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
            }
            else {
                whereClause.OR = nameSearchConditions;
            }
        }
        // If no search criteria, return all products
        if (Object.keys(whereClause).length === 0) {
            whereClause = {};
        }
        const products = await db_1.prisma.product.findMany({
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
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed', details: error.message });
    }
};
exports.searchProductsByCategory = searchProductsByCategory;
