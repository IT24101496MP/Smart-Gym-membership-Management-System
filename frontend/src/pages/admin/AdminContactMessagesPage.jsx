import { useEffect, useState } from "react";
import api from "../../utils/api";
import "./AdminContactMessagesPage.css";

const getContactMessages = async () => {
  const { data } = await api.get("/api/contact/messages");
  return Array.isArray(data) ? data : [];
};

const replyToContactMessage = async (id, reply) => {
  const { data } = await api.put(`/api/contact/messages/${id}/reply`, { reply });
  return data;
};

const AdminContactMessagesPage = () => {
  const [contactMessages, setContactMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyBusyId, setReplyBusyId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    const loadContactMessages = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getContactMessages();
        setContactMessages(data);
      } catch {
        setContactMessages([]);
        setError("Failed to load contact messages.");
      } finally {
        setLoading(false);
      }
    };

    loadContactMessages();
  }, []);

  const onReplyDraftChange = (messageId, value) => {
    setReplyDrafts((prev) => ({
      ...prev,
      [messageId]: value,
    }));
  };

  const submitContactReply = async (messageId) => {
    const replyText = (replyDrafts[messageId] || "").trim();
    if (!replyText) {
      setMessageType("error");
      setMessage("Please enter a reply before sending.");
      return;
    }

    setReplyBusyId(messageId);
    try {
      const updated = await replyToContactMessage(messageId, replyText);
      setContactMessages((prev) => prev.map((item) => (item.id === messageId ? updated : item)));
      setReplyDrafts((prev) => ({ ...prev, [messageId]: "" }));
      setMessageType("success");
      setMessage("Reply sent successfully.");
    } catch {
      setMessageType("error");
      setMessage("Failed to send admin reply.");
    } finally {
      setReplyBusyId(null);
    }
  };

  return (
    <div className="admin-contact-page">
      <div className="admin-contact-shell">
        <section className="admin-contact-card">
          <h1>Admin: Contact Messages</h1>
          <p>Review submitted website messages and reply to members directly.</p>

          {message ? <div className={`admin-contact-msg ${messageType}`}>{message}</div> : null}

          {loading ? (
            <div className="admin-contact-empty">Loading contact messages...</div>
          ) : error ? (
            <div className="admin-contact-msg error">{error}</div>
          ) : contactMessages.length === 0 ? (
            <div className="admin-contact-empty">No contact messages submitted yet.</div>
          ) : (
            <div className="admin-contact-list">
              {contactMessages.map((item) => (
                <article key={item.id} className="admin-contact-item">
                  <div className="admin-contact-header-row">
                    <h2>{`${item.firstName || ""} ${item.lastName || ""}`.trim() || "Unnamed"}</h2>
                    <span className={`admin-contact-status ${item.status === "REPLIED" ? "replied" : "new"}`}>
                      {item.status || "NEW"}
                    </span>
                  </div>

                  <p className="admin-contact-meta">
                    {item.email || "-"} | {item.phoneNumber || "-"}
                  </p>
                  <p className="admin-contact-body">{item.message || "-"}</p>

                  {item.adminReply ? (
                    <div className="admin-contact-existing-reply">
                      <strong>Current Reply</strong>
                      <p>{item.adminReply}</p>
                    </div>
                  ) : null}

                  <textarea
                    rows={3}
                    value={replyDrafts[item.id] || ""}
                    onChange={(e) => onReplyDraftChange(item.id, e.target.value)}
                    placeholder="Type your reply to this message"
                  />

                  <button
                    className="admin-contact-btn"
                    type="button"
                    disabled={replyBusyId === item.id}
                    onClick={() => submitContactReply(item.id)}
                  >
                    {replyBusyId === item.id ? "Sending..." : item.status === "REPLIED" ? "Update Reply" : "Send Reply"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminContactMessagesPage;
