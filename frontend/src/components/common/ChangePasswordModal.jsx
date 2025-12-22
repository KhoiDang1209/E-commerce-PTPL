import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { changePassword } from '../../services/passwordService';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');




  if (!isOpen) return null;

  const validatePasswords = () => {
    if (newPassword !== rePassword) {
      setError('New passwords do not match.');
      return false;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter.');
      return false;
    }
    if (!/[a-z]/.test(newPassword)) {
      setError('Password must contain at least one lowercase letter.');
      return false;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number.');
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setError('Password must contain at least one special character.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validatePasswords()) {
      try {
        const response = await changePassword({ currentPassword, newPassword, rePassword });
        setSuccess(response.message || 'Password changed successfully!');
        setError('');
        onSubmit();
      } catch (err) {
        setError(err.message || 'Failed to change password.');
        setSuccess('');
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">Change Password</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Current Password</label>
            <input
              className="modal-input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              className="modal-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Re-enter New Password</label>
            <input
              className="modal-input"
              type="password"
              value={rePassword}
              onChange={(e) => setRePassword(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ChangePasswordModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default ChangePasswordModal;