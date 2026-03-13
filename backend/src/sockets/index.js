const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/notificationHelper');

// Active calls tracking
const activeCalls = new Map();

module.exports = (io, socket) => {
  // User joins their private room for signaling and status checks
  if (socket.user?._id) {
    socket.join(`user:${socket.user._id}`);
  }

  socket.on('join-conversation', (id) => socket.join(`conversation:${id}`));
  socket.on('leave-conversation', (id) => socket.leave(`conversation:${id}`));

  // --- Typing Indicators ---
  socket.on('typing-start', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      userId: socket.user._id,
      username: socket.user.username,
      conversationId,
    });
  });

  socket.on('typing-stop', ({ conversationId }) => {
    socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
      userId: socket.user._id,
      conversationId,
    });
  });

  // --- Messaging Logic with Push Notifications ---
  socket.on('send-message', async (data) => {
    try {
      const { conversationId, content, type = 'text', mediaUrl = '' } = data;
      
      // Populate participants to get user details for notification
      const conversation = await Conversation.findById(conversationId).populate('participants.userId');
      if (!conversation) return;

      const otherParticipants = conversation.participants.filter(
        p => p.userId._id.toString() !== socket.user._id.toString()
      );
      const otherIds = otherParticipants.map(p => p.userId._id);

      // Blocking Check
      const isBlockedByOther = await User.exists({ _id: { $in: otherIds }, blockedUsers: socket.user._id });
      const userDoc = await User.findById(socket.user._id);
      const hasBlockedOther = (userDoc.blockedUsers || []).some((blockedId) =>
        otherIds.some((oid) => oid.toString() === blockedId.toString())
      );

      if (isBlockedByOther || hasBlockedOther) {
        return socket.emit('error', { message: 'Message failed: User blocked' });
      }

      // Create Message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        content, type, mediaUrl
      });

      // Update Conversation Timestamp and Last Message
      const updatedConv = await Conversation.findByIdAndUpdate(
        conversationId, 
        { lastMessage: message._id, updatedAt: Date.now() },
        { new: true }
      ).populate('participants.userId', 'username avatar');

      const populated = await message.populate('sender', 'username avatar');
      
      // Emit message to active conversation room
      io.to(`conversation:${conversationId}`).emit('new-message', populated);
      
      // Update sidebar for all participants
      if (updatedConv?.participants?.length) {
        updatedConv.participants.forEach((p) => {
          const id = p.userId?._id?.toString?.() || p.userId?.toString?.();
          if (id) io.to(`user:${id}`).emit('conversation-updated', updatedConv);
        });
      }

      // --- PUSH NOTIFICATION LOGIC FOR OFFLINE USERS ---
      for (const participant of otherParticipants) {
        const targetId = participant.userId._id.toString();
        
        // Check if the recipient is NOT in their private socket room
        const isOnline = io.sockets.adapter.rooms.has(`user:${targetId}`);

        if (!isOnline) {
          sendPushNotification(targetId, {
            title: `New message from ${socket.user.username}`,
            body: content.length > 50 ? content.substring(0, 47) + '...' : content,
            icon: '/logo192.png',
            data: {
              conversationId: conversationId,
              url: `/chat/${conversationId}`, // Deep link to chat
            },
          });
        }
      }

    } catch (err) { 
      console.error('Socket send-message error:', err); 
    }
  });

  // --- Message Editing ---
  socket.on('edit-message', async ({ messageId, content }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (msg.sender.toString() !== socket.user._id.toString()) return;
      msg.editHistory.push({ content: msg.content, editedAt: new Date() });
      msg.content = content;
      msg.edited = true;
      await msg.save();
      const updated = await msg.populate('sender', 'username avatar');
      io.to(`conversation:${msg.conversation}`).emit('message-updated', updated);
    } catch (err) {
      console.error('Socket edit-message error:', err);
    }
  });

  // --- Message Deletion (soft) ---
  socket.on('delete-message', async ({ messageId }) => {
    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;
      if (msg.sender.toString() !== socket.user._id.toString()) return;
      msg.content = null;
      msg.type = 'deleted';
      await msg.save();
      const updated = await msg.populate('sender', 'username avatar');
      io.to(`conversation:${msg.conversation}`).emit('message-updated', updated);
    } catch (err) {
      console.error('Socket delete-message error:', err);
    }
  });

  // --- Reactions (toggle) ---
 // Reaction socket event fix
socket.on('add-reaction', async ({ messageId, emoji }) => {
  try {
    // 1. Pehle userId nikaalein (jo socket connection ke waqt save ki gayi thi)
    const currentUserId = socket.user?._id || socket.userId; 

    if (!currentUserId) {
      console.error('Socket add-reaction error: User not authenticated');
      return;
    }

    const msg = await Message.findById(messageId);
    if (!msg) return;

    // 2. userId ki jagah ab currentUserId use karein
    const existingIndex = msg.reactions.findIndex(
      (r) => r.userId.toString() === currentUserId.toString() && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Agar reaction pehle se hai toh remove karein
      msg.reactions.splice(existingIndex, 1);
    } else {
      // Warna add karein
      msg.reactions.push({ userId: currentUserId, emoji });
    }

    await msg.save();

    // 3. Populate karke wapas bhejein
    const populatedMsg = await Message.findById(messageId)
      .populate('sender', 'username avatar')
      .populate('reactions.userId', 'username');

    io.to(`conversation:${msg.conversation}`).emit('message-updated', populatedMsg);
  } catch (error) {
    console.error('Socket add-reaction error:', error);
  }
});
  // --- WebRTC Signaling ---
  socket.on('call-user', (data) => {
    const { targetUserId, offer, callType } = data;
    const callId = `call_${socket.user._id}_${Date.now()}`;
    activeCalls.set(callId, { callerId: socket.user._id, targetUserId, status: 'ringing' });

    // Let caller know the callId (needed for end/reject flows)
    socket.emit('call-created', { callId, targetUserId, callType });

    io.to(`user:${targetUserId}`).emit('incoming-call', {
      callId,
      callerId: socket.user._id,
      callerName: socket.user.username,
      callType,
      offer,
    });
  });

  socket.on('answer-call', (data) => {
    const { callId, answer, targetUserId } = data;
    if (activeCalls.has(callId)) activeCalls.get(callId).status = 'connected';
    io.to(`user:${targetUserId}`).emit('call-answered', { callId, answer });
  });

  socket.on('ice-candidate', (data) => {
    const { candidate, targetUserId } = data;
    io.to(`user:${targetUserId}`).emit('ice-candidate', { candidate, from: socket.user._id });
  });

  socket.on('end-call', (data) => {
    const { callId, targetUserId } = data;
    activeCalls.delete(callId);
    io.to(`user:${targetUserId}`).emit('call-ended', { callId });
  });

  socket.on('reject-call', (data) => {
    const { callId, targetUserId } = data;
    activeCalls.delete(callId);
    io.to(`user:${targetUserId}`).emit('call-rejected', { callId });
  });

  socket.on('disconnect', () => {
    activeCalls.forEach((call, callId) => {
      if (call.callerId === socket.user._id || call.targetUserId === socket.user._id) {
        const target = call.callerId === socket.user._id ? call.targetUserId : call.callerId;
        io.to(`user:${target}`).emit('call-ended', { callId });
        activeCalls.delete(callId);
      }
    });
  });
};