const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const WATI_ACCESS_TOKEN = process.env.WATI_ACCESS_TOKEN;
const WATI_ORDER_CONFIRMATION_TEMPLATE_NAME = process.env.WATI_ORDER_CONFIRMATION_TEMPLATE_NAME;
const WATI_ORDER_CONFIRMATION_BROADCAST_NAME = process.env.WATI_ORDER_CONFIRMATION_BROADCAST_NAME;
const WATI_ORDER_TRACKING_TEMPLATE_NAME = process.env.WATI_ORDER_TRACKING_TEMPLATE_NAME;
const WATI_ORDER_TRACKING_BROADCAST_NAME = process.env.WATI_ORDER_TRACKING_BROADCAST_NAME;
const WATI_ORDER_CANCEL_TEMPLATE_NAME = process.env.WATI_ORDER_CANCEL_TEMPLATE_NAME;
const WATI_ORDER_CANCEL_BROADCAST_NAME = process.env.WATI_ORDER_CANCEL_BROADCAST_NAME;
const WATI_ORDER_REJECTED_TEMPLATE_NAME = process.env.WATI_ORDER_REJECTED_TEMPLATE_NAME;
const WATI_ORDER_REJECTED_BROADCAST_NAME = process.env.WATI_ORDER_REJECTED_BROADCAST_NAME;
const WATI_ORDER_STATUS_UPDATE_TEMPLATE_NAME = process.env.WATI_ORDER_STATUS_UPDATE_TEMPLATE_NAME;
const WATI_ORDER_STATUS_UPDATE_BROADCAST_NAME = process.env.WATI_ORDER_STATUS_UPDATE_BROADCAST_NAME;
const WATI_BASE_URL = process.env.WATI_BASE_URL;

const sendEmail = async (to, subject, orderData) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  let orderNoticeMessage = '';
  const isFullDetails = subject === 'Order Confirmation';

  if (subject === 'Order Confirmation') {
    orderNoticeMessage = 'Your order has been successfully placed!';
  } else if (subject === 'Order Tracking Details') {
    orderNoticeMessage = 'Order details retrieved successfully.';
  } else if (subject === 'Order Cancel Request Approved') {
    orderNoticeMessage = 'Your order cancel request has been approved. Your order is now cancelled.';
  } else if (subject.includes('Updated to Rejected')) {
    orderNoticeMessage = `Your order has been rejected.`;
  } else {
    orderNoticeMessage = `${orderData.status === 'Cancelled' ? 'We’re sorry! Your order has been cancelled. If this was a mistake, please contact our support team for assistance.' : `Great news! Your order is now ${orderData.status}.`}`;
  }

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const htmlContent = `
   <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f9f9fb;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:none;">
    <div class="wrapper" style="width:100%;background:#f9f9fb;padding:16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
        <tr>
          <td align="center">
            <table class="container" role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;max-width:620px;margin:0 auto;background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">
              <!-- Header -->
              <tr>
                <td class="header" style="background:#ffffff;padding:24px 32px 20px;text-align:center;border-bottom:1px solid #e5e7eb;">
                  <img src="https://www.qistmarket.pk/images/logo/logo.png" alt="Qist Market" class="brand-logo" style="height:44px;margin:0 auto 16px;display:block;max-width:100%;border:0;">
                </td>
              </tr>

              <!-- Notice -->
              <tr>
                <td class="notice" style="background:#ff3d3d;padding:20px;text-align:center;border-bottom:1px solid #bbf7d0;">
                  <p style="margin:0;color:#fff;font-size:16px;font-weight:500;line-height:1.4;">${orderNoticeMessage}</p>
                </td>
              </tr>

              <!-- Rejection Reason -->
              ${orderData.status === 'Rejected' && orderData.rejectionReason ? `
              <tr>
                <td class="alert" style="background:#fef3f2;border-left:4px solid #f87171;padding:14px 20px;margin:16px 20px;border-radius:0 6px 6px 0;">
                  <h5 style="margin:0 0 6px;color:#b91c1c;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Rejection Reason</h5>
                  <p style="margin:0;color:#991b1b;font-size:13px;line-height:1.5;">${orderData.rejectionReason}</p>
                </td>
              </tr>
              ` : ''}

              <!-- Body Content -->
              <tr>
                <td class="body" style="padding:28px 32px;">

                  <!-- Order Overview -->
                  <div class="section" style="margin-bottom:28px;">
                    <h3 class="section-title" style="margin:0 0 14px;color:#111827;font-size:17px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;position:relative;">
                      Order Overview
                      <span style="content:'';position:absolute;bottom:-1px;left:0;width:40px;height:2px;background:#3b82f6;"></span>
                    </h3>
                    <ul class="overview" style="list-style:none;padding:0;margin:0;background:#f9fafb;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Order Number </span> <strong style="color:#111827;font-weight:600;">${orderData.id}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Tracking Number </span> <strong style="color:#111827;font-weight:600;">${orderData.tokenNumber || '—'}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Date </span> <strong style="color:#111827;font-weight:600;">${new Date(orderData.createdAt).toLocaleDateString()}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Status </span> <strong style="color:#111827;font-weight:600;">${orderData.status || '—'}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Product </span> <strong style="color:#111827;font-weight:600;">${orderData.productName || '—'}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Advance </span> <strong style="color:#111827;font-weight:600;">Rs. ${Number(orderData.advanceAmount).toLocaleString()}</strong>
                      </li>
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:1px solid #e5e7eb;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Area </span> <strong style="color:#111827;font-weight:600;">${orderData.area || '—'}</strong>
                      </li>
                      ${isFullDetails ? `
                      <li style="display:flex;justify-content:space-between;padding:11px 18px;border-bottom:none;font-size:14.5px;">
                        <span style="color:#4b5563;font-weight:500;margin-right: 10px;">Payment Method </span> <strong style="color:#111827;font-weight:600;">${orderData.paymentMethod || '—'}</strong>
                      </li>
                      ` : ''}
                    </ul>
                  </div>

                  ${isFullDetails ? `
                  <!-- Order Details -->
                  <div class="section" style="margin-bottom:28px;">
                    <h3 class="section-title" style="margin:0 0 14px;color:#111827;font-size:17px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;position:relative;">
                      Order Details
                      <span style="content:'';position:absolute;bottom:-1px;left:0;width:40px;height:2px;background:#3b82f6;"></span>
                    </h3>
                    <table class="table" role="presentation" style="width:100%;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Product</th>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Total Advance</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="padding:12px 14px;color:#4b5563;font-size:14.5px;border-top:1px solid #e5e7eb;">${orderData.productName || '—'}</td>
                          <td class="highlight" style="padding:12px 14px;color:#1d4ed8;font-weight:600;font-size:14.5px;border-top:1px solid #e5e7eb;">Rs. ${Number(orderData.advanceAmount).toLocaleString()}</td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <th style="background:#f9fafb;font-weight:500;text-transform:none;font-size:14px;color:#374151;padding:12px 14px;text-align:left;">Payment Method</th>
                          <td style="padding:12px 14px;color:#4b5563;font-size:14.5px;">${orderData.paymentMethod || '—'}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <table class="table" role="presentation" style="width:100%;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;border-collapse:collapse;">
                      <thead>
                        <tr>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Advance Amount</th>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Installment Amount</th>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Months Plan</th>
                          <th style="background:#f3f4f6;color:#374151;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:0.6px;padding:12px 14px;text-align:left;">Total Deal Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="highlight" style="padding:12px 14px;color:#1d4ed8;font-weight:600;font-size:14.5px;border-top:1px solid #e5e7eb;">Rs. ${Number(orderData.advanceAmount).toLocaleString()}</td>
                          <td class="highlight" style="padding:12px 14px;color:#1d4ed8;font-weight:600;font-size:14.5px;border-top:1px solid #e5e7eb;">Rs. ${Number(orderData.monthlyAmount).toLocaleString()}</td>
                          <td class="highlight" style="padding:12px 14px;color:#1d4ed8;font-weight:600;font-size:14.5px;border-top:1px solid #e5e7eb;">Months: ${orderData.months || '—'}</td>
                          <td class="highlight" style="padding:12px 14px;color:#1d4ed8;font-weight:600;font-size:14.5px;border-top:1px solid #e5e7eb;">Rs. ${Number(orderData.totalDealValue).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Billing Address -->
                  <div class="section" style="margin-bottom:28px;">
                    <h3 class="section-title" style="margin:0 0 14px;color:#111827;font-size:17px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;position:relative;">
                      Billing Address
                      <span style="content:'';position:absolute;bottom:-1px;left:0;width:40px;height:2px;background:#3b82f6;"></span>
                    </h3>
                    <table class="table address-table" role="presentation" style="width:100%;border:none;border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">Customer Name</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.fullName}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">WhatsApp Number</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.phone}</td>
                        </tr>
                        ${orderData.alternativePhone ? `
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">Alternative Number</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.alternativePhone}</td>
                        </tr>
                        ` : ''}
                        ${orderData.email ? `
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">Email</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.email}</td>
                        </tr>
                        ` : ''}
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">Address</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.address || '—'}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">City</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.city || '—'}</td>
                        </tr>
                        <tr>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#6b7280;width:36%;font-weight:500;padding-right:12px;">Area</td>
                          <td style="padding:8px 0;vertical-align:top;font-size:14.5px;color:#111827;font-weight:600;">${orderData.area || '—'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  ${orderData.orderNotes ? `
                  <div class="section" style="margin-bottom:28px;">
                    <h3 class="section-title" style="margin:0 0 14px;color:#111827;font-size:17px;font-weight:600;border-bottom:1px solid #e5e7eb;padding-bottom:6px;position:relative;">
                      Order Notes
                      <span style="content:'';position:absolute;bottom:-1px;left:0;width:40px;height:2px;background:#3b82f6;"></span>
                    </h3>
                    <div class="notes" style="background:#fffbeb;padding:14px 18px;border-radius:8px;border-left:4px solid #fbbf24;">
                      <p style="margin:0;color:#92400e;font-size:13.5px;line-height:1.5;">${orderData.orderNotes}</p>
                    </div>
                  </div>
                  ` : ''}
                  ` : ''}

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td class="footer" style="background:#f9fafb;color:#6b7280;padding:20px;text-align:center;font-size:12.5px;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;">© ${getCurrentYear()} Qist Market. All rights reserved.</p>
                  <p style="margin:8px 0 0;">For support, <a href="mailto:info@qistmarket.com" style="color:#3b82f6;font-weight:500;text-decoration:none;">contact us</a>.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </body>
  </html>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`Error sending email for ${subject}:`, error);
    throw new Error('Failed to send email');
  }
};

const sendOrderWhatsApp = async (phone, subject, orderData) => {
  let waPhone = phone.startsWith('0') ? '92' + phone.slice(1) : phone.startsWith('+92') ? phone.slice(1) : phone;
  if (!waPhone.startsWith('92')) {
    throw new Error('Invalid phone format for WhatsApp');
  }
  const url = `${WATI_BASE_URL}/api/v1/sendTemplateMessage?whatsappNumber=${waPhone}`;

  let templateName, broadcastName, orderNoticeMessage, parameters;

  if (subject === 'Order Confirmation') {
    templateName = WATI_ORDER_CONFIRMATION_TEMPLATE_NAME;
    broadcastName = WATI_ORDER_CONFIRMATION_BROADCAST_NAME;
    orderNoticeMessage = 'Your order has been successfully placed!';
    parameters = [
      { name: '1', value: `${orderData.fullName}` },
      { name: '2', value: orderData.id.toString() },
      { name: '3', value: orderData.tokenNumber },
      { name: '4', value: new Date(orderData.createdAt).toLocaleDateString() },
      { name: '5', value: orderData.status },
      { name: '6', value: orderData.productName },
      { name: '7', value: Number(orderData.advanceAmount).toLocaleString() },
      { name: '8', value: Number(orderData.monthlyAmount).toLocaleString() },
      { name: '9', value: orderData.months?.toString() },
      { name: '10', value: Number(orderData.totalDealValue).toLocaleString() },
      { name: '11', value: orderData.paymentMethod },
      { name: '12', value: orderData.address },
      { name: '13', value: orderData.city },
      { name: '14', value: orderData.area },
    ];
  } else if (subject === 'Order Tracking Details') {
    templateName = WATI_ORDER_TRACKING_TEMPLATE_NAME;
    broadcastName = WATI_ORDER_TRACKING_BROADCAST_NAME;
    orderNoticeMessage = 'Order details retrieved successfully.';
    parameters = [
      { name: '1', value: `${orderData.fullName}` },
      { name: '2', value: orderData.id.toString() },
      { name: '3', value: orderData.tokenNumber },
      { name: '4', value: new Date(orderData.createdAt).toLocaleDateString() },
      { name: '5', value: orderData.status },
      { name: '6', value: orderData.productName },
      { name: '7', value: Number(orderData.advanceAmount).toLocaleString() },
    ];
  } else if (subject === 'Order Cancel Request Approved') {
    templateName = WATI_ORDER_CANCEL_TEMPLATE_NAME;
    broadcastName = WATI_ORDER_CANCEL_BROADCAST_NAME;
    orderNoticeMessage = 'Your order cancel request has been approved. Your order is now cancelled.';
    parameters = [
      { name: '1', value: `${orderData.fullName}` },
      { name: '17', value: orderNoticeMessage },
      { name: '2', value: orderData.id.toString() },
      { name: '3', value: orderData.tokenNumber },
      { name: '4', value: new Date(orderData.createdAt).toLocaleDateString() },
      { name: '5', value: orderData.status },
      { name: '6', value: orderData.productName },
      { name: '7', value: Number(orderData.advanceAmount).toLocaleString() },
    ];
  } else if (subject.includes('Updated to Rejected')) {
    templateName = WATI_ORDER_REJECTED_TEMPLATE_NAME;
    broadcastName = WATI_ORDER_REJECTED_BROADCAST_NAME;
    orderNoticeMessage = `Your order has been rejected.`;
    parameters = [
      { name: '1', value: `${orderData.fullName}` },
      { name: '17', value: orderNoticeMessage },
      { name: '2', value: orderData.id.toString() },
      { name: '3', value: orderData.tokenNumber },
      { name: '4', value: new Date(orderData.createdAt).toLocaleDateString() },
      { name: '5', value: orderData.status },
      { name: '6', value: orderData.productName },
      { name: '7', value: Number(orderData.advanceAmount).toLocaleString() },
      { name: '9', value: `Rejection Reason: ${orderData.rejectionReason || "N/A"}` },
    ];
  } else if (subject.startsWith('Order Status Updated to')) {
    templateName = WATI_ORDER_STATUS_UPDATE_TEMPLATE_NAME;
    broadcastName = WATI_ORDER_STATUS_UPDATE_BROADCAST_NAME;
    orderNoticeMessage = `${orderData.status === 'Cancelled' ? 'We’re sorry! Your order has been cancelled. If this was a mistake, please contact our support team for assistance.' : `Great news! Your order is now ${orderData.status}.`}`;
    parameters = [
      { name: '1', value: `${orderData.fullName}` },
      { name: '17', value: orderNoticeMessage },
      { name: '2', value: orderData.id.toString() },
      { name: '3', value: orderData.tokenNumber },
      { name: '4', value: new Date(orderData.createdAt).toLocaleDateString() },
      { name: '5', value: orderData.status },
      { name: '6', value: orderData.productName },
      { name: '7', value: Number(orderData.advanceAmount).toLocaleString() },
    ];
  } else {
    throw new Error('Invalid subject for WhatsApp notification');
  }

  const body = {
    template_name: templateName,
    broadcast_name: broadcastName,
    parameters,
  };

  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${WATI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to send WhatsApp message');
  }
};

const getOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { AND: [] };

    where.AND.push({
      status: {
        notIn: ['Delivered', 'Cancelled', 'Rejected'],
      },
    });

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    if (status !== 'all') {
      where.AND.push({ status });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getPendingOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { status: 'Pending' },
        { status: { notIn: ['Cancelled', 'Rejected'] } },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pending orders' });
  }
};

const getDeliveredOrders = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search || '';

  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
    return res.status(400).json({ error: 'Invalid page or limit parameters' });
  }

  const skip = (page - 1) * limit;
  const take = limit;

  try {
    const where = {
      AND: [
        { status: 'Delivered' },
        { status: { notIn: ['Cancelled', 'Rejected'] } },
      ],
    };

    if (search) {
      const orConditions = [
        { tokenNumber: { contains: search } },
        { fullName: { contains: search } },
        { productName: { contains: search } },
      ];

      if (!isNaN(search)) {
        orConditions.push({ id: Number(search) });
      }

      where.AND.push({ OR: orConditions });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error('Error fetching delivered orders:', error);
    res.status(500).json({ error: 'Failed to fetch delivered orders', details: error.message });
  }
};

const getCancelledOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { status: 'Cancelled' },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cancelled orders' });
  }
};

const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.createOrder.findUnique({
      where: { id: Number(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
};

const createOrders = async (req, res) => {
  try {
    const data = req.body;

    const requiredFields = [
      'phone', 'fullName', 'cnic', 'city', 'area', 'address', 'paymentMethod',
      'productName', 'totalDealValue', 'advanceAmount', 'monthlyAmount', 'months'
    ];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        return res.status(400).json({ error: `${field} is required` });
      }
    }

    if (data.email && !isValidEmail(data.email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (data.alternativePhone && !/^\d{11,}$/.test(data.alternativePhone)) {
      return res.status(400).json({ error: "Invalid alternative number format" });
    }

    if (typeof data.productName !== 'string' || data.productName.trim() === '') {
      return res.status(400).json({ error: 'productName must be a non-empty string' });
    }
    if (isNaN(data.totalDealValue) || data.totalDealValue < 0) {
      return res.status(400).json({ error: 'totalDealValue must be a non-negative number' });
    }
    if (isNaN(data.advanceAmount) || data.advanceAmount < 0) {
      return res.status(400).json({ error: 'advanceAmount must be a non-negative number' });
    }
    if (isNaN(data.monthlyAmount) || data.monthlyAmount < 0) {
      return res.status(400).json({ error: 'monthlyAmount must be a non-negative number' });
    }
    if (!Number.isInteger(data.months) || data.months < 0) {
      return res.status(400).json({ error: 'months must be a non-negative integer' });
    }

    // Look up the product to get category_id and subcategory_id
    const product = await prisma.product.findFirst({
      where: { name: data.productName },
      select: { id: true, category_id: true, subcategory_id: true },
    });

    if (!product) {
      return res.status(400).json({ error: `Product "${data.productName}" not found` });
    }

    let referralType = null;
    let referralDetails = null;
    if (data.referralSource && typeof data.referralSource === 'object') {
      referralType = data.referralSource.type || 'unknown';
      referralDetails = data.referralSource.details ? JSON.stringify(data.referralSource.details) : null;
      if (typeof referralType !== 'string' || referralType.length > 100) {
        return res.status(400).json({ error: 'referralType must be a string with max length 100' });
      }
      if (referralDetails && referralDetails.length > 65535) {
        return res.status(400).json({ error: 'referralDetails exceeds maximum length' });
      }
    }

    const existingOrder = await prisma.createOrder.findFirst({
      where: {
        phone: data.phone,
        productName: data.productName,
        status: {
          notIn: ['Cancelled', 'Rejected'],
        },
      },
    });

    if (existingOrder) {
      return res.status(400).json({
        error: `An order for the product "${data.productName}" has already been placed. Please review your existing orders or contact support for assistance.`,
      });
    }

    let customerId = null;
    if (data.customerID) {
      customerId = data.customerID;
    }

    const tokenNumber = crypto.randomBytes(4).toString('hex').toUpperCase();

    const newOrder = await prisma.createOrder.create({
      data: {
        customerId,
        email: data.email || null,
        phone: data.phone,
        alternativePhone: data.alternativePhone || null,
        fullName: data.fullName,
        cnic: data.cnic,
        city: data.city,
        area: data.area,
        address: data.address,
        orderNotes: data.orderNotes || null,
        paymentMethod: data.paymentMethod,
        productName: data.productName,
        totalDealValue: Number(data.totalDealValue),
        advanceAmount: Number(data.advanceAmount),
        monthlyAmount: Number(data.monthlyAmount),
        months: Number(data.months),
        tokenNumber,
        referralType,
        referralDetails,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
      },
    });

    await prisma.notification.create({
      data: {
        orderId: newOrder.id,
        type: 'NEW_ORDER',
        message: `New order #${newOrder.id} placed for ${newOrder.productName} by ${newOrder.fullName}`,
      },
    });

    await sendOrderWhatsApp(newOrder.phone, 'Order Confirmation', newOrder);
    if (newOrder.email) await sendEmail(newOrder.email, 'Order Confirmation', newOrder);

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
};

const requestCancelOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await prisma.createOrder.findUnique({
      where: { id: Number(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.cancelRequest === 'pending') {
      return res.status(400).json({ error: 'Cancel request already pending' });
    }

    const updatedOrder = await prisma.createOrder.update({
      where: { id: Number(id) },
      data: { cancelRequest: 'pending' },
    });

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error requesting order cancellation:', error);
    res.status(500).json({ error: 'Failed to request order cancellation' });
  }
};

const trackOrder = async (req, res) => {
  try {
    const { tokenOrId, phone } = req.body;

    if (!tokenOrId || !phone) {
      return res.status(400).json({ error: 'order no or token no and phone are required' });
    }

    const order = await prisma.createOrder.findFirst({
      where: {
        phone,
        OR: [
          { id: Number(tokenOrId) ? Number(tokenOrId) : undefined },
          { tokenNumber: tokenOrId },
        ],
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await sendOrderWhatsApp(order.phone, 'Order Tracking Details', order);
    if (order.email) await sendEmail(order.email, 'Order Tracking Details', order);

    res.status(200).json(order);
  } catch (error) {
    console.error('Error tracking order:', error);
    res.status(500).json({ error: 'Failed to track order', details: error.message });
  }
};

const getCancelRequests = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { cancelRequest: 'pending' },
        { status: { notIn: ['Cancelled', 'Rejected'] } },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch cancel requests' });
  }
};

const approveCancel = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await prisma.createOrder.findUnique({ where: { id: Number(orderId) } });
    if (!order || order.cancelRequest !== 'pending') {
      return res.status(400).json({ error: 'No pending cancel request' });
    }
    const updatedOrder = await prisma.createOrder.update({
      where: { id: Number(orderId) },
      data: { cancelRequest: 'approved', status: 'Cancelled' },
    });
    await sendOrderWhatsApp(updatedOrder.phone, 'Order Cancel Request Approved', updatedOrder);
    if (updatedOrder.email) await sendEmail(updatedOrder.email, 'Order Cancel Request Approved', updatedOrder);
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to approve cancellation' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    let data = { status };
    if (status === 'Rejected') {
      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }
      data.rejectionReason = rejectionReason;
    }

    const updatedOrder = await prisma.createOrder.update({
      where: { id: Number(id) },
      data,
    });

    const subject = status === 'Rejected' ? 'Order Status Updated to Rejected' : `Order Status Updated to ${status}`;
    await sendOrderWhatsApp(updatedOrder.phone, subject, updatedOrder);

    if (updatedOrder.email) {
      await sendEmail(updatedOrder.email, subject, updatedOrder);
    }

    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
};

const getRejectedOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { status: 'Rejected' },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rejected orders' });
  }
};

const getConfirmedOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { status: 'Confirmed' },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch confirmed orders' });
  }
};

const getShippedOrders = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
  } = req.query;
  const skip = (page - 1) * limit;
  const take = Number(limit);

  try {
    const where = { 
      AND: [
        { status: 'Shipped' },
      ],
    };

    if (search) {
      where.AND.push({
        OR: [
          { id: isNaN(search) ? undefined : Number(search) },
          { tokenNumber: { contains: search } },
          { fullName: { contains: search } },
          { productName: { contains: search } },
        ].filter(Boolean),
      });
    }

    const orders = await prisma.createOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const totalItems = await prisma.createOrder.count({ where });

    res.status(200).json({
      data: orders,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch confirmed orders' });
  }
};

async function getMyOrders(req, res) {
  const { customerId } = req.params;
  const userId = customerId;
  try {
    const orders = await prisma.createOrder.findMany({
      where: { customerId: userId },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createOrders, trackOrder, getOrders, getPendingOrders, getDeliveredOrders, getOrderById, getCancelRequests, approveCancel, getCancelledOrders, updateOrderStatus, getRejectedOrders, requestCancelOrder, getMyOrders, getConfirmedOrders, getShippedOrders };