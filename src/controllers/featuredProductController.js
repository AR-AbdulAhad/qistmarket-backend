const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFeaturedProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          product: {
            OR: [
              { name: { contains: search } },
              { id: isNaN(search) ? undefined : parseInt(search) },
            ],
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.featuredProduct.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { position: 'asc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              slugName: true,
              ProductImage: { take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.featuredProduct.count({ where }),
    ]);

    res.json({
      data: items.map((fp) => ({
        id: fp.id,
        product_id: fp.product.id,
        product_name: fp.product.name,
        price: fp.product.price,
        slug: fp.product.slugName,
        image: fp.product.ProductImage[0]?.url || null,
        position: fp.position,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addFeaturedProduct = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const exists = await prisma.featuredProduct.findUnique({ where: { productId } });
    if (exists) return res.status(400).json({ error: 'Already featured' });

    const maxPosition = await prisma.featuredProduct.findFirst({
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const featured = await prisma.featuredProduct.create({
      data: {
        productId,
        position: (maxPosition?.position || 0) + 1,
      },
      include: { product: true },
    });

    res.status(201).json(featured);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeFeaturedProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.featuredProduct.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reorderFeaturedProducts = async (req, res) => {
  try {
    const { items } = req.body;
    await prisma.$transaction(
      items.map((item) =>
        prisma.featuredProduct.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );
    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getPublicFeaturedProducts = async (req, res) => {
  try {
    const featured = await prisma.featuredProduct.findMany({
      orderBy: { position: 'asc' },
      include: {
        product: {
          include: {
            categories: { select: { name: true, slugName: true } },
            subcategories: { select: { name: true, slugName: true } },
            ProductImage: { 
              take: 1, 
              orderBy: { id: 'asc' },   // Added explicit ordering for consistency
              select: { 
                url: true,
                alt_text: true          // Added alt_text
              } 
            },
            ProductInstallments: {
              orderBy: { id: 'desc' },
              take: 1,
              select: { advance: true }
            },
          },
        },
      },
    });

    const data = featured.map(fp => ({
      product_id: fp.product.id,
      product_name: fp.product.name,
      slug: fp.product.slugName,
      price: fp.product.price,
      image: fp.product.ProductImage[0]?.url || null,
      image_alt_text: fp.product.ProductImage[0]?.alt_text || null,   // Added alt_text in response
      category_name: fp.product.categories?.name || "Featured",
      category_slug: fp.product.categories?.slugName || "featured",
      subcategory_name: fp.product.subcategories?.name || "",
      subcategory_slug: fp.product.subcategories?.slugName || "",
      ProductInstallments: fp.product.ProductInstallments,
    }));

    res.json({ data });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getFeaturedProducts,
  addFeaturedProduct,
  removeFeaturedProduct,
  reorderFeaturedProducts,
  getPublicFeaturedProducts
};