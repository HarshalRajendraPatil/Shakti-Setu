const Message = require('../models/Message');
const Consultation = require('../models/Consultation');

// Get messages for a consultation (only if actor is party and consultation is accepted)
const getConsultationForChat = async (consultationId, chatActor) => {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) return { err: 'NOT_FOUND' };
  if (consultation.status !== 'accepted') return { err: 'CHAT_NOT_AVAILABLE' };
  const isUser = chatActor.type === 'user';
  const partyId = isUser ? consultation.user?.toString() : consultation.lawyer?.toString();
  if (partyId !== chatActor.id) return { err: 'FORBIDDEN' };
  return { consultation };
};

exports.getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { consultation, err } = await getConsultationForChat(consultationId, req.chatActor);
    if (err) {
      if (err === 'NOT_FOUND') return res.status(404).json({ message: 'Consultation not found' });
      if (err === 'CHAT_NOT_AVAILABLE') return res.status(400).json({ message: 'Chat is not available for this consultation' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ consultation: consultationId })
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      messages,
      consultation: {
        id: consultation._id,
        subject: consultation.subject,
        user: consultation.user,
        lawyer: consultation.lawyer,
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { content } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    const trimmed = content.trim().slice(0, 2000);

    const { consultation, err } = await getConsultationForChat(consultationId, req.chatActor);
    if (err) {
      if (err === 'NOT_FOUND') return res.status(404).json({ message: 'Consultation not found' });
      if (err === 'CHAT_NOT_AVAILABLE') return res.status(400).json({ message: 'Chat is not available for this consultation' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      consultation: consultationId,
      senderType: req.chatActor.type,
      senderId: req.chatActor.id,
      content: trimmed,
    });
    await message.save();

    res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        consultation: message.consultation,
        senderType: message.senderType,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
