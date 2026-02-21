import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

function DiscussionForum({ eventId, isOrganizer }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const messagesEndRef = useRef(null);
    const pollRef = useRef(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`http://localhost:8000/api/discussions/${eventId}/messages`, {
                credentials: "include"
            });
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages || []);
            }
        } catch  {
            console.error("Failed to fetch messages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        // Poll every 5 seconds for new messages
        pollRef.current = setInterval(fetchMessages, 5000);
        return () => clearInterval(pollRef.current);
    }, [eventId]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (messages.length > 0) scrollToBottom();
    }, [messages.length]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        setSending(true);
        setError("");

        try {
            const res = await fetch(`http://localhost:8000/api/discussions/${eventId}/messages`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage.trim(),
                    parentMessage: replyTo?._id || null
                })
            });

            const data = await res.json();
            if (res.ok) {
                setNewMessage("");
                setReplyTo(null);
                fetchMessages();
            } else {
                setError(data.message || "Failed to send");
            }
        } catch {
            setError("Network error");
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/discussions/messages/${messageId}`, {
                method: "DELETE",
                credentials: "include"
            });
            if (res.ok) fetchMessages();
        } catch {
            console.error("Delete failed");
        }
    };

    const handlePin = async (messageId) => {
        try {
            const res = await fetch(`http://localhost:8000/api/discussions/messages/${messageId}/pin`, {
                method: "PATCH",
                credentials: "include"
            });
            if (res.ok) fetchMessages();
        } catch  {
            console.error("Pin failed");
        }
    };

    const handleReact = async (messageId, reaction) => {
        try {
            const res = await fetch(`http://localhost:8000/api/discussions/messages/${messageId}/react`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reaction })
            });
            if (res.ok) fetchMessages();
        } catch  {
            console.error("React failed");
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return "just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    // Separate pinned and regular messages; group replies under parents
    const pinnedMessages = messages.filter(m => m.isPinned && !m.parentMessage);
    const topLevelMessages = messages.filter(m => !m.isPinned && !m.parentMessage);
    const replies = messages.filter(m => m.parentMessage);

    const getReplies = (parentId) => replies.filter(r => r.parentMessage?.toString() === parentId?.toString());

    const renderMessage = (msg, isReply = false) => {
        const isOwn = user && msg.sender === user._id;
        const msgReplies = getReplies(msg._id);

        return (
            <div key={msg._id} style={{ marginLeft: isReply ? '24px' : '0', marginBottom: '4px' }}>
                <div style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: msg.isPinned ? 'rgba(212, 181, 212, 0.12)' : isOwn ? 'rgba(212, 181, 212, 0.08)' : 'var(--surface)',
                    border: msg.isPinned ? '1px solid var(--accent-light)' : '1px solid var(--border)',
                    position: 'relative'
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: msg.senderRole === 'Organizer' ? 'var(--accent)' : 'var(--text-primary)'
                        }}>
                            {msg.senderName}
                        </span>
                        {msg.senderRole === 'Organizer' && (
                            <span style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--accent)',
                                color: 'white',
                                fontWeight: 600
                            }}>
                                ORGANIZER
                            </span>
                        )}
                        {msg.isPinned && (
                            <span style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: '#e8d5c0',
                                color: '#5c4d42',
                                fontWeight: 600
                            }}>
                                PINNED
                            </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-light)', marginLeft: 'auto' }}>
                            {formatTime(msg.createdAt)}
                        </span>
                    </div>

                    {/* Content */}
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5', wordBreak: 'break-word' }}>
                        {msg.content}
                    </p>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {/* Reactions */}
                        {["like", "love", "insightful"].map(r => {
                            const count = msg.reactions?.[r]?.length || 0;
                            const hasReacted = user && msg.reactions?.[r]?.includes(user._id);
                            const labels = { like: "👍", love: "❤️", insightful: "💡" };
                            return (
                                <button
                                    key={r}
                                    onClick={() => handleReact(msg._id, r)}
                                    style={{
                                        border: hasReacted ? '1px solid var(--accent)' : '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '2px 8px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: hasReacted ? 'rgba(212,181,212,0.15)' : 'transparent',
                                        color: 'var(--text-secondary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                    }}
                                >
                                    {labels[r]} {count > 0 && <span>{count}</span>}
                                </button>
                            );
                        })}

                        {/* Reply */}
                        {!isReply && (
                            <button
                                onClick={() => setReplyTo(msg)}
                                style={{
                                    border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '12px', color: 'var(--text-light)', padding: '2px 6px'
                                }}
                            >
                                Reply
                            </button>
                        )}

                        {/* Pin (organizer only) */}
                        {isOrganizer && !isReply && (
                            <button
                                onClick={() => handlePin(msg._id)}
                                style={{
                                    border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '12px', color: 'var(--text-light)', padding: '2px 6px'
                                }}
                            >
                                {msg.isPinned ? "Unpin" : "Pin"}
                            </button>
                        )}

                        {/* Delete (organizer or own) */}
                        {(isOrganizer || isOwn) && (
                            <button
                                onClick={() => handleDelete(msg._id)}
                                style={{
                                    border: 'none', background: 'none', cursor: 'pointer',
                                    fontSize: '12px', color: '#dc3545', padding: '2px 6px', marginLeft: 'auto'
                                }}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Render replies */}
                {msgReplies.length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                        {msgReplies.map(r => renderMessage(r, true))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg)'
        }}>
            {/* Header */}
            <div style={{
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>Discussion</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Messages Area */}
            <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-light)' }}>
                        <p style={{ fontSize: '14px', margin: 0 }}>No messages yet. Start the discussion!</p>
                    </div>
                ) : (
                    <>
                        {pinnedMessages.map(m => renderMessage(m))}
                        {pinnedMessages.length > 0 && topLevelMessages.length > 0 && (
                            <div style={{ borderTop: '1px dashed var(--border)', margin: '4px 0' }} />
                        )}
                        {topLevelMessages.map(m => renderMessage(m))}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '6px 16px', color: '#dc3545', fontSize: '13px', backgroundColor: '#fff5f5' }}>
                    {error}
                </div>
            )}

            {/* Reply indicator */}
            {replyTo && (
                <div style={{
                    padding: '6px 16px',
                    backgroundColor: 'rgba(212,181,212,0.1)',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                }}>
                    <span>Replying to <strong>{replyTo.senderName}</strong></span>
                    <button
                        onClick={() => setReplyTo(null)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '16px' }}
                    >
                        x
                    </button>
                </div>
            )}

            {/* Input Area */}
            {user && (
                <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: 'var(--surface)'
                }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder="Type a message..."
                        maxLength={1000}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '14px',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text-primary)',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        style={{
                            padding: '10px 20px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            cursor: newMessage.trim() && !sending ? 'pointer' : 'not-allowed',
                            opacity: newMessage.trim() && !sending ? 1 : 0.5,
                            fontWeight: 600,
                            fontSize: '14px',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {sending ? "..." : "Send"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default DiscussionForum;
