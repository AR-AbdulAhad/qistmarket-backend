const {  updateProductInstallments, updateProductImages, deleteProductImages } = require('../controllers/productInstallmentsController');
const upload = require('../middlewares/uploadMiddleware');
const express = require('express');
const router = express.Router();

router.put('/create-product-installment', updateProductInstallments);
router.post('/create-product-images', upload.array('images'), updateProductImages);
router.delete('/delete-image/:id', deleteProductImages);


module.exports = router;