const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;
    if (!q || q.trim().length < 2) {return res.json({ emails: [], chats: [], users: [] });}
    const searchTerm = `%${q.trim()}%`;
    const emails = await pool.query(`SELECT e.id, e.subject, e.content, e.created_at,u.full_name as sender_name, u.email as sender_email,'email' as type
    FROM emails e JOIN users u ON e.sender_id = u.id WHERE (e.receiver_id = $1 OR e.sender_id = $1) AND (e.subject ILIKE $2 OR e.content ILIKE $2) AND e.is_deleted = false ORDER BY e.created_at DESC
    LIMIT 20`,[userId, searchTerm]);
    
    const chats = await pool.query(`SELECT m.id, m.content, m.created_at,u.full_name as sender_name,g.name as group_name,m.group_id,'chat' as type FROM chat_messages m JOIN users u ON m.sender_id = u.id LEFT JOIN chat_groups g ON m.group_id = g.id
    LEFT JOIN chat_group_members gm ON gm.group_id = g.id AND gm.user_id = $1 WHERE (gm.user_id = $1 OR m.sender_id = $1) AND m.content ILIKE $2 ORDER BY m.created_at DESC
    LIMIT 20`,[userId, searchTerm]);
    
    const users = await pool.query(`SELECT id, full_name, email, 'user' as type FROM users WHERE id != $1 AND (full_name ILIKE $2 OR email ILIKE $2) AND is_active = true
    LIMIT 10`,[userId, searchTerm]);
    
    const privateChats = await pool.query(`SELECT pm.id, pm.content, pm.created_at, pm.sender_id, pm.receiver_id, u.full_name as sender_name, NULL as group_name, NULL as group_id, 'private_chat' as type, CASE WHEN pm.sender_id = $1 THEN pm.receiver_id ELSE pm.sender_id END as contact_id FROM chat_private_messages pm JOIN users u ON pm.sender_id = u.id WHERE (pm.sender_id = $1 OR pm.receiver_id = $1) AND pm.content ILIKE $2 ORDER BY pm.created_at DESC
    LIMIT 20`,[userId, searchTerm]);
    
    const allChats = [...chats.rows, ...privateChats.rows].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    ).slice(0, 20);
    
    res.json({
      emails: emails.rows,
      chats: allChats,
      users: users.rows
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;