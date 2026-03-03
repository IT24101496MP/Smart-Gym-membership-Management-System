import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './InstructorListPage.css';
import api from '../../utils/api';

const InstructorListPage = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const { data } = await api.get('/api/instructor');
        setInstructors(data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load instructors.');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const filteredInstructors = instructors.filter((instructor) => {
    const fullName = `${instructor.firstName ?? ''} ${instructor.lastName ?? ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      (instructor.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (instructor.phoneNumber ?? '').includes(searchTerm);
    const matchesStatus =
      statusFilter === 'ALL' || instructor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'APPROVED': return 'badge badge--approved';
      case 'REJECTED': return 'badge badge--rejected';
      default:         return 'badge badge--pending';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="list-page">
      <div className="list-container">

        {/* Header */}
        <div className="list-header">
          <div className="header-accent" />
          <div>
            <h1>Instructors</h1>
            <p>Manage and review all registered instructors</p>
          </div>
          <Link to="/instructor/register" className="header-btn">
            + Add Instructor
          </Link>
        </div>

        {/* Toolbar */}
        <div className="list-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email or phone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="filter-group">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
              <button
                key={s}
                className={`filter-btn${statusFilter === s ? ' filter-btn--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {loading && (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading instructors…</p>
          </div>
        )}

        {error && (
          <div className="state-box state-box--error">
            <span className="state-icon">&#9888;</span>
            <p>{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && filteredInstructors.length === 0 && (
          <div className="state-box">
            <span className="state-icon">&#128269;</span>
            <p>No instructors found.</p>
          </div>
        )}

        {!loading && !error && filteredInstructors.length > 0 && (
          <>
            <div className="table-summary">
              Showing <strong>{filteredInstructors.length}</strong> of{' '}
              <strong>{instructors.length}</strong> instructor
              {instructors.length !== 1 ? 's' : ''}
            </div>
            <div className="table-wrapper">
              <table className="instructor-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Specialization</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstructors.map((instructor, index) => (
                    <tr key={instructor.id}>
                      <td className="col-id">{index + 1}</td>
                      <td className="col-name">
                        <div className="avatar">
                          {(instructor.firstName ?? '?').charAt(0)}{(instructor.lastName ?? '?').charAt(0)}
                        </div>
                        <div>
                          <div className="name-primary">
                            {instructor.firstName} {instructor.lastName}
                          </div>
                          <div className="name-secondary">{instructor.address}</div>
                        </div>
                      </td>
                      <td className="col-contact">
                        <div>{instructor.email}</div>
                        <div className="name-secondary">{instructor.phoneNumber}</div>
                      </td>
                      <td>{instructor.qualification || '—'}</td>
                      <td className="col-center">
                        {instructor.yearsOfExperience > 0
                          ? `${instructor.yearsOfExperience} yr${instructor.yearsOfExperience !== 1 ? 's' : ''}`
                          : '—'}
                      </td>
                      <td className="col-spec">{instructor.areasOfSpecialization || '—'}</td>
                      <td>
                        <span className={getStatusBadgeClass(instructor.status)}>
                          {instructor.status}
                        </span>
                      </td>
                      <td className="col-date">{formatDate(instructor.createdAt)}</td>
                      <td className="col-action">
                        <Link to={`/instructor/${instructor.id}`} className="review-link">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorListPage;
