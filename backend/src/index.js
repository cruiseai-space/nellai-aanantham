require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { getCorsOrigins } = require('./config/cors');

const authRoutes = require('./routes/auth');
const ingredientsRoutes = require('./routes/ingredients');
const batchesRoutes = require('./routes/batches');
const recipesRoutes = require('./routes/recipes');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');
const transactionsRoutes = require('./routes/transactions');
const aiRoutes = require('./routes/ai');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Nellai Aanantham Inventory API'
  });
});

// Routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
app.use('/api/ingredients', authMiddleware, ingredientsRoutes);
app.use('/api/batches', authMiddleware, batchesRoutes);
app.use('/api/recipes', authMiddleware, recipesRoutes);
app.use('/api/products', authMiddleware, productsRoutes);
app.use('/api/orders', authMiddleware, ordersRoutes);
app.use('/api/transactions', authMiddleware, transactionsRoutes);
app.use('/api/ai', authMiddleware, aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`📦 API routes: /api/ingredients, /api/batches, /api/recipes, /api/products, /api/orders, /api/transactions`);
  console.log(`🤖 AI routes: /api/ai/parse-voice, /api/ai/parse-receipt, /api/ai/parse-csv, /api/ai/suggest-recipe`);
});

module.exports = app;
