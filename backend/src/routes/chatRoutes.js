const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/chat';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname
      .replace(/\s/g, '_')
      .replace(/[()]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, uniqueSuffix + '-' + originalName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.get('/groups', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT g.*,
              u.full_name as created_by_name,
              (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as member_count,
              true as is_member,
              (SELECT is_muted FROM chat_group_members WHERE group_id = g.id AND user_id = $1) as is_muted,
              (SELECT is_admin FROM chat_group_members WHERE group_id = g.id AND user_id = $1) as is_admin,
              (SELECT m.content FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
              (SELECT m.created_at FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
       FROM chat_groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.is_active = true
       AND EXISTS (SELECT 1 FROM chat_group_members cgm WHERE cgm.group_id = g.id AND cgm.user_id = $1)
       ORDER BY last_message_at DESC NULLS LAST, g.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

router.post('/groups', auth, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const userId = req.user.id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const groupResult = await pool.query(
      `INSERT INTO chat_groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), description || null, userId]
    );

    const group = groupResult.rows[0];

    await pool.query(
      `INSERT INTO chat_group_members (group_id, user_id, is_admin) VALUES ($1, $2, true)`,
      [group.id, userId]
    );

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      for (const memberId of memberIds) {
        if (memberId === userId) continue;
        await pool.query(
          `INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [group.id, memberId]
        );
      }
    }

    res.status(201).json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

router.get('/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT g.*,
              u.full_name as created_by_name,
              (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as member_count,
              (SELECT EXISTS(SELECT 1 FROM chat_group_members WHERE group_id = g.id AND user_id = $1)) as is_member,
              (SELECT is_admin FROM chat_group_members WHERE group_id = g.id AND user_id = $1) as is_admin
       FROM chat_groups g
       JOIN users u ON g.created_by = u.id
       WHERE g.id = $2 AND g.is_active = true`,
      [userId, groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const group = result.rows[0];

    const membersResult = await pool.query(
      `SELECT u.id, u.full_name, u.email, cm.is_admin, cm.is_muted, cm.joined_at
       FROM chat_group_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.group_id = $1
       ORDER BY cm.joined_at ASC`,
      [groupId]
    );
    group.members = membersResult.rows;

    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch group' });
  }
});

router.get('/groups/:groupId/messages', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const userId = req.user.id;

    const memberCheck = await pool.query(
      'SELECT * FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    const result = await pool.query(
      `SELECT m.*,
              u.full_name as sender_name,
              u.email as sender_email,
              (SELECT json_agg(json_build_object('user_id', r.user_id, 'emoji', r.emoji, 'full_name', u2.full_name))
               FROM chat_reactions r
               JOIN users u2 ON r.user_id = u2.id
               WHERE r.message_id = m.id) as reactions,
              (SELECT json_agg(json_build_object('file_name', a.file_name, 'file_path', a.file_path, 'file_size', a.file_size, 'mime_type', a.mime_type))
               FROM chat_message_attachments a WHERE a.message_id = m.id) as attachments,
              (SELECT json_build_object('id', pm.id, 'content', pm.content, 'sender_name', pu.full_name)
               FROM chat_messages pm JOIN users pu ON pm.sender_id = pu.id WHERE pm.id = m.parent_message_id) as parent_message
       FROM chat_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.group_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [groupId, limit, offset]
    );

    res.json(result.rows.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/groups/:groupId/messages', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, messageType, parentMessageId } = req.body;
    const userId = req.user.id;

    const memberCheck = await pool.query(
      'SELECT is_muted FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ message: 'Not a member of this group' });
    }

    if (memberCheck.rows[0].is_muted) {
      return res.status(403).json({ message: 'You are muted in this group' });
    }

    const result = await pool.query(
      `INSERT INTO chat_messages (group_id, sender_id, content, message_type, parent_message_id, has_attachments)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [groupId, userId, content, messageType || 'text', parentMessageId || null, req.files && req.files.length > 0]
    );

    const message = result.rows[0];
    message.attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = `/uploads/chat/${file.filename}`;
        const attRes = await pool.query(
          `INSERT INTO chat_message_attachments (message_id, file_name, file_path, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [message.id, file.originalname, filePath, file.size, file.mimetype]
        );
        message.attachments.push(attRes.rows[0]);
      }
    }

    const senderResult = await pool.query(
      'SELECT id, full_name, email FROM users WHERE id = $1',
      [userId]
    );
    message.sender_name = senderResult.rows[0].full_name;
    message.sender_email = senderResult.rows[0].email;
    message.reactions = null;

    const io = req.app.get('io');
    if (io) {
      io.to(`group_${groupId}`).emit('new-message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

router.delete('/groups/:groupId/messages/:messageId', auth, async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const userId = req.user.id;
    const { deleteForEveryone } = req.query;

    if (deleteForEveryone === 'true') {
      const result = await pool.query(
        'UPDATE chat_messages SET content = $1, has_attachments = false, deleted_for_everyone = true WHERE id = $2 AND group_id = $3 AND sender_id = $4 RETURNING *',
        ['This message was deleted', messageId, groupId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Message not found or not authorized' });
      }

      return res.json({ message: 'Message deleted for everyone' });
    }

    const result = await pool.query(
      'DELETE FROM chat_messages WHERE id = $1 AND group_id = $2 AND sender_id = $3 RETURNING *',
      [messageId, groupId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

router.post('/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, userId, emoji]
      );
      return res.json({ message: 'Reaction removed', action: 'removed' });
    }

    await pool.query(
      `INSERT INTO chat_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction added', action: 'added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle reaction' });
  }
});

router.get('/private/users', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.is_active,
              (SELECT pm.content FROM chat_private_messages pm
               WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) OR (pm.sender_id = u.id AND pm.receiver_id = $1)
               ORDER BY pm.created_at DESC LIMIT 1) as last_message,
              (SELECT pm.created_at FROM chat_private_messages pm
               WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) OR (pm.sender_id = u.id AND pm.receiver_id = $1)
               ORDER BY pm.created_at DESC LIMIT 1) as last_message_at,
              (SELECT COUNT(*) FROM chat_private_messages pm
               WHERE pm.sender_id = u.id AND pm.receiver_id = $1 AND pm.is_read = false) as unread_count
       FROM users u
       WHERE u.id != $1 AND u.is_active = true
       ORDER BY last_message_at DESC NULLS LAST, u.full_name ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.get('/private/messages/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT pm.*,
              u1.full_name as sender_name,
              u1.email as sender_email,
              u2.full_name as receiver_name,
              u2.email as receiver_email,
              (SELECT json_agg(json_build_object('file_name', a.file_name, 'file_path', a.file_path, 'file_size', a.file_size, 'mime_type', a.mime_type))
               FROM chat_private_attachments a WHERE a.message_id = pm.id) as attachments,
              (SELECT json_agg(json_build_object('user_id', r.user_id, 'emoji', r.emoji, 'full_name', ru.full_name))
               FROM chat_private_reactions r JOIN users ru ON r.user_id = ru.id WHERE r.message_id = pm.id) as reactions,
              (SELECT json_build_object('id', pp.id, 'content', pp.content, 'sender_name', pu.full_name)
               FROM chat_private_messages pp JOIN users pu ON pp.sender_id = pu.id WHERE pp.id = pm.parent_message_id) as parent_message
       FROM chat_private_messages pm
       JOIN users u1 ON pm.sender_id = u1.id
       JOIN users u2 ON pm.receiver_id = u2.id
       WHERE (pm.sender_id = $1 AND pm.receiver_id = $2)
          OR (pm.sender_id = $2 AND pm.receiver_id = $1)
       ORDER BY pm.created_at DESC
       LIMIT $3 OFFSET $4`,
      [currentUserId, userId, limit, offset]
    );

    const messages = result.rows.reverse();

    await pool.query(
      'UPDATE chat_private_messages SET is_read = true WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false',
      [userId, currentUserId]
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch private messages' });
  }
});

router.post('/private/messages', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const { receiverId, content, parentMessageId } = req.body;
    const senderId = req.user.id;

    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver is required' });
    }

    const result = await pool.query(
      `INSERT INTO chat_private_messages (sender_id, receiver_id, content, parent_message_id, has_attachments)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [senderId, receiverId, content, parentMessageId || null, req.files && req.files.length > 0]
    );

    const message = result.rows[0];
    message.attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const filePath = `/uploads/chat/${file.filename}`;
        const attRes = await pool.query(
          `INSERT INTO chat_private_attachments (message_id, file_name, file_path, file_size, mime_type)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [message.id, file.originalname, filePath, file.size, file.mimetype]
        );
        message.attachments.push(attRes.rows[0]);
      }
    }

    const senderResult = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [senderId]);
    const receiverResult = await pool.query('SELECT id, full_name, email FROM users WHERE id = $1', [receiverId]);

    message.sender_name = senderResult.rows[0].full_name;
    message.sender_email = senderResult.rows[0].email;
    message.receiver_name = receiverResult.rows[0].full_name;
    message.receiver_email = receiverResult.rows[0].email;

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('new-private-message', message);
      io.to(`user_${senderId}`).emit('new-private-message', message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send private message' });
  }
});

router.delete('/private/messages/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM chat_private_messages WHERE id = $1 AND sender_id = $2 RETURNING *',
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Message not found or not authorized' });
    }

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

router.post('/groups/:groupId/join', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    await pool.query(
      'INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [groupId, userId]
    );

    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to join group' });
  }
});

router.post('/groups/:groupId/leave', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    await pool.query(
      'DELETE FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    res.json({ message: 'Left group successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to leave group' });
  }
});

router.post('/groups/:groupId/members', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user.id;

    const adminCheck = await pool.query(
      'SELECT is_admin FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ message: 'Only admins can add members' });
    }

    for (const memberId of memberIds) {
      await pool.query(
        'INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [groupId, memberId]
      );
    }

    res.json({ message: 'Members added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add members' });
  }
});

router.delete('/groups/:groupId/members/:memberId', auth, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const adminCheck = await pool.query(
      'SELECT is_admin FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (adminCheck.rows.length === 0 || !adminCheck.rows[0].is_admin) {
      return res.status(403).json({ message: 'Only admins can remove members' });
    }

    await pool.query(
      'DELETE FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

router.post('/private/messages/:messageId/reactions', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM chat_private_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
      [messageId, userId, emoji]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM chat_private_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, userId, emoji]
      );
      return res.json({ message: 'Reaction removed', action: 'removed' });
    }

    await pool.query(
      `INSERT INTO chat_private_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
      [messageId, userId, emoji]
    );

    res.json({ message: 'Reaction added', action: 'added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle reaction' });
  }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query
    const userId = req.user.id

    if (!q || q.trim().length < 1) {
      return res.json([])
    }

    const searchTerm = `%${q.trim()}%`

    const privateResults = await pool.query(
      `SELECT DISTINCT 
        u.id, 
        u.full_name, 
        u.email,
        'private' as type,
        u.id as contact_id,
        (
          SELECT pm.content 
          FROM chat_private_messages pm 
          WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
             OR (pm.sender_id = u.id AND pm.receiver_id = $1)
          ORDER BY pm.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT pm.created_at 
          FROM chat_private_messages pm 
          WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
             OR (pm.sender_id = u.id AND pm.receiver_id = $1)
          ORDER BY pm.created_at DESC 
          LIMIT 1
        ) as last_message_at,
        CASE 
          WHEN u.full_name ILIKE $2 THEN 'name'
          WHEN u.email ILIKE $2 THEN 'email'
        END as match_field,
        (
          SELECT pm.content 
          FROM chat_private_messages pm 
          WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
             OR (pm.sender_id = u.id AND pm.receiver_id = $1)
          AND pm.content ILIKE $2
          ORDER BY pm.created_at DESC 
          LIMIT 1
        ) as message_preview
      FROM users u
      WHERE u.id != $1 
        AND u.is_active = true
        AND (
          u.full_name ILIKE $2 
          OR u.email ILIKE $2
          OR EXISTS (
            SELECT 1 FROM chat_private_messages pm 
            WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
               OR (pm.sender_id = u.id AND pm.receiver_id = $1)
            AND pm.content ILIKE $2
          )
        )
      ORDER BY last_message_at DESC NULLS LAST`,
      [userId, searchTerm]
    )

    const groupResults = await pool.query(
      `SELECT DISTINCT g.id, g.name,'group' as type,g.id as group_id,(SELECT COUNT(*) FROM chat_group_members cgm WHERE cgm.group_id = g.id) as member_count,
      (SELECT m.content FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
      (SELECT m.created_at FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
      'group' as match_field,(SELECT m.content FROM chat_messages m WHERE m.group_id = g.id AND m.content ILIKE $1 ORDER BY m.created_at DESC LIMIT 1) as message_preview
      FROM chat_groups g
      JOIN chat_group_members cgm ON g.id = cgm.group_id
      WHERE cgm.user_id = $2 AND g.is_active = true AND (g.name ILIKE $1 OR EXISTS (SELECT 1 FROM chat_messages m WHERE m.group_id = g.id AND m.content ILIKE $1))
      ORDER BY last_message_at DESC NULLS LAST`,
      [searchTerm, userId]
    )
    const combinedResults = [...privateResults.rows, ...groupResults.rows]

    combinedResults.sort((a, b) => {
      if (a.last_message_at && b.last_message_at) {
        return new Date(b.last_message_at) - new Date(a.last_message_at)
      }
      if (a.last_message_at) return -1
      if (b.last_message_at) return 1
      return 0
    })

    res.json(combinedResults)
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ message: 'Search failed' })
  }
})

router.get('/advanced-search', auth, async (req, res) => {
  try {
    const { q, person, message, file, date, space, conversation, attachment } = req.query
    const userId = req.user.id

    if (!q || q.trim().length < 1) {
      return res.json([])
    }

    const searchTerm = `%${q.trim()}%`
    const results = []

    if (person === 'true' || person === true) {
      const personResults = await pool.query(
        `SELECT DISTINCT 
          u.id, 
          u.full_name as name,
          u.email,
          'private' as type,
          'person' as search_type,
          u.id as contact_id,
          (
            SELECT pm.content 
            FROM chat_private_messages pm 
            WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
               OR (pm.sender_id = u.id AND pm.receiver_id = $1)
            ORDER BY pm.created_at DESC 
            LIMIT 1
          ) as last_message,
          (
            SELECT pm.created_at 
            FROM chat_private_messages pm 
            WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
               OR (pm.sender_id = u.id AND pm.receiver_id = $1)
            ORDER BY pm.created_at DESC 
            LIMIT 1
          ) as last_message_at,
          CASE 
            WHEN u.full_name ILIKE $2 THEN 'name'
            WHEN u.email ILIKE $2 THEN 'email'
          END as match_field,
          NULL as file_name,
          NULL as message_date,
          NULL as message_id,
          NULL as group_id,
          NULL as sender_id,
          NULL as receiver_id,
          NULL as content
        FROM users u
        WHERE u.id != $1 
          AND u.is_active = true
          AND (u.full_name ILIKE $2 OR u.email ILIKE $2)
        ORDER BY u.full_name ASC`,
        [userId, searchTerm]
      )
      results.push(...personResults.rows)
    }

    if (message === 'true' || message === true) {
      const messageResults = await pool.query(
        `SELECT 
          m.id,
          m.id as message_id,
          m.content as title,
          m.content,
          m.created_at as message_date,
          m.group_id,
          'message' as search_type,
          'message' as type,
          u.full_name as sender_name,
          NULL as name,
          NULL as file_name,
          NULL as last_message,
          NULL as last_message_at,
          NULL as receiver_id
        FROM chat_messages m
        JOIN users u ON m.sender_id = u.id
        JOIN chat_group_members cgm ON m.group_id = cgm.group_id
        WHERE cgm.user_id = $1
          AND m.content ILIKE $2
          AND m.deleted_for_everyone = false
        ORDER BY m.created_at DESC
        LIMIT 50`,
        [userId, searchTerm]
      )
      results.push(...messageResults.rows)

      const privateMessageResults = await pool.query(
        `SELECT 
          pm.id,
          pm.id as message_id,
          pm.content as title,
          pm.content,
          pm.created_at as message_date,
          pm.sender_id,
          pm.receiver_id,
          'message' as search_type,
          'message' as type,
          u.full_name as sender_name,
          NULL as name,
          NULL as file_name,
          NULL as last_message,
          NULL as last_message_at,
          NULL as group_id
        FROM chat_private_messages pm
        JOIN users u ON pm.sender_id = u.id
        WHERE (pm.sender_id = $1 OR pm.receiver_id = $1)
          AND pm.content ILIKE $2
        ORDER BY pm.created_at DESC
        LIMIT 50`,
        [userId, searchTerm]
      )
      results.push(...privateMessageResults.rows)
    }

    if (file === 'true' || file === true || attachment === 'true' || attachment === true) {
      const fileResults = await pool.query(
        `SELECT 
          a.id,
          a.id as message_id,
          a.file_name as title,
          a.file_name,
          a.file_path,
          a.mime_type,
          m.created_at as message_date,
          m.group_id,
          'file' as search_type,
          'file' as type,
          u.full_name as sender_name,
          NULL as name,
          NULL as content,
          NULL as last_message,
          NULL as last_message_at,
          NULL as receiver_id
        FROM chat_message_attachments a
        JOIN chat_messages m ON a.message_id = m.id
        JOIN chat_group_members cgm ON m.group_id = cgm.group_id
        JOIN users u ON m.sender_id = u.id
        WHERE cgm.user_id = $1
          AND a.file_name ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT 50`,
        [userId, searchTerm]
      )
      results.push(...fileResults.rows)

      const privateFileResults = await pool.query(
        `SELECT 
          a.id,
          a.id as message_id,
          a.file_name as title,
          a.file_name,
          a.file_path,
          a.mime_type,
          pm.created_at as message_date,
          pm.sender_id,
          pm.receiver_id,
          'file' as search_type,
          'file' as type,
          u.full_name as sender_name,
          NULL as name,
          NULL as content,
          NULL as last_message,
          NULL as last_message_at,
          NULL as group_id
        FROM chat_private_attachments a
        JOIN chat_private_messages pm ON a.message_id = pm.id
        JOIN users u ON pm.sender_id = u.id
        WHERE (pm.sender_id = $1 OR pm.receiver_id = $1)
          AND a.file_name ILIKE $2
        ORDER BY pm.created_at DESC
        LIMIT 50`,
        [userId, searchTerm]
      )
      results.push(...privateFileResults.rows)
    }

    if (conversation === 'true' || conversation === true) {
      const convResults = await pool.query(
        `SELECT DISTINCT
          g.id,
          g.name as title,
          g.name,
          'group' as type,
          'conversation' as search_type,
          (SELECT COUNT(*) FROM chat_group_members WHERE group_id = g.id) as member_count,
          (SELECT m.content FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
          (SELECT m.created_at FROM chat_messages m WHERE m.group_id = g.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at,
          NULL as file_name,
          NULL as message_date,
          NULL as message_id,
          NULL as sender_id,
          NULL as receiver_id,
          NULL as content
        FROM chat_groups g
        JOIN chat_group_members cgm ON g.id = cgm.group_id
        WHERE cgm.user_id = $1
          AND g.is_active = true
          AND g.name ILIKE $2
        ORDER BY last_message_at DESC NULLS LAST`,
        [userId, searchTerm]
      )
      results.push(...convResults.rows)
    }

    if (space === 'true' || space === true) {
      const spaceResults = await pool.query(
        `SELECT DISTINCT
          u.id,
          u.full_name as title,
          u.full_name as name,
          u.email,
          'private' as type,
          'space' as search_type,
          NULL as member_count,
          NULL as last_message,
          NULL as last_message_at,
          NULL as file_name,
          NULL as message_date,
          NULL as message_id,
          NULL as group_id,
          NULL as sender_id,
          NULL as receiver_id,
          NULL as content
        FROM users u
        WHERE u.id != $1
          AND u.is_active = true
          AND EXISTS (
            SELECT 1 FROM chat_private_messages pm 
            WHERE (pm.sender_id = $1 AND pm.receiver_id = u.id) 
               OR (pm.sender_id = u.id AND pm.receiver_id = $1)
          )
        ORDER BY u.full_name ASC
        LIMIT 30`,
        [userId]
      )
      results.push(...spaceResults.rows)
    }

    results.sort((a, b) => {
      if (a.message_date && b.message_date) {
        return new Date(b.message_date) - new Date(a.message_date)
      }
      if (a.last_message_at && b.last_message_at) {
        return new Date(b.last_message_at) - new Date(a.last_message_at)
      }
      if (a.message_date) return -1
      if (b.message_date) return 1
      if (a.last_message_at) return -1
      if (b.last_message_at) return 1
      return 0
    })

    const uniqueResults = []
    const seen = new Set()
    results.forEach(r => {
      const key = `${r.type}-${r.id}`
      if (!seen.has(key)) {
        seen.add(key)
        uniqueResults.push(r)
      }
    })

    res.json(uniqueResults.slice(0, 50))
  } catch (error) {
    console.error('Advanced search error:', error)
    res.status(500).json({ message: 'Search failed' })
  }
})

module.exports = router;