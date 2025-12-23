const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function generateMeta(title, shortDescription) {
  return {
    metaTitle: title,
    metaDescription: shortDescription?.slice(0, 160) || '',
    metaKeywords: '',
  };
}

const getBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    res.status(200).json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

const getTypeBlogs = async (req, res) => {
  const { type, page = 1, limit = 9, countOnly } = req.query;
  const where = { isActive: true };

  if (type) {
    where.type = type.toUpperCase();
  }

  try {
    if (countOnly) {
      const total = await prisma.blog.count({ where });
      return res.status(200).json({ total });
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, items] = await Promise.all([
      prisma.blog.count({ where }),
      prisma.blog.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
    ]);

    const pages = Math.ceil(total / take);
    res.status(200).json({ items, total, pages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

const getBlogBySlug = async (req, res) => {
  const { slugname } = req.params;

  if (!slugname) {
    return res.status(400).json({ error: 'Slug parameter is required' });
  }

  try {
    const blog = await prisma.blog.findFirst({
      where: {
        slug: slugname,
        type: 'BLOG',
        isActive: true,
      },
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found or not active' });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch blog by slug' });
  }
};

const createBlog = async (req, res) => {
  const { title, shortDescription, longDescription, author, tags, url, type, isActive } = req.body;
  const thumbnail = req.file;

  if (!title || !shortDescription || (type === 'PRESS' && !url)) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    const slug = generateSlug(title);
    const { metaTitle, metaDescription, metaKeywords } = generateMeta(title, shortDescription);

    const tagsArray = type === 'BLOG' && tags 
      ? tags.split(',').map(t => t.trim()).filter(Boolean) 
      : [];

    const data = {
      title,
      shortDescription,
      type,
      isActive: isActive === 'true',
      slug: type === 'BLOG' ? slug : null,
      author: type === 'BLOG' ? author || null : null,
      tags: type === 'BLOG' ? tagsArray : [],
      url: type === 'PRESS' ? url : null,
      longDescription: type === 'BLOG' ? longDescription : null,
      metaTitle,
      metaDescription,
      metaKeywords,
      thumbnailAltText: null,
    };

    if (thumbnail) {
      data.thumbnailUrl = thumbnail.path;
      data.thumbnailCloudinaryId = thumbnail.filename;
    }

    const blog = await prisma.blog.create({ data });
    res.status(201).json(blog);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { 
    title, shortDescription, longDescription, slug: customSlug, author, tags, url, 
    type, isActive, metaTitle, metaDescription, metaKeywords, thumbnailAltText 
  } = req.body;
  const thumbnail = req.file;

  try {
    const existingBlog = await prisma.blog.findUnique({ where: { id: Number(id) } });
    if (!existingBlog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const data = {
      title: title || existingBlog.title,
      shortDescription: shortDescription || existingBlog.shortDescription,
      type,
      isActive: isActive === 'true',
      metaTitle: metaTitle || existingBlog.metaTitle,
      metaDescription: metaDescription || existingBlog.metaDescription,
      metaKeywords: metaKeywords || existingBlog.metaKeywords,
    };

    if (thumbnailAltText !== undefined) {
      data.thumbnailAltText = thumbnailAltText.trim() === '' ? null : thumbnailAltText.trim();
    }

    if (type === 'BLOG') {
      data.longDescription = longDescription ?? existingBlog.longDescription;
      data.author = author ?? existingBlog.author;
      const tagsArray = tags 
        ? tags.split(',').map(t => t.trim()).filter(Boolean) 
        : existingBlog.tags || [];
      data.tags = tagsArray;
      data.url = null;

      if (customSlug) {
        data.slug = customSlug;
      } else if (title) {
        data.slug = generateSlug(title);
      }
    } else if (type === 'PRESS') {
      data.url = url ?? existingBlog.url;
      data.longDescription = null;
      data.slug = null;
      data.author = null;
      data.tags = [];
    }

    if (thumbnail) {
      if (existingBlog.thumbnailUrl) {
        const filePath = path.join(__dirname, '..', existingBlog.thumbnailUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      data.thumbnailUrl = thumbnail.path;
      data.thumbnailCloudinaryId = thumbnail.filename;
    }

    const blog = await prisma.blog.update({
      where: { id: Number(id) },
      data,
    });
    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Slug already exists' });
    }
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await prisma.blog.findUnique({ where: { id: Number(id) } });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    if (blog.thumbnailUrl) {
      const filePath = path.join(__dirname, '..', blog.thumbnailUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.blog.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

module.exports = {
  getBlogs,
  getTypeBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
};