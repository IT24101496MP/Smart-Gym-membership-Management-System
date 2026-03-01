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

  const [empForm, setEmpForm] = useState({
    employmentType: '',
    workingHoursPerWeek: '',
    salary: '',
    isActive: '',
  });
  const [empLoading, setEmpLoading] = useState(false);
  const [empErrors, setEmpErrors] = useState({});
  const [empEditing, setEmpEditing] = useState(false);

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
        // Pre-populate form with existing values if present
        const emp = data.employment;
        const hasEmp = !!emp?.employmentType;
        setEmpForm({
          employmentType: emp?.employmentType || '',
          workingHoursPerWeek: emp?.workingHoursPerWeek ?? '',
          salary: emp?.salary ?? '',
          isActive: data.isActive !== null ? String(data.isActive) : '',
        });
        // Start in edit mode only when no employment has been assigned yet
        setEmpEditing(!hasEmp);
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

  const validateEmpForm = () => {
    const errs = {};
    if (!empForm.employmentType) errs.employmentType = 'Employment type is required.';
    const hrs = Number(empForm.workingHoursPerWeek);
    if (empForm.workingHoursPerWeek === '' || isNaN(hrs) || hrs < 1 || hrs > 168)
      errs.workingHoursPerWeek = 'Enter hours between 1 and 168.';
    const sal = Number(empForm.salary);
    if (empForm.salary === '' || isNaN(sal) || sal < 0)
      errs.salary = 'Enter a valid non-negative salary.';
    if (empForm.isActive === '') errs.isActive = 'Employment status is required.';
    return errs;
  };

  const handleEmpChange = (e) => {
    const { name, value } = e.target;
    setEmpForm((prev) => ({ ...prev, [name]: value }));
    setEmpErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const submitEmployment = async (e) => {
    e.preventDefault();
    const errs = validateEmpForm();
    if (Object.keys(errs).length > 0) { setEmpErrors(errs); return; }

    setEmpLoading(true);
    try {
      const payload = {
        employmentType: empForm.employmentType,
        workingHoursPerWeek: Number(empForm.workingHoursPerWeek),
        salary: Number(empForm.salary),
        isActive: empForm.isActive === 'true',
      };
      const res = await fetch(`http://localhost:8080/api/instructor/${id}/employment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Request failed (${res.status})`);
      }
      const updated = await res.json();
      setInstructor(updated);
      setEmpEditing(false);
      showToast('success', 'Employment details saved successfully.');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setEmpLoading(false);
    }
  };

  const cancelEmpEdit = () => {
    // Reset form to the last saved values from instructor state
    setEmpForm({
      employmentType: instructor.employment?.employmentType || '',
      workingHoursPerWeek: instructor.employment?.workingHoursPerWeek ?? '',
      salary: instructor.employment?.salary ?? '',
      isActive: instructor.isActive !== null ? String(instructor.isActive) : '',
    });
    setEmpErrors({});
    setEmpEditing(false);
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
              <InfoRow label="Age"          value={instructor.age > 0 ? instructor.age : '—'} />
              <InfoRow label="Date of Birth" value={instructor.dateOfBirth ? new Date(instructor.dateOfBirth).toLocaleDateString('en-GB') : '—'} />
              <InfoRow label="Gender"       value={instructor.gender?.replace('_', ' ')} />
              <InfoRow label="Email"        value={instructor.email} />
              <InfoRow label="Phone"        value={instructor.phoneNumber} />
              <InfoRow label="Land Phone"   value={instructor.landPhone} />
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

          {/* Employment Assignment — only shown for approved instructors */}
          {isApproved && (
            <section className="detail-section emp-section">
              <div className="emp-section__header">
                <h2 className="section-title emp-section__title">Employment Assignment</h2>
                {instructor.employment?.employmentType && !empEditing && (
                  <button
                    type="button"
                    className="btn btn--edit-emp"
                    onClick={() => setEmpEditing(true)}
                  >
                    ✎ Edit
                  </button>
                )}
              </div>

              <form className="emp-form" onSubmit={submitEmployment} noValidate>
                <div className="emp-form__grid">
                  {/* Employment Type */}
                  <div className="emp-field">
                    <label className="emp-label">
                      Employment Type
                      {empEditing && <span className="req"> *</span>}
                    </label>
                    <select
                      name="employmentType"
                      className={`emp-input${empErrors.employmentType ? ' emp-input--error' : ''}${!empEditing ? ' emp-input--readonly' : ''}`}
                      value={empForm.employmentType}
                      onChange={handleEmpChange}
                      disabled={!empEditing}
                    >
                      <option value="">—</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                    </select>
                    {empErrors.employmentType && <p className="emp-error">{empErrors.employmentType}</p>}
                  </div>

                  {/* Working Hours */}
                  <div className="emp-field">
                    <label className="emp-label">
                      Working Hours / Week
                      {empEditing && <span className="req"> *</span>}
                    </label>
                    <input
                      type="number"
                      name="workingHoursPerWeek"
                      min="1" max="168"
                      className={`emp-input${empErrors.workingHoursPerWeek ? ' emp-input--error' : ''}${!empEditing ? ' emp-input--readonly' : ''}`}
                      placeholder="e.g. 40"
                      value={empForm.workingHoursPerWeek}
                      onChange={handleEmpChange}
                      disabled={!empEditing}
                    />
                    {empErrors.workingHoursPerWeek && <p className="emp-error">{empErrors.workingHoursPerWeek}</p>}
                  </div>

                  {/* Salary */}
                  <div className="emp-field">
                    <label className="emp-label">
                      Salary (LKR)
                      {empEditing && <span className="req"> *</span>}
                    </label>
                    <input
                      type="number"
                      name="salary"
                      min="0"
                      step="0.01"
                      className={`emp-input${empErrors.salary ? ' emp-input--error' : ''}${!empEditing ? ' emp-input--readonly' : ''}`}
                      placeholder="e.g. 75000.00"
                      value={empForm.salary}
                      onChange={handleEmpChange}
                      disabled={!empEditing}
                    />
                    {empErrors.salary && <p className="emp-error">{empErrors.salary}</p>}
                  </div>

                  {/* Active / Inactive */}
                  <div className="emp-field">
                    <label className="emp-label">
                      Employment Status
                      {empEditing && <span className="req"> *</span>}
                    </label>
                    <select
                      name="isActive"
                      className={`emp-input${empErrors.isActive ? ' emp-input--error' : ''}${!empEditing ? ' emp-input--readonly' : ''}`}
                      value={empForm.isActive}
                      onChange={handleEmpChange}
                      disabled={!empEditing}
                    >
                      <option value="">—</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                    {empErrors.isActive && <p className="emp-error">{empErrors.isActive}</p>}
                  </div>
                </div>

                {empEditing && (
                  <div className="emp-form__footer">
                    {instructor.employment?.employmentType && (
                      <button
                        type="button"
                        className="btn btn--outline"
                        disabled={empLoading}
                        onClick={cancelEmpEdit}
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="btn btn--save" disabled={empLoading}>
                      {empLoading ? <span className="btn-spinner" /> : null}
                      {instructor.employment?.employmentType ? 'Save Changes' : 'Assign Employment Details'}
                    </button>
                  </div>
                )}
              </form>
            </section>
          )}
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

const EmpInfoItem = ({ label, value, valueClass }) => (
  <div className="emp-info-item">
    <span className="emp-info-label">{label}</span>
    <span className={`emp-info-value${valueClass ? ` ${valueClass}` : ''}`}>{value}</span>
  </div>
);

export default InstructorDetailPage;
