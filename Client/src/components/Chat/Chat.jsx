import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getUserConsultations, getLawyerConsultations } from "../../store/slices/consultationSlice";
import { chatAPI } from "../../services/api";
import GlassCard from "../common/GlassCard";
import { MessageCircle, Send, ArrowLeft, AlertCircle } from "lucide-react";

const POLL_INTERVAL_MS = 3000;

const Chat = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { isAuthenticated: isLawyerAuthenticated } = useSelector((state) => state.lawyer);
  const { consultations } = useSelector((state) => state.consultation);

  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const isUser = isAuthenticated && !isLawyerAuthenticated;
  const isLawyer = isLawyerAuthenticated;

  const acceptedList = isUser
    ? (consultations || []).filter((c) => c.status === "accepted")
    : (consultations || []).filter((c) => c.status === "accepted");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async (consultationId) => {
    if (!consultationId) return;
    try {
      const res = await chatAPI.getMessages(consultationId, isLawyer);
      setMessages(res.data.messages || []);
      setChatError(null);
    } catch (e) {
      if (e.response?.status === 400 && e.response?.data?.message?.toLowerCase().includes("not available")) {
        setChatError("This chat is no longer available (consultation may be completed).");
        setSelectedConsultation(null);
        setMessages([]);
        refreshList();
      } else {
        setChatError(e.response?.data?.message || "Failed to load messages");
      }
    }
  };

  const refreshList = () => {
    if (isUser) dispatch(getUserConsultations());
    if (isLawyer) dispatch(getLawyerConsultations("accepted"));
  };

  useEffect(() => {
    if (!isUser && !isLawyer) return;
    if (isUser) dispatch(getUserConsultations());
    if (isLawyer) dispatch(getLawyerConsultations("accepted"));
  }, [dispatch, isUser, isLawyer]);

  useEffect(() => {
    if (!selectedConsultation) {
      setMessages([]);
      setChatError(null);
      return;
    }
    const cid = selectedConsultation._id || selectedConsultation.id;
    fetchMessages(cid);

    pollRef.current = setInterval(() => {
      fetchMessages(cid);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedConsultation?._id || selectedConsultation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || !selectedConsultation || sending) return;
    const cid = selectedConsultation._id || selectedConsultation.id;
    setSending(true);
    setInputValue("");
    try {
      const res = await chatAPI.sendMessage(cid, text, isLawyer);
      const newMsg = res.data.message;
      setMessages((prev) => [...prev, newMsg]);
    } catch (e) {
      setChatError(e.response?.data?.message || "Failed to send message");
      setInputValue(text);
    } finally {
      setSending(false);
    }
  };

  const otherPartyName = selectedConsultation
    ? isUser
      ? selectedConsultation.lawyer?.name || "Lawyer"
      : selectedConsultation.user?.name || "User"
    : "";

  if (!isAuthenticated && !isLawyerAuthenticated) {
    return (
      <div className="page-container center-content">
        <GlassCard style={{ maxWidth: "400px", textAlign: "center", padding: "2rem" }}>
          <MessageCircle size={48} color="var(--text-muted)" style={{ marginBottom: "1rem" }} />
          <p style={{ color: "var(--text-muted)" }}>Please log in to use chat.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "1rem" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MessageCircle size={26} color="#a855f7" />
          Chat
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {isUser
            ? "Chat with lawyers who have accepted your consultation request. Chat is removed when the lawyer marks the consultation as complete."
            : "Chat with users whose consultation requests you have accepted. Chat is removed when you mark the consultation as complete."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedConsultation ? "240px 1fr" : "1fr", gap: "1rem", minHeight: "420px" }}>
        <GlassCard style={{ padding: "0.5rem", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-color)", fontWeight: "600", fontSize: "0.9rem" }}>
            {acceptedList.length === 0 ? "No active chats" : "Conversations"}
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {acceptedList.map((c) => {
              const name = isUser ? c.lawyer?.name || "Lawyer" : c.user?.name || "User";
              const sub = c.subject || "";
              const cid = c._id || c.id;
              const isSelected = (selectedConsultation?._id || selectedConsultation?.id) === cid;
              return (
                <button
                  key={cid}
                  onClick={() => setSelectedConsultation(c)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    textAlign: "left",
                    background: isSelected ? "rgba(168, 85, 247, 0.2)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border-color)",
                    color: "inherit",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
                </button>
              );
            })}
          </div>
        </GlassCard>

        {selectedConsultation ? (
          <GlassCard style={{ display: "flex", flexDirection: "column", padding: 0, minHeight: "400px" }}>
            <div style={{ padding: "12px 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={() => setSelectedConsultation(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex" }}
                aria-label="Back to list"
              >
                <ArrowLeft size={20} />
              </button>
              <span style={{ fontWeight: 600 }}>{otherPartyName}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>({selectedConsultation.subject})</span>
            </div>

            {chatError && (
              <div style={{ padding: "10px 1rem", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={18} />
                {chatError}
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
              {messages.length === 0 && !chatError && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", textAlign: "center", marginTop: "1rem" }}>No messages yet. Say hello.</p>
              )}
              {messages.map((m) => {
                const isMe = (m.senderType === "user" && isUser) || (m.senderType === "lawyer" && isLawyer);
                return (
                  <div
                    key={m._id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      background: isMe ? "rgba(168, 85, 247, 0.25)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isMe ? "rgba(168, 85, 247, 0.4)" : "var(--border-color)"}`,
                      fontSize: "0.95rem",
                    }}
                  >
                    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "12px 1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "10px", alignItems: "center" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                disabled={!!chatError}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "10px",
                  color: "inherit",
                  fontSize: "0.95rem",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || sending || !!chatError}
                style={{
                  padding: "12px 20px",
                  background: inputValue.trim() && !sending && !chatError ? "#a855f7" : "rgba(168, 85, 247, 0.3)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: inputValue.trim() && !sending && !chatError ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "0.9rem",
                }}
              >
                <Send size={18} />
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
            <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
              <MessageCircle size={48} style={{ marginBottom: "0.5rem" }} />
              <p>Select a conversation to start chatting.</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default Chat;
