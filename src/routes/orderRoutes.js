const express = require('express');
const { body, query } = require('express-validator');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authenticateCustomerToken } = require('../middlewares/authCustomerMiddleware');
const {
  createOrders,
  trackOrder,
  getOrders,
  getPendingOrders,
  getDeliveredOrders,
  getOrderById,
  approveCancel,
  getCancelRequests,
  getCancelledOrders,
  updateOrderStatus,
  getRejectedOrders,
  getMyOrders,
  getConfirmedOrders,
  getShippedOrders,
  getArchivedOrders,
  toggleArchiveSingle,
  bulkToggleArchive,
  exportByDateRange,
  exportSelectedOrders,
  bulkUpdateOrders,
  getOrdersByIds
} = require('../controllers/orderController');

const router = express.Router();

router.get('/orders', (req, res, next) => {
  if (req.headers['x-software-backend-secret'] === 'qist-market-software-secret-123') {
    return next();
  }
  return authenticateToken(req, res, next);
}, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['all', 'Pending', 'Confirmed', 'Shipped']),
  query('area').optional().trim(),
], getOrders);

router.post('/orders-feed', (req, res, next) => {
  if (req.headers['x-software-backend-secret'] === 'qist-market-software-secret-123') {
    return next();
  }
  return authenticateToken(req, res, next);
}, getOrders);

router.get('/archived', authenticateToken, getArchivedOrders);

router.put('/:id/toggle-archive', authenticateToken, toggleArchiveSingle);

router.put('/bulk-toggle-archive', authenticateToken, bulkToggleArchive);

router.get('/export-date-range', authenticateToken, exportByDateRange);

router.post('/export-selected', authenticateToken, exportSelectedOrders);

router.post('/get-by-ids', authenticateToken, getOrdersByIds);

router.put('/bulk-edit', authenticateToken, bulkUpdateOrders);


router.get(
  '/pending-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getPendingOrders
);

router.get(
  '/delivered-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getDeliveredOrders
);

router.get(
  '/cancelled-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getCancelledOrders
);

router.get('/orders/:id', getOrderById);
router.get('/orders/my/:id', authenticateCustomerToken, getMyOrders);

router.post('/order', createOrders);
router.post('/order/track-order', trackOrder);

router.get(
  '/cancel-requests',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getCancelRequests
);

router.post('/approve-cancel/:orderId', authenticateToken, approveCancel);

router.put(
  '/orders/:id/status',
  (req, res, next) => {
    if (req.headers['x-software-backend-secret'] === 'qist-market-software-secret-123') {
      req.skipWhatsApp = true;
      return next();
    }
    return authenticateToken(req, res, next);
  },
  [
    body('status').isIn(['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Rejected']),
    body('rejectionReason').optional().isString().trim(),
  ],
  updateOrderStatus
);

router.get(
  '/rejected-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getRejectedOrders
);

router.get(
  '/confirmed-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getConfirmedOrders
);

router.get(
  '/shipped-orders',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().isString().trim(),
  ],
  getShippedOrders
);

module.exports = router;