const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const subcategoryRoutes = require('./src/routes/subcategoryRoutes');
const productRoutes = require('./src/routes/productRoutes');
const productInstallmentRoutes = require('./src/routes/productInstallmentRoutes');
const dealRoutes = require('./src/routes/dealRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');
const productDealRoutes = require('./src/routes/productDealRoutes');
const topCategoryRoutes = require('./src/routes/topCategoryRoutes');
const authCustomer = require('./src/routes/authCustomer');
const faqsRoutes = require('./src/routes/faqsRoutes');
const aboutRoutes = require('./src/routes/aboutRoutes');
const termsAndPrivacyRoutes = require('./src/routes/termsAndPrivacyRoutes');
const returnsRefundsPolicyRoutes = require('./src/routes/returnsRefundsPolicyRoutes');
const verificationProcessRoutes = require('./src/routes/verificationProcessRoutes');
const deliveryPolicyRoutes = require('./src/routes/deliveryPolicyRoutes');
const visitUsRoutes = require('./src/routes/visitUsRoutes');
const qaRoutes = require('./src/routes/qaRoutes');
const agreementRoutes = require('./src/routes/agreementRoutes');
const customerAdminRoutes = require('./src/routes/customerAdminRoutes');
const organizationSettingsRoutes = require('./src/routes/organizationSettingsRoutes');
const contactRoutes = require('./src/routes/contactRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const analyticsCountRoutes = require('./src/routes/analyticsCountRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const rolesRoutes = require('./src/routes/rolesRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const tagRoutes = require('./src/routes/tagRoutes');
const pageRoutes = require('./src/routes/pageRoutes');
const pixelRoutes = require('./src/routes/pixelRoutes');
const staticPageMeta = require('./src/routes/staticPageMeta');
const sitemapIndexRoutes = require('./src/routes/sitemapIndexRoutes');
const siteScripts = require('./src/routes/siteScripts');
const cityAreasRoutes = require('./src/routes/cityAreasRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- CORS: Read URLs from .env ----------
const rawOrigins = process.env.FRONTEND_URLS;

if (!rawOrigins) {
  console.error('ERROR: FRONTEND_URLS missing in .env');
  process.exit(1);
}

const allowedOrigins = rawOrigins
  .split(',')
  .map(url => url.trim())
  .filter(url => url.length > 0);

if (allowedOrigins.length === 0) {
  console.error('ERROR: No valid URLs in FRONTEND_URLS');
  process.exit(1);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`BLOCKED: ${origin}`);
      callback(new Error('CORS: Not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is running!!' });
});

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', subcategoryRoutes);
app.use('/api', productRoutes);
app.use('/api', dealRoutes);
app.use('/api', productDealRoutes);
app.use('/api', productInstallmentRoutes);
app.use('/api', orderRoutes);
app.use('/api', bannerRoutes);
app.use('/api', topCategoryRoutes);
app.use('/api', authCustomer);
app.use('/api', faqsRoutes);
app.use('/api', aboutRoutes);
app.use('/api', termsAndPrivacyRoutes);
app.use('/api', returnsRefundsPolicyRoutes);
app.use('/api', verificationProcessRoutes);
app.use('/api', deliveryPolicyRoutes);
app.use('/api', visitUsRoutes);
app.use('/api', qaRoutes);
app.use('/api', agreementRoutes);
app.use('/api', customerAdminRoutes);
app.use('/api', organizationSettingsRoutes);
app.use('/api', contactRoutes);
app.use('/api', adminRoutes);
app.use('/api', analyticsCountRoutes);
app.use('/api', notificationRoutes);
app.use('/api', rolesRoutes);
app.use('/api', reviewRoutes);
app.use('/api', tagRoutes);
app.use('/api', pageRoutes);
app.use('/api', pixelRoutes);
app.use('/api', staticPageMeta);
app.use('/api', sitemapIndexRoutes);
app.use('/api', siteScripts);
app.use('/api', cityAreasRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  process.exit(0);
});