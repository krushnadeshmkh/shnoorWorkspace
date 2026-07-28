const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const userSockets = new Map();

function chatSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);

    const isFirstConnection = !userSockets.has(socket.userId) || userSockets.get(socket.userId).size === 0;

    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    socket.join(`user_${socket.userId}`);

    try {
      const groupsResult = await pool.query(
        'SELECT group_id FROM chat_group_members WHERE user_id = $1',
        [socket.userId]
      );
      groupsResult.rows.forEach(row => socket.join(`group_${row.group_id}`));
    } catch (err) {
      console.error('Error joining group rooms:', err);
    }

    const onlineUserIds = Array.from(userSockets.keys());
    socket.emit('online-users', { userIds: onlineUserIds });

    if (isFirstConnection) {
      onlineUserIds.forEach(uid => {
        if (uid !== socket.userId) {
          io.to(`user_${uid}`).emit('user-online', { userId: socket.userId });
        }
      });
    }

    socket.on('join-group', (groupId) => {
      socket.join(`group_${groupId}`);
    });

    socket.on('leave-group', (groupId) => {
      socket.leave(`group_${groupId}`);
    });

    socket.on('send-message', async (data) => {
      try {
        const { groupId, content, messageType, parentMessageId, attachments } = data;

        const memberCheck = await pool.query(
          'SELECT * FROM chat_group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, socket.userId]
        );

        if (memberCheck.rows.length === 0) {
          return socket.emit('error', { message: 'Not a member of this group' });
        }

        const hasAttachments = attachments && attachments.length > 0;

        const result = await pool.query(
          `INSERT INTO chat_messages (group_id, sender_id, content, message_type, parent_message_id, has_attachments) 
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [groupId, socket.userId, content, messageType || 'text', parentMessageId || null, hasAttachments]
        );

        const message = result.rows[0];
        message.attachments = attachments || [];

        const userResult = await pool.query(
          'SELECT id, full_name, email FROM users WHERE id = $1',
          [socket.userId]
        );
        message.sender = userResult.rows[0];
        message.sender_name = userResult.rows[0].full_name;

        io.to(`group_${groupId}`).emit('new-message', message);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('send-private-message', async (data) => {
      try {
        const { receiverId, content, parentMessageId, attachments } = data;

        const hasAttachments = attachments && attachments.length > 0;

        const result = await pool.query(
          `INSERT INTO chat_private_messages (sender_id, receiver_id, content, parent_message_id, has_attachments) 
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [socket.userId, receiverId, content, parentMessageId || null, hasAttachments]
        );

        const message = result.rows[0];
        message.attachments = attachments || [];

        const userResult = await pool.query(
          'SELECT id, full_name, email FROM users WHERE id = $1',
          [socket.userId]
        );
        message.sender = userResult.rows[0];
        message.sender_name = userResult.rows[0].full_name;

        const receiverResult = await pool.query(
          'SELECT id, full_name, email FROM users WHERE id = $1',
          [receiverId]
        );
        message.receiver = receiverResult.rows[0];

        io.to(`user_${receiverId}`).emit('new-private-message', message);
        io.to(`user_${socket.userId}`).emit('new-private-message', message);
      } catch (error) {
        console.error('Error sending private message:', error);
        socket.emit('error', { message: 'Failed to send private message' });
      }
    });

    socket.on('mark-private-read', async (data) => {
      try {
        const { messageId, senderId } = data;
        await pool.query(
          'UPDATE chat_private_messages SET is_read = true WHERE id = $1',
          [messageId]
        );
        io.to(`user_${senderId}`).emit('message-read', { messageId });
      } catch (error) {
        console.error('Error marking private message as read:', error);
      }
    });

    socket.on('add-reaction', async (data) => {
      try {
        const { messageId, emoji, groupId, receiverId } = data;

        if (groupId) {
          const messageCheck = await pool.query(
            'SELECT id FROM chat_messages WHERE id = $1 AND group_id = $2',
            [messageId, groupId]
          );

          if (messageCheck.rows.length === 0) {
            return socket.emit('error', { message: 'Message not found' });
          }

          const existing = await pool.query(
            'SELECT * FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
            [messageId, socket.userId, emoji]
          );

          if (existing.rows.length > 0) {
            await pool.query(
              'DELETE FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
              [messageId, socket.userId, emoji]
            );
          } else {
            await pool.query(
              `INSERT INTO chat_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
              [messageId, socket.userId, emoji]
            );
          }

          const reactions = await pool.query(
            `SELECT r.user_id, r.emoji, u.full_name FROM chat_reactions r
             JOIN users u ON r.user_id = u.id WHERE r.message_id = $1`,
            [messageId]
          );

          io.to(`group_${groupId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });

        } else if (receiverId) {
          const messageCheck = await pool.query(
            'SELECT id FROM chat_private_messages WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)',
            [messageId, socket.userId]
          );

          if (messageCheck.rows.length === 0) {
            return socket.emit('error', { message: 'Message not found' });
          }

          const existing = await pool.query(
            'SELECT * FROM chat_private_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
            [messageId, socket.userId, emoji]
          );

          if (existing.rows.length > 0) {
            await pool.query(
              'DELETE FROM chat_private_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
              [messageId, socket.userId, emoji]
            );
          } else {
            await pool.query(
              `INSERT INTO chat_private_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)`,
              [messageId, socket.userId, emoji]
            );
          }

          const reactions = await pool.query(
            `SELECT r.user_id, r.emoji, u.full_name FROM chat_private_reactions r
             JOIN users u ON r.user_id = u.id WHERE r.message_id = $1`,
            [messageId]
          );

          io.to(`user_${receiverId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });
          io.to(`user_${socket.userId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });
        }
      } catch (error) {
        console.error('Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    socket.on('remove-reaction', async (data) => {
      try {
        const { messageId, emoji, groupId, receiverId } = data;

        if (groupId) {
          await pool.query(
            'DELETE FROM chat_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
            [messageId, socket.userId, emoji]
          );

          const reactions = await pool.query(
            `SELECT r.user_id, r.emoji, u.full_name FROM chat_reactions r
             JOIN users u ON r.user_id = u.id WHERE r.message_id = $1`,
            [messageId]
          );

          io.to(`group_${groupId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });
        } else if (receiverId) {
          await pool.query(
            'DELETE FROM chat_private_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
            [messageId, socket.userId, emoji]
          );

          const reactions = await pool.query(
            `SELECT r.user_id, r.emoji, u.full_name FROM chat_private_reactions r
             JOIN users u ON r.user_id = u.id WHERE r.message_id = $1`,
            [messageId]
          );

          io.to(`user_${receiverId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });
          io.to(`user_${socket.userId}`).emit('reaction-updated', {
            messageId,
            reactions: reactions.rows
          });
        }
      } catch (error) {
        console.error('Error removing reaction:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    });

    socket.on('delete-message', async (data) => {
      try {
        const { messageId, groupId } = data;

        const result = await pool.query(
          'DELETE FROM chat_messages WHERE id = $1 AND sender_id = $2 RETURNING *',
          [messageId, socket.userId]
        );

        if (result.rows.length > 0) {
          io.to(`group_${groupId}`).emit('message-deleted', { messageId });
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('delete-private-message', async (data) => {
      try {
        const { messageId } = data;

        const result = await pool.query(
          'DELETE FROM chat_private_messages WHERE id = $1 AND sender_id = $2 RETURNING receiver_id',
          [messageId, socket.userId]
        );

        if (result.rows.length > 0) {
          const receiverId = result.rows[0].receiver_id;
          io.to(`user_${receiverId}`).emit('private-message-deleted', { messageId });
          io.to(`user_${socket.userId}`).emit('private-message-deleted', { messageId });
        }
      } catch (error) {
        console.error('Error deleting private message:', error);
        socket.emit('error', { message: 'Failed to delete private message' });
      }
    });

    socket.on('typing', (data) => {
      const { groupId, isTyping } = data;
      socket.to(`group_${groupId}`).emit('user-typing', {
        userId: socket.userId,
        isTyping
      });
    });

    socket.on('private-typing', (data) => {
      const { receiverId, isTyping } = data;
      io.to(`user_${receiverId}`).emit('user-private-typing', {
        userId: socket.userId,
        isTyping
      });
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(socket.userId);
          const allUsers = Array.from(userSockets.keys());
          allUsers.forEach(uid => {
            io.to(`user_${uid}`).emit('user-offline', { userId: socket.userId });
          });
        }
      }
      console.log(`User ${socket.userId} disconnected`);
    });
  });
}

module.exports = chatSocket;