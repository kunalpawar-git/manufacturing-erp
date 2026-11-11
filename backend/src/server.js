import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { connectDatabase } from './config/database.js';
import apiRouter from './routes/apiRouter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerDocument } from './config/swagger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utilities
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static files for uploads
const uploadDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'Manufacturing Operations & QR Traceability ERP',
    version: '1.0.0',
  });
});

// Mount Main API routes
app.use('/api', apiRouter);

// Central Error Handler
app.use(errorHandler);

export const startServer = async () => {
  try {
    await connectDatabase();
    return app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Manufacturing ERP Backend Server active on port ${PORT}`);
      console.log(` API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(` Health Check:       http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
