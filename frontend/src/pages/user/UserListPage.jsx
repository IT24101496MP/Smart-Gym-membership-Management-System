import { useState, useEffect } from 'react';
import api from '../../utils/api';
import './UserListPage.css';

const ROLES = ['ADMIN', 'INSTRUCTOR', 'CLIENT'];

const roleBadgeClass = (role) => {
  switch (role) {
    case 'ADMIN':      return 'badge badge--admin';
    case 'INSTRUCTOR': return 'badge badge--instructor';
    default:           return 'badge badge--client';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const UserListPage = () => {
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [roleFilter, setRoleFilter]   = useState('ALL');

  // Role-switch modal state
  const [modalUser, setModalUser]     = useState(null); // user object being edited
  const [selectedRole, setSelectedRole] = useState('');
  const [switching, setSwitching]     = useState(false);
  const [switchError, setSwitchError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/user');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const name = `${u.firstName} ${u.lastName}`.toLowerCase();
    const matchSearch =
      name.includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber.includes(searchTerm);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = (user) => {
    setModalUser(user);
    setSelectedRole(user.role);
    setSwitchError('');
  };

  const closeModal = () => {
    if (switching) return;
    setModalUser(null);
  };

  const handleSwitchRole = async () => {
    if (!modalUser || selectedRole === modalUser.role) { closeModal(); return; }
    setSwitching(true);
    setSwitchError('');
    try {
      const { data: updated } = await api.put(
        `/api/user/${modalUser.id}/role`,
        { role: selectedRole }
      );
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      closeModal();
    } catch (err) {
      setSwitchError(err.response?.data || err.message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="list-page">
      <div className="list-container">

        {/* Header */}
        <div className="list-header">
          <div className="header-accent" />
          <div>
            <h1>Users</h1>
            <p>Manage all registered users and their roles</p>
          </div>
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
            {['ALL', ...ROLES].map((r) => (
              <button
                key={r}
                className={`filter-btn${roleFilter === r ? ' filter-btn--active' : ''}`}
                onClick={() => setRoleFilter(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* States */}
        {loading && (
          <div className="state-box">
            <div className="spinner" />
            <p>Loading users…</p>
          </div>
        )}

        {error && (
          <div className="state-box state-box--error">
            <span className="state-icon">&#9888;</span>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchUsers}>Retry</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="state-box">
            <span className="state-icon">&#128269;</span>
            <p>No users found.</p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="table-summary">
              Showing <strong>{filtered.length}</strong> of{' '}
              <strong>{users.length}</strong> user{users.length !== 1 ? 's' : ''}
            </div>
            <div className="table-wrapper">
              <table className="instructor-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, index) => (
                    <tr key={user.id}>
                      <td className="col-id">{index + 1}</td>
                      <td className="col-name">
                        <div className="avatar">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="name-primary">{user.firstName} {user.lastName}</div>
                          <div className="name-secondary">{user.email}</div>
                        </div>
                      </td>
                      <td className="col-contact">
                        <div>{user.email}</div>
                        <div className="name-secondary">{user.phoneNumber}</div>
                      </td>
                      <td>
                        <span className={roleBadgeClass(user.role)}>{user.role}</span>
                      </td>
                      <td className="col-center">
                        <span className={`status-dot ${user.isActive ? 'status-dot--active' : 'status-dot--inactive'}`}>
                          {user.isActive ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="col-date">{formatDate(user.createdAt)}</td>
                      <td className="col-action">
                        <button className="review-link" onClick={() => openModal(user)}>
                          Switch Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Role-switch modal */}
      {modalUser && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-accent" />
              <h2>Switch Role</h2>
            </div>

            <div className="modal-body">
              <p className="modal-user-name">
                {modalUser.firstName} {modalUser.lastName}
                <span className="modal-user-email">{modalUser.email}</span>
              </p>

              <p className="modal-label">Select new role</p>
              <div className="role-options">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    className={`role-option ${selectedRole === r ? 'role-option--selected' : ''}`}
                    onClick={() => setSelectedRole(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {switchError && (
                <p className="modal-error">&#9888; {switchError}</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn modal-btn--cancel" onClick={closeModal} disabled={switching}>
                Cancel
              </button>
              <button
                className="modal-btn modal-btn--confirm"
                onClick={handleSwitchRole}
                disabled={switching || selectedRole === modalUser.role}
              >
                {switching ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPage;
