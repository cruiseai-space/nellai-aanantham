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
const { requestTrace } = require('./middleware/requestTrace');
const { logRouteError, logUnhandledRejection } = require('./utils/log');

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

// Per-request trace: incoming params + outgoing JSON (see REQUEST_TRACE in .env.example)
app.use(requestTrace);

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
  logRouteError(`${req.method} ${req.path}`, err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  process.on('unhandledRejection', (reason) => {
    logUnhandledRejection(reason);
  });

  app.listen(PORT, () => {
    const base = `http://localhost:${PORT}`;
    console.log('[api] Nellai Aanantham backend');
    console.log(`  listen  ${base}`);
    console.log(`  health  ${base}/api/health`);
    console.log(`  auth    ${base}/api/auth`);
    console.log('  data    /api/{ingredients,batches,recipes,products,orders,transactions}');
    console.log('  ai      /api/ai/{parse-voice,parse-receipt,parse-csv,suggest-recipe}');
    if (process.env.REQUEST_TRACE === '0') {
      console.log('  trace   off (REQUEST_TRACE=0)');
    } else {
      console.log('  trace   on  ([http] req/res JSON); set REQUEST_TRACE=0 to disable');
    }
  });
}

module.exports = app;
