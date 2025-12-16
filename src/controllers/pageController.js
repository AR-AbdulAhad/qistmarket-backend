const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const upsertPage = async (req, res) => {
  try {
    const { title, content, slug, isActive, metaTitle, metaDescription, metaKeywords, category, organizationId } = req.body;

    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Title, content, and slug are required' });
    }

    const existingPage = await prisma.page.findUnique({ where: { slug } });
    let page;

    if (existingPage) {
      page = await prisma.page.update({
        where: { id: existingPage.id },
        data: {
          title,
          content,
          slug,
          isActive: isActive !== undefined ? isActive : true,
          metaTitle: metaTitle || existingPage.metaTitle || title,
          metaDescription: metaDescription || existingPage.metaDescription || `Description for ${title}`,
          metaKeywords: metaKeywords || existingPage.metaKeywords || title.toLowerCase().replace(/\s/g, ', '),
          category: category || existingPage.category || 'OTHER',
          organizationId: organizationId !== undefined ? Number(organizationId) : existingPage.organizationId,
          updatedAt: new Date(),
        },
      });
      res.status(200).json({ message: 'Page updated successfully', page });
    } else {
      page = await prisma.page.create({
        data: {
          title,
          content,
          slug,
          isActive: isActive !== undefined ? isActive : true,
          metaTitle: metaTitle || title,
          metaDescription: metaDescription || `Description for ${title}`,
          metaKeywords: metaKeywords || title.toLowerCase().replace(/\s/g, ', '),
          category: category || 'OTHER',
          organizationId: organizationId !== undefined ? Number(organizationId) : null,
        },
      });
      res.status(201).json({ message: 'Page created successfully', page });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to save page', details: error.message });
  }
};

const getPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany({
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });
    res.status(200).json(pages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pages', details: error.message });
  }
};

const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await prisma.page.findUnique({
      where: { slug, isActive: true },
    });
    if (!page) {
      return res.status(404).json({ error: 'Page not found or inactive' });
    }
    res.status(200).json(page);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch page', details: error.message });
  }
};

const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const existingPage = await prisma.page.findUnique({ where: { id: parseInt(id) } });
    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }
    await prisma.page.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete page', details: error.message });
  }
};

const updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      slug,
      isActive,
      metaTitle,
      metaDescription,
      metaKeywords,
      category,
      organizationId,
    } = req.body;

    // Validation
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Title, content, and slug are required' });
    }

    const pageId = parseInt(id, 10);
    if (isNaN(pageId)) {
      return res.status(400).json({ error: 'Invalid page ID' });
    }

    // Check if page exists
    const existingPage = await prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!existingPage) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Optional: Prevent slug conflict with other pages
    if (slug !== existingPage.slug) {
      const slugExists = await prisma.page.findUnique({ where: { slug } });
      if (slugExists) {
        return res.status(400).json({ error: 'Slug already in use by another page' });
      }
    }

    const updatedPage = await prisma.page.update({
      where: { id: pageId },
      data: {
        title,
        content,
        slug,
        isActive: isActive ?? existingPage.isActive,
        metaTitle: metaTitle ?? existingPage.metaTitle,
        metaDescription: metaDescription ?? existingPage.metaDescription,
        metaKeywords: metaKeywords ?? existingPage.metaKeywords,
        category: category ?? existingPage.category,
        organizationId: organizationId !== undefined ? Number(organizationId) : existingPage.organizationId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(200).json({
      message: 'Page updated successfully',
      page: updatedPage,
    });
  } catch (error) {
    console.error('Update page error:', error);
    res.status(500).json({ error: 'Failed to update page', details: error.message });
  }
};

module.exports = { upsertPage, getPages, getPageBySlug, deletePage, updatePage };