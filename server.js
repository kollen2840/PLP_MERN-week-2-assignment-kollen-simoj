require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.json());

// Custom logger middleware
const loggerMiddleware = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
};

app.use(loggerMiddleware);

// Product validation middleware
const validateProduct = (req, res, next) => {
    const { name, description, price, category, inStock } = req.body;
    
    if (!name || !description || !price || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number' });
    }
    
    if (typeof inStock !== 'boolean') {
        return res.status(400).json({ error: 'inStock must be a boolean' });
    }
    
    next();
};

// Products data store
let products = [
    {
        id: uuid.v4(),
        name: 'Laptop',
        description: 'High-performance laptop',
        price: 999.99,
        category: 'Electronics',
        inStock: true
    }
];

// Routes
app.get('/', (req, res) => {
    res.send('Hello WELCOME!');
});

// Get all products with filtering and pagination
app.get('/api/products', (req, res) => {
    let result = [...products];
    
    // Filter by category
    if (req.query.category) {
        result = result.filter(p => p.category.toLowerCase() === req.query.category.toLowerCase());
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || process.env.DEFAULT_PAGE_LIMIT || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedResults = result.slice(startIndex, endIndex);
    
    res.json({
        total: result.length,
        page,
        limit,
        data: paginatedResults
    });
});

// Get specific product
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// Create new product
app.post('/api/products', validateProduct, (req, res) => {
    const newProduct = {
        id: uuid.v4(),
        ...req.body
    };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// Update product
app.put('/api/products/:id', validateProduct, (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products[index] = {
        ...products[index],
        ...req.body,
        id: products[index].id
    };
    
    res.json(products[index]);
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    products.splice(index, 1);
    res.status(204).send();
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
        error: 'Something went wrong!',
        ...(isDevelopment && { stack: err.stack }) // Only send stack trace in development
    });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode at http://127.0.0.1:${PORT}`);
});
