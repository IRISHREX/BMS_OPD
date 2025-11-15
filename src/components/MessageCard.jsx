import React, { useState } from 'react';
import {
  MdDelete,
  MdMarkEmailRead,
  MdMarkEmailUnread,
  MdReply,
} from 'react-icons/md';

const MessageCard = ({
  message,
  isSelected,
  onToggleSelect,
  onUpdateStatus,
  onDelete,
  onReply,
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(message, replyText);
      setReplyText('');
      setShowReply(false);
    }
  };

  return (
    <div className={`message-card ${!message.read ? 'unread' : ''}`}>
      {/* Debug: inspect message shape when rendering cards */}
      {typeof window !== 'undefined' && (function(){ try { console.log('[MessageCard] rendering message', { id: message._id, recipient: message.recipient }); } catch(e){} return null })()}
      <div className="message-selection">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(message._id)}
        />
      </div>
      <div className="message-content">
        <div className="message-sender">
          <span>{message.firstName} {message.lastName}</span>
          <span className="message-contact">{message.email} • {message.phone}</span>
        </div>
        <p className="message-body">{message.message}</p>
        {message.recipient && (
          <p className="message-recipient">
            To: {message.recipient.firstName} {message.recipient.lastName}
          </p>
        )}
        <p className="message-timestamp">
          {new Date(message.createdAt).toLocaleString()}
        </p>
        {showReply && (
          <form onSubmit={handleReplySubmit} className="reply-form">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows="3"
            />
            <div className="reply-actions">
              <button type="submit" className="btn btn-primary">
                Send Reply
              </button>
              <button
                type="button"
                onClick={() => setShowReply(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="message-actions">
        <button
          onClick={() => onUpdateStatus([message._id], !message.read)}
          className="btn-icon"
          title={message.read ? 'Mark as Unread' : 'Mark as Read'}
        >
          {message.read ? <MdMarkEmailUnread size="1.2rem" /> : <MdMarkEmailRead size="1.2rem" />}
        </button>
        <button
          onClick={() => onDelete([message._id])}
          className="btn-icon btn-danger"
          title="Delete"
        >
          <MdDelete size="1.2rem" />
        </button>
        <button
          onClick={() => setShowReply(!showReply)}
          className="btn-icon"
          title="Quick Reply"
        >
          <MdReply size="1.2rem" />
        </button>
      </div>
    </div>
  );
};

export default MessageCard;
