import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import './InstructorDetailPage.css';

const InstructorDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/instructor/${id}`);
        if (!res.ok) throw new Error(`Instructor not found (${res.status})`);
        const data = await res.json();
        setInstructor(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInstructor();
  }, [id]);

  const updateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8080/api/instructor/${id}/status?status=${newStatus}`,
        { method: 'PUT' }
      );
      if (!res.ok) throw new Error(`Failed to update status (${res.status})`);
      setInstructor((prev) => ({ ...prev, status: newStatus }));
      showToast('success', `Instructor ${newStatus === 'APPROVED' ? 'approved' : 'rejected'} successfully.`);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge badge--approved';
      case 'REJECTED': return 'badge badge--rejected';
      default:         return 'badge badge--pending';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="state-box">
          <div className="spinner" />
          <p>Loading instructor…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="detail-page">
        <div className="state-box state-box--error">
          <span className="state-icon">&#9888;</span>
          <p>{error}</p>
          <button className="btn btn--outline" onClick={() => navigate('/instructor')}>
            ← Back to list
          </button>
        </div>
      </div>
    );
  }

  const initials = `${instructor.firstName.charAt(0)}${instructor.lastName.charAt(0)}`;
  const isPending  = instructor.status === 'PENDING';
  const isApproved = instructor.status === 'APPROVED';
  const isRejected = instructor.status === 'REJECTED';

  return (
    <div className="detail-page">

      {/* Toast */}
      {toast && (
        <div className={`toast toast--${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="detail-container">

        {/* Header */}
        <div className="detail-header">
          <div className="header-accent" />
          <div className="header-title">
            <h1>Instructor Review</h1>
            <p>Review and update the instructor's registration status</p>
          </div>
          <Link to="/instructor" className="back-link">
            ← Back to list
          </Link>
        </div>

        {/* Profile banner */}
        <div className="profile-banner">
          <div className="profile-avatar">{initials}</div>
          <div className="profile-info">
            <div className="profile-name">
              {instructor.firstName} {instructor.lastName}
            </div>
            <div className="profile-meta">{instructor.email} &bull; {instructor.phoneNumber}</div>
          </div>
          <span className={getStatusBadgeClass(instructor.status)}>
            {instructor.status}
          </span>
        </div>

        {/* Details grid */}
        <div className="detail-body">
          <section className="detail-section">
            <h2 className="section-title">Personal Information</h2>
            <div className="info-grid">
              <InfoRow label="First Name"   value={instructor.firstName} />
              <InfoRow label="Last Name"    value={instructor.lastName} />
              <InfoRow label="Email"        value={instructor.email} />
              <InfoRow label="Phone"        value={instructor.phoneNumber} />
              <InfoRow label="Address"      value={instructor.address} span />
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">Professional Information</h2>
            <div className="info-grid">
              <InfoRow label="Qualification"        value={instructor.qualification} />
              <InfoRow label="Years of Experience"  value={instructor.yearsOfExperience > 0 ? `${instructor.yearsOfExperience} year${instructor.yearsOfExperience !== 1 ? 's' : ''}` : '—'} />
              <InfoRow label="Areas of Specialization" value={instructor.areasOfSpecialization} span />
            </div>
          </section>

          <section className="detail-section">
            <h2 className="section-title">Account Details</h2>
            <div className="info-grid">
              <InfoRow label="Status"       value={<span className={getStatusBadgeClass(instructor.status)}>{instructor.status}</span>} />
              <InfoRow label="Active"       value={instructor.isActive ? 'Yes' : 'No'} />
              <InfoRow label="Registered"   value={formatDate(instructor.createdAt)} />
              <InfoRow label="Last Updated" value={formatDate(instructor.updatedAt)} />
            </div>
          </section>

          {/* Review actions */}
          <section className="detail-section review-section">
            <h2 className="section-title">Registration Decision</h2>
            <p className="review-hint">
              {isPending  && 'This registration is awaiting a decision. Approve or reject below.'}
              {isApproved && 'This instructor has been approved. You can still revoke access by rejecting.'}
              {isRejected && 'This registration was rejected. You can approve it if the decision should change.'}
            </p>
            <div className="review-actions">
              <button
                className="btn btn--approve"
                disabled={isApproved || actionLoading}
                onClick={() => updateStatus('APPROVED')}
              >
                {actionLoading ? <span className="btn-spinner" /> : null}
                ✓ Approve
              </button>
              <button
                className="btn btn--reject"
                disabled={isRejected || actionLoading}
                onClick={() => updateStatus('REJECTED')}
              >
                {actionLoading ? <span className="btn-spinner" /> : null}
                ✕ Reject
              </button>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
};

/* Small helper component */
const InfoRow = ({ label, value, span }) => (
  <div className={`info-row${span ? ' info-row--span' : ''}`}>
    <dt className="info-label">{label}</dt>
    <dd className="info-value">{value || '—'}</dd>
  </div>
);

export default InstructorDetailPage;
