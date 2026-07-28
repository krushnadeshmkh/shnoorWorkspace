const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/authMiddleware');

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

router.post('/groups', auth, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    const createdBy = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Group name is required' });
    }
    
    const groupResult = await pool.query(
      `INSERT INTO chat_groups (name, description, created_by) 
       VALUES ($1, $2, $3) RETURNING *`,
      [name, description || '', createdBy]
    );
    
    const groupId = groupResult.rows[0].id;
    
    await pool.query(
      'INSERT INTO chat_group_members (group_id, user_id, is_admin) VALUES ($1, $2, true)',
      [groupId, createdBy]
    );
    
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const userResult = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND is_active = true',
          [email.toLowerCase()]
        );
        if (userResult.rows.length > 0) {
          await pool.query(
            'INSERT INTO chat_group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [groupId, userResult.rows[0].id]
          );
        }
      }
    }
    
    res.status(201).json({
      message: 'Group created successfully',
      group: groupResult.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

router.put('/groups/:groupId', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, isActive } = req.body;
    
    const result = await pool.query(
      `UPDATE chat_groups 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description),
           is_active = COALESCE($3, is_active)
       WHERE id = $4 RETURNING *`,
      [name, description, isActive, groupId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    res.json({
      message: 'Group updated successfully',
      group: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update group' });
  }
});

router.delete('/groups/:groupId', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    const checkResult = await pool.query(
      'SELECT * FROM chat_groups WHERE id = $1',
      [groupId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    await pool.query('DELETE FROM chat_group_members WHERE group_id = $1', [groupId]);
    await pool.query('DELETE FROM chat_messages WHERE group_id = $1', [groupId]);
    await pool.query('DELETE FROM chat_groups WHERE id = $1', [groupId]);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

router.post('/groups/:groupId/members', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userEmail, isAdmin } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }
    
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND is_active = true',
      [userEmail.toLowerCase()]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    await pool.query(
      `INSERT INTO chat_group_members (group_id, user_id, is_admin) 
       VALUES ($1, $2, $3) ON CONFLICT (group_id, user_id) DO UPDATE SET is_admin = EXCLUDED.is_admin`,
      [groupId, userId, isAdmin || false]
    );
    
    res.json({ message: 'Member added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

router.put('/groups/:groupId/members/:userId/mute', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { muted } = req.body;
    
    const result = await pool.query(
      'UPDATE chat_group_members SET is_muted = $1 WHERE group_id = $2 AND user_id = $3 RETURNING *',
      [muted, groupId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }
    
    res.json({ 
      message: `Member ${muted ? 'muted' : 'unmuted'} successfully`,
      isMuted: muted
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle mute status' });
  }
});

router.put('/groups/:groupId/members/:userId/admin', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { isAdmin } = req.body;
    
    const result = await pool.query(
      'UPDATE chat_group_members SET is_admin = $1 WHERE group_id = $2 AND user_id = $3 RETURNING *',
      [isAdmin, groupId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }
    
    res.json({ 
      message: `Member ${isAdmin ? 'made admin' : 'removed as admin'} successfully`,
      isAdmin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to toggle admin status' });
  }
});

router.delete('/groups/:groupId/members/:userId', auth, authorizeAdmin, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM chat_group_members WHERE group_id = $1 AND user_id = $2 RETURNING *',
      [groupId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Member not found in this group' });
    }
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

router.get('/users', auth, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, is_active, created_at 
       FROM users 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

router.put('/users/:userId/status', auth, authorizeAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }
    
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, full_name, email, role, is_active',
      [isActive, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

router.put('/users/:userId/role', auth, authorizeAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }
    
    if (!['admin', 'employee'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role, is_active',
      [role, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: `User role updated to ${role}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update user role' });
  }
});


router.delete('/users/:userId', auth, authorizeAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await pool.query('BEGIN');
    
    await pool.query('DELETE FROM chat_reactions WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM chat_message_attachments WHERE message_id IN (SELECT id FROM chat_messages WHERE sender_id = $1)', [userId]);
    await pool.query('DELETE FROM chat_messages WHERE sender_id = $1', [userId]);
    await pool.query('DELETE FROM chat_private_attachments WHERE message_id IN (SELECT id FROM chat_private_messages WHERE sender_id = $1 OR receiver_id = $1)', [userId]);
    await pool.query('DELETE FROM chat_private_messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await pool.query('DELETE FROM chat_group_members WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM email_attachments WHERE email_id IN (SELECT id FROM emails WHERE sender_id = $1 OR receiver_id = $1)', [userId]);
    await pool.query('DELETE FROM email_label_mappings WHERE email_id IN (SELECT id FROM emails WHERE sender_id = $1 OR receiver_id = $1)', [userId]);
    await pool.query('DELETE FROM emails WHERE sender_id = $1 OR receiver_id = $1', [userId]);
    await pool.query('DELETE FROM email_drafts WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM email_labels WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM email_filters WHERE user_id = $1', [userId]);
    
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await pool.query('COMMIT');
    
    res.json({ message: 'User and all related data deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

router.get('/stats', auth, authorizeAdmin, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeUsers = await pool.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const totalGroups = await pool.query('SELECT COUNT(*) FROM chat_groups');
    const totalEmails = await pool.query('SELECT COUNT(*) FROM emails');
    const totalMessages = await pool.query('SELECT COUNT(*) FROM chat_messages');
    
    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count),
      totalGroups: parseInt(totalGroups.rows[0].count),
      totalEmails: parseInt(totalEmails.rows[0].count),
      totalMessages: parseInt(totalMessages.rows[0].count)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

router.get('/email-logs', auth, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, 
              u1.full_name as sender_name,
              u1.email as sender_email,
              u2.full_name as receiver_name,
              u2.email as receiver_email,
              'sent' as status,
              e.created_at
       FROM emails e
       JOIN users u1 ON e.sender_id = u1.id
       JOIN users u2 ON e.receiver_id = u2.id
       ORDER BY e.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch email logs' });
  }
});

router.get('/chat-logs', auth, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cm.*, 
              u.full_name as sender_name,
              u.email as sender_email,
              cg.name as group_name
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       LEFT JOIN chat_groups cg ON cm.group_id = cg.id
       ORDER BY cm.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch chat logs' });
  }
});

router.get('/activity-logs', auth, authorizeAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        'login' as type,
        u.full_name as user_name,
        'logged in' as action,
        '' as details,
        u.created_at as created_at,
        '' as ip
       FROM users u
       ORDER BY u.created_at DESC
       LIMIT 100`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
});

module.exports = router;