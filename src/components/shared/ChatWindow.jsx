import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, activeUser, currentUser, onSend, loading }) => {
  const [text, setText]   = useState('');
  const bottomRef         = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  if (!activeUser) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 14 }}>
        Select a conversation to start messaging
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', background: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a2f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
          {activeUser.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{activeUser.name}</div>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'capitalize' }}>{activeUser.role}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', background: '#f9f9f9' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13 }}>Loading...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 }}>No messages yet. Say hello!</div>
        ) : (
          messages.map(m => (
            <MessageBubble key={m._id} message={m} isOwn={m.sender._id === currentUser.id || m.sender === currentUser.id} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ padding: '12px 16px', borderTop: '1px solid #eee', background: '#fff', display: 'flex', gap: 10 }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '9px 14px', borderRadius: 22, border: '1px solid #ddd', fontSize: 13, outline: 'none' }}
        />
        <button type="submit"
          style={{ padding: '9px 20px', borderRadius: 22, border: 'none', background: '#1a2f1e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;