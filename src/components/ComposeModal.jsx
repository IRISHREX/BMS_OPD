import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ComposeModal = ({ onClose, doctors, user }) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!recipient || !message) {
      return toast.error('Please select a recipient and write a message.');
    }
    try {
      await api.post('/api/v1/message/send', {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        message,
        recipient,
      });
      toast.success('Message sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Compose New Message</h2>
        <select
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        >
          <option value="">Select a Recipient</option>
          {doctors.map((doc) => (
            <option key={doc._id} value={doc._id}>
              Dr. {doc.firstName} {doc.lastName}
            </option>
          ))}
        </select>
        <textarea
          rows="10"
          placeholder="Write your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={handleSend} className="btn btn-primary">
            Send Message
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeModal;
