const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/emails';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/send', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { receiverEmail, cc, bcc, subject, content, parentEmailId } = req.body;
    const senderId = req.user.id;
    
    if (!receiverEmail) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    const validateEmail = (email) => {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    };

    if (!validateEmail(receiverEmail)) {
      return res.status(400).json({ message: 'Invalid recipient email format' });
    }

    const ccList = cc ? cc.split(',').filter(Boolean).map(e => e.trim()) : [];
    const bccList = bcc ? bcc.split(',').filter(Boolean).map(e => e.trim()) : [];

    for (const email of ccList) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: `Invalid CC email format: ${email}` });
      }
    }

    for (const email of bccList) {
      if (!validateEmail(email)) {
        return res.status(400).json({ message: `Invalid BCC email format: ${email}` });
      }
    }

    const allRecipients = [receiverEmail, ...ccList, ...bccList];
    const uniqueRecipients = [...new Set(allRecipients)];
    const placeholders = uniqueRecipients.map((_, i) => `$${i + 1}`).join(',');

    const recipientsResult = await pool.query(
      `SELECT id, email FROM users WHERE email IN (${placeholders}) AND is_active = true`,
      uniqueRecipients
    );

    const foundEmails = recipientsResult.rows.map(r => r.email);
    const notFound = uniqueRecipients.filter(email => !foundEmails.includes(email));

    if (notFound.length > 0) {
      return res.status(404).json({ 
        message: `Users not found: ${notFound.join(', ')}` 
      });
    }

    const emailToId = {};
    recipientsResult.rows.forEach(row => {
      emailToId[row.email] = row.id;
    });

    const mainReceiverId = emailToId[receiverEmail];
    const ccUserIds = ccList.map(email => emailToId[email]).filter(Boolean);
    const bccUserIds = bccList.map(email => emailToId[email]).filter(Boolean);

    let emailResult;
    let emailId;

    if (ccUserIds.length > 0 || bccUserIds.length > 0) {
      const result = await pool.query(
        `INSERT INTO emails (sender_id, receiver_id, subject, content, has_attachments, parent_email_id, is_cc) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [senderId, mainReceiverId, subject || '', content || '', req.files && req.files.length > 0, parentEmailId || null, true]
      );
      emailResult = result;
      emailId = result.rows[0].id;

      for (const ccUserId of ccUserIds) {
        await pool.query(
          `INSERT INTO emails (sender_id, receiver_id, subject, content, has_attachments, parent_email_id, is_cc, is_cc_recipient) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [senderId, ccUserId, subject || '', content || '', req.files && req.files.length > 0, parentEmailId || null, true, true]
        );
      }

      for (const bccUserId of bccUserIds) {
        await pool.query(
          `INSERT INTO emails (sender_id, receiver_id, subject, content, has_attachments, parent_email_id, is_cc, is_bcc_recipient) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [senderId, bccUserId, subject || '', content || '', req.files && req.files.length > 0, parentEmailId || null, true, true]
        );
      }

      for (const ccEmail of ccList) {
        const ccUserId = emailToId[ccEmail];
        await pool.query(
          `INSERT INTO email_cc (email_id, user_id, type) VALUES ($1, $2, 'cc')`,
          [emailId, ccUserId]
        );
      }

      for (const bccEmail of bccList) {
        const bccUserId = emailToId[bccEmail];
        await pool.query(
          `INSERT INTO email_cc (email_id, user_id, type) VALUES ($1, $2, 'bcc')`,
          [emailId, bccUserId]
        );
      }

    } else {
      const result = await pool.query(
        `INSERT INTO emails (sender_id, receiver_id, subject, content, has_attachments, parent_email_id) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [senderId, mainReceiverId, subject || '', content || '', req.files && req.files.length > 0, parentEmailId || null]
      );
      emailResult = result;
      emailId = result.rows[0].id;
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO email_attachments (email_id, file_name, file_path, file_size, mime_type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [emailId, file.originalname, file.path, file.size, file.mimetype]
        );
      }
    }

    const senderResult = await pool.query(
      'SELECT full_name, email FROM users WHERE id = $1',
      [senderId]
    );

    const io = req.app.get('io');
    for (const recipient of recipientsResult.rows) {
      io.to(`user_${recipient.id}`).emit('new_email', {
        email: emailResult.rows[0],
        sender: senderResult.rows[0]
      });
    }

    res.status(201).json({
      message: 'Email sent successfully',
      email: {
        ...emailResult.rows[0],
        sender: senderResult.rows[0],
        cc: ccList,
        bcc: bccList
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

router.post('/:emailId/undo-send', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    await pool.query(
      'DELETE FROM email_cc WHERE email_id = $1',
      [emailId]
    );

    await pool.query(
      'DELETE FROM email_attachments WHERE email_id = $1',
      [emailId]
    );

    const result = await pool.query(
      'DELETE FROM emails WHERE id = $1 AND sender_id = $2 AND created_at > NOW() - INTERVAL \'10 seconds\' RETURNING *',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found or cannot be undone' });
    }
    
    res.json({ message: 'Email unsent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to undo send' });
  }
});

router.post('/drafts', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { receiverEmail, cc, bcc, subject, content } = req.body;
    const userId = req.user.id;
    
    const result = await pool.query(
      `INSERT INTO email_drafts (user_id, receiver_email, cc, bcc, subject, content, has_attachments) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, receiverEmail || '', cc || '', bcc || '', subject || '', content || '', req.files && req.files.length > 0]
    );
    
    const draftId = result.rows[0].id;
    
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await pool.query(
          `INSERT INTO email_attachments (email_id, file_name, file_path, file_size, mime_type) 
           VALUES ($1, $2, $3, $4, $5)`,
          [draftId, file.originalname, file.path, file.size, file.mimetype]
        );
      }
    }
    
    res.status(201).json({
      message: 'Draft saved successfully',
      draft: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
});

router.get('/drafts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);
    
    let query = `
      SELECT * FROM email_drafts 
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate] = decodedToken.split('_');
      query += ` AND created_at < $${paramIndex}`;
      params.push(cursorDate);
      paramIndex++;
    }

    query += ` ORDER BY updated_at DESC LIMIT $${paramIndex}`;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM email_drafts WHERE user_id = $1',
      [userId]
    );
    
    res.json({
      drafts: items,
      total: parseInt(countResult.rows[0].count),
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch drafts' });
  }
});

router.delete('/drafts/:draftId', auth, async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user.id;
    
    await pool.query(
      'DELETE FROM email_attachments WHERE email_id = $1',
      [draftId]
    );
    
    const result = await pool.query(
      'DELETE FROM email_drafts WHERE id = $1 AND user_id = $2 RETURNING *',
      [draftId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Draft not found' });
    }
    
    res.json({ message: 'Draft deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete draft' });
  }
});

router.get('/inbox', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page = 1, search = '', category = 'all' } = req.query;
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;

    let baseQuery = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at, 
             e.is_read, e.is_starred, e.is_important, e.has_attachments,
             u.full_name as sender_name, u.email as sender_email,
             (
               SELECT json_agg(json_build_object(
                 'id', l.id, 'name', l.name, 'color', l.color
               ))
               FROM email_label_mappings lm 
               JOIN email_labels l ON lm.label_id = l.id 
               WHERE lm.email_id = e.id
             ) as labels
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE e.receiver_id = $1
        AND e.is_deleted = false
        AND e.is_spam = false
    `;
    
    const params = [userId];
    let paramIndex = 2;

    if (category === 'unread') {
      baseQuery += ` AND e.is_read = false`;
    } else if (category === 'starred') {
      baseQuery += ` AND e.is_starred = true`;
    } else if (category === 'important') {
      baseQuery += ` AND e.is_important = true`;
    } else if (category === 'has_attachments') {
      baseQuery += ` AND e.has_attachments = true`;
    }

    if (search) {
      baseQuery += ` AND (e.subject ILIKE $${paramIndex} OR e.content ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    baseQuery += ` ORDER BY e.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    const result = await pool.query(baseQuery, params);

    let countQuery = `
      SELECT COUNT(*) FROM emails e
      WHERE e.receiver_id = $1
        AND e.is_deleted = false
        AND e.is_spam = false
    `;
    const countParams = [userId];
    let countIndex = 2;

    if (category === 'unread') {
      countQuery += ` AND e.is_read = false`;
    } else if (category === 'starred') {
      countQuery += ` AND e.is_starred = true`;
    } else if (category === 'important') {
      countQuery += ` AND e.is_important = true`;
    } else if (category === 'has_attachments') {
      countQuery += ` AND e.has_attachments = true`;
    }

    if (search) {
      countQuery += ` AND (e.subject ILIKE $${countIndex} OR e.content ILIKE $${countIndex})`;
      countParams.push(`%${search}%`);
      countIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    const unreadResult = await pool.query(
      'SELECT COUNT(*) FROM emails WHERE receiver_id = $1 AND is_read = false AND is_deleted = false AND is_spam = false',
      [userId]
    );
    const unreadCount = parseInt(unreadResult.rows[0].count);

    const hasMore = (parseInt(page) * limitNum) < total;

    res.json({
      emails: result.rows,
      total,
      unreadCount,
      hasMore,
      page: parseInt(page),
      pageSize: limitNum
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ message: 'Failed to fetch inbox' });
  }
});
router.get('/sent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token, search = '' } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      'e.sender_id = $1',
      'e.is_deleted = false',
      '(e.is_cc_recipient IS NULL OR e.is_cc_recipient = false)'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    if (search) {
      conditions.push(`(e.subject ILIKE $${paramIndex} OR e.content ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.receiver_id, e.subject, e.content, e.created_at, 
             e.has_attachments,
             u.full_name as receiver_name, u.email as receiver_email,
             (
               SELECT json_agg(json_build_object(
                 'id', cc.id, 'email', u2.email, 'fullName', u2.full_name,
                 'type', cc.type
               ))
               FROM email_cc cc
               JOIN users u2 ON cc.user_id = u2.id
               WHERE cc.email_id = e.id
             ) as cc_recipients
      FROM emails e
      JOIN users u ON e.receiver_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch sent emails' });
  }
});

router.get('/archived', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      'e.receiver_id = $1',
      'e.is_archived = true',
      'e.is_deleted = false',
      'e.is_spam = false'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at,
             u.full_name as sender_name, u.email as sender_email,
             e.has_attachments
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch archived emails' });
  }
});

router.get('/spam', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      'e.receiver_id = $1',
      'e.is_spam = true',
      'e.is_deleted = false'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at,
             u.full_name as sender_name, u.email as sender_email,
             e.has_attachments
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch spam emails' });
  }
});

router.get('/important', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      'e.receiver_id = $1',
      'e.is_important = true',
      'e.is_deleted = false',
      'e.is_spam = false'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at,
             u.full_name as sender_name, u.email as sender_email,
             e.has_attachments
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch important emails' });
  }
});

router.get('/starred', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      'e.receiver_id = $1',
      'e.is_starred = true',
      'e.is_deleted = false',
      'e.is_spam = false'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at,
             u.full_name as sender_name, u.email as sender_email,
             e.has_attachments
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch starred emails' });
  }
});

router.get('/trash', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, page_token } = req.query;
    const limitNum = parseInt(limit);

    let conditions = [
      '(e.receiver_id = $1 OR e.sender_id = $1)',
      'e.is_deleted = true'
    ];
    const params = [userId];
    let paramIndex = 2;

    if (page_token) {
      const decodedToken = Buffer.from(page_token, 'base64').toString('ascii');
      const [cursorDate, cursorId] = decodedToken.split('_');
      conditions.push(`(e.created_at < $${paramIndex} OR (e.created_at = $${paramIndex} AND e.id < $${paramIndex + 1}))`);
      params.push(cursorDate, cursorId);
      paramIndex += 2;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT e.id, e.sender_id, e.subject, e.content, e.created_at,
             u.full_name as sender_name, u.email as sender_email,
             e.has_attachments
      FROM emails e
      JOIN users u ON e.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY e.created_at DESC, e.id DESC
      LIMIT $${paramIndex}
    `;
    params.push(limitNum + 1);

    const result = await pool.query(query, params);
    
    const hasMore = result.rows.length > limitNum;
    const items = hasMore ? result.rows.slice(0, limitNum) : result.rows;
    
    let nextPageToken = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      const tokenData = `${lastItem.created_at}_${lastItem.id}`;
      nextPageToken = Buffer.from(tokenData).toString('base64');
    }

    res.json({
      emails: items,
      hasMore,
      nextPageToken,
      pageSize: limitNum
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch trash emails' });
  }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT COUNT(*) FROM emails WHERE receiver_id = $1 AND is_read = false AND is_deleted = false AND is_spam = false',
      [userId]
    );
    
    res.json({ unreadCount: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

router.post('/labels', auth, async (req, res) => {
  try {
    const { name, color } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Label name is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO email_labels (user_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, color || '#3B82F6']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Label already exists' });
    }
    console.error(error);
    res.status(500).json({ message: 'Failed to create label' });
  }
});

router.get('/labels', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT * FROM email_labels WHERE user_id = $1 ORDER BY name ASC',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch labels' });
  }
});

router.delete('/labels/:labelId', auth, async (req, res) => {
  try {
    const { labelId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'DELETE FROM email_labels WHERE id = $1 AND user_id = $2 RETURNING *',
      [labelId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Label not found' });
    }
    
    res.json({ message: 'Label deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete label' });
  }
});

router.get('/:emailId', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const emailResult = await pool.query(
      `SELECT e.*, 
              u1.full_name as sender_name, 
              u1.email as sender_email,
              u2.full_name as receiver_name,
              u2.email as receiver_email,
              (
                SELECT json_agg(json_build_object(
                  'id', cc.id, 
                  'email', u3.email, 
                  'fullName', u3.full_name,
                  'type', cc.type
                ))
                FROM email_cc cc
                JOIN users u3 ON cc.user_id = u3.id
                WHERE cc.email_id = e.id
              ) as cc_recipients
       FROM emails e
       JOIN users u1 ON e.sender_id = u1.id
       JOIN users u2 ON e.receiver_id = u2.id
       WHERE e.id = $1 AND (e.sender_id = $2 OR e.receiver_id = $2)`,
      [emailId, userId]
    );
    
    if (emailResult.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    const email = emailResult.rows[0];
    
    const attachmentsResult = await pool.query(
      'SELECT * FROM email_attachments WHERE email_id = $1',
      [emailId]
    );
    email.attachments = attachmentsResult.rows;
    
    const repliesResult = await pool.query(
      `SELECT e.*, u.full_name as sender_name, u.email as sender_email
       FROM emails e
       JOIN users u ON e.sender_id = u.id
       WHERE e.parent_email_id = $1 AND e.is_deleted = false
       ORDER BY e.created_at ASC`,
      [emailId]
    );
    email.replies = repliesResult.rows;
    
    const labelsResult = await pool.query(
      `SELECT l.id, l.name, l.color 
       FROM email_label_mappings lm 
       JOIN email_labels l ON lm.label_id = l.id 
       WHERE lm.email_id = $1`,
      [emailId]
    );
    email.labels = labelsResult.rows;
    
    if (!email.is_read && email.receiver_id === userId) {
      await pool.query(
        'UPDATE emails SET is_read = true WHERE id = $1',
        [emailId]
      );
    }
    
    res.json(email);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch email' });
  }
});

router.put('/:emailId/read', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    await pool.query(
      'UPDATE emails SET is_read = true WHERE id = $1 AND receiver_id = $2',
      [emailId, userId]
    );
    
    res.json({ message: 'Email marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark email as read' });
  }
});

router.put('/:emailId/unread', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_read = false WHERE id = $1 AND receiver_id = $2 RETURNING *',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ message: 'Email marked as unread' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark email as unread' });
  }
});

router.put('/:emailId/archive', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_archived = NOT is_archived WHERE id = $1 AND receiver_id = $2 RETURNING is_archived',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ 
      message: result.rows[0].is_archived ? 'Email archived' : 'Email unarchived',
      isArchived: result.rows[0].is_archived
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to archive email' });
  }
});

router.put('/:emailId/spam', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_spam = NOT is_spam WHERE id = $1 AND receiver_id = $2 RETURNING is_spam',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ 
      message: result.rows[0].is_spam ? 'Email marked as spam' : 'Email removed from spam',
      isSpam: result.rows[0].is_spam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle spam status' });
  }
});

router.put('/:emailId/important', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_important = NOT is_important WHERE id = $1 AND receiver_id = $2 RETURNING is_important',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ 
      message: result.rows[0].is_important ? 'Email marked as important' : 'Email removed from important',
      isImportant: result.rows[0].is_important
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle important status' });
  }
});

router.put('/:emailId/starred', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_starred = NOT is_starred WHERE id = $1 AND receiver_id = $2 RETURNING is_starred',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ 
      message: result.rows[0].is_starred ? 'Email starred' : 'Email unstarred',
      isStarred: result.rows[0].is_starred
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle star status' });
  }
});

router.delete('/:emailId', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_deleted = true WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) RETURNING *',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ message: 'Email deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete email' });
  }
});

router.post('/:emailId/undo', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
      'UPDATE emails SET is_deleted = false WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2) RETURNING *',
      [emailId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    res.json({ message: 'Email restored' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to restore email' });
  }
});

router.post('/:emailId/labels', auth, async (req, res) => {
  try {
    const { emailId } = req.params;
    const { labelId } = req.body;
    const userId = req.user.id;
    
    const emailCheck = await pool.query(
      'SELECT * FROM emails WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
      [emailId, userId]
    );
    
    if (emailCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    await pool.query(
      'INSERT INTO email_label_mappings (email_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [emailId, labelId]
    );
    
    res.json({ message: 'Label applied successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to apply label' });
  }
});

router.delete('/:emailId/labels/:labelId', auth, async (req, res) => {
  try {
    const { emailId, labelId } = req.params;
    const userId = req.user.id;
    
    const emailCheck = await pool.query(
      'SELECT * FROM emails WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
      [emailId, userId]
    );
    
    if (emailCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }
    
    await pool.query(
      'DELETE FROM email_label_mappings WHERE email_id = $1 AND label_id = $2',
      [emailId, labelId]
    );
    
    res.json({ message: 'Label removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove label' });
  }
});

module.exports = router;