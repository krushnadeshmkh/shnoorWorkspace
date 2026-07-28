import React, { createContext, useEffect, useState } from 'react'
import io from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const { token, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'https://shnoorworkspace.onrender.com', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    const notifyIncoming = (message, type) => {
      if (message.sender_id === user?.id) return
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      if (!document.hidden && document.hasFocus()) return

      const senderName = message.sender_name || message.sender?.full_name || 'New message'
      const body = message.content || (message.attachments?.length ? 'Sent an attachment' : 'New message')
      const notification = new Notification(senderName, { body })

      notification.onclick = () => {
        window.focus()
        const basePath = user?.role === 'admin' ? '/admin' : '/employee'
        const target = type === 'group'
          ? `${basePath}/chat/group/${message.group_id}`
          : `${basePath}/chat/private/${message.sender_id}`
        navigate(target)
      }
    }

    socketInstance.on('connect', () => {
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
    })

    socketInstance.on('online-users', ({ userIds }) => {
      setOnlineUsers(new Set(userIds.map(String)))
    })

    socketInstance.on('user-online', ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.add(String(userId))
        return newSet
      })
    })

    socketInstance.on('user-offline', ({ userId }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(String(userId))
        return newSet
      })
    })

    socketInstance.on('message-delivered', ({ messageId }) => {})

    socketInstance.on('message-read', ({ messageId }) => {})

    socketInstance.on('new-message', (message) => {
      notifyIncoming(message, 'group')
    })

    socketInstance.on('new-private-message', (message) => {
      notifyIncoming(message, 'private')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
      setSocket(null)
    }
  }, [token, user])

  const joinGroup = (groupId) => {
    if (socket && isConnected) socket.emit('join-group', groupId)
  }

  const leaveGroup = (groupId) => {
    if (socket && isConnected) socket.emit('leave-group', groupId)
  }

  const sendMessage = (data) => {
    if (socket && isConnected) {
      socket.emit('send-message', {
        groupId: data.groupId,
        content: data.content,
        messageType: data.messageType || 'text',
        parentMessageId: data.parentMessageId || null,
        attachments: data.attachments || []
      })
    }
  }

  const sendPrivateMessage = (data) => {
    if (socket && isConnected) {
      socket.emit('send-private-message', {
        receiverId: data.receiverId,
        content: data.content,
        parentMessageId: data.parentMessageId || null,
        attachments: data.attachments || []
      })
    }
  }

  const addReaction = (data) => {
    if (socket && isConnected) {
      const { messageId, emoji, groupId, receiverId } = data
      if (groupId) {
        socket.emit('add-reaction', { messageId, emoji, groupId })
      } else if (receiverId) {
        socket.emit('add-reaction', { messageId, emoji, receiverId })
      } else {
        socket.emit('add-reaction', { messageId, emoji })
      }
    }
  }

  const deleteMessage = (data) => {
    if (socket && isConnected) socket.emit('delete-message', data)
  }

  const deletePrivateMessage = (data) => {
    if (socket && isConnected) socket.emit('delete-private-message', data)
  }

  const sendTyping = (data) => {
    if (socket && isConnected) socket.emit('typing', data)
  }

  const sendPrivateTyping = (data) => {
    if (socket && isConnected) socket.emit('private-typing', data)
  }

  const markPrivateRead = (data) => {
    if (socket && isConnected) socket.emit('mark-private-read', data)
  }

  const isUserOnline = (userId) => {
    return onlineUsers.has(String(userId))
  }

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      onlineUsers,
      isUserOnline,
      joinGroup,
      leaveGroup,
      sendMessage,
      sendPrivateMessage,
      addReaction,
      deleteMessage,
      deletePrivateMessage,
      sendTyping,
      sendPrivateTyping,
      markPrivateRead,
    }}>
      {children}
    </SocketContext.Provider>
  )
}