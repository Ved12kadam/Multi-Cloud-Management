import React, { useState, useEffect } from 'react';
import styles from './resetpassword.module.css';
import axios from "axios";
import cloud from '../../assets/download (2).png';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Field-specific error states
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('');

  // Retrieve the token from the URL param
  const { token } = useParams();
  const navigate = useNavigate();

  // For demonstration, using local dev URL
  const backendUrl = 'https://localhost:5000';

  useEffect(() => {
    // If token is missing from the URL, show an error
    if (!token) {
      setError("Invalid or missing reset token in URL.");
    }
  }, [token]);

  // Enhanced password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'New Password is required';
    }
    let errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain a number');
    }
    return errors.length > 0 ? errors.join('. ') : '';
  };

  const validateConfirmPassword = (confirmPassword, newPassword) => {
    if (!confirmPassword) {
      return 'Confirm New Password is required';
    }
    if (confirmPassword !== newPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();

    // Clear old messages
    setError('');
    setSuccessMessage('');
    setNewPasswordError('');
    setConfirmNewPasswordError('');

    // Validate new password
    const newPasswordErrorMessage = validatePassword(newPassword);
    // Validate confirm password
    const confirmNewPasswordErrorMessage = validateConfirmPassword(confirmNewPassword, newPassword);

    if (newPasswordErrorMessage || confirmNewPasswordErrorMessage) {
      setNewPasswordError(newPasswordErrorMessage);
      setConfirmNewPasswordError(confirmNewPasswordErrorMessage);
      return;
    }

    // Check token existence
    if (!token) {
      setError("Invalid or missing reset token in URL.");
      return;
    }

    try {
      // Submit to your backend
      console.log("request:",`${backendUrl}/resetpassword`);
      const response = await axios.post(`${backendUrl}/resetpassword`, {
        newPassword,
        resetToken: token, // Pass the token from the URL
      });

      if (response.status === 200) {
        setSuccessMessage(response.data.message);
        // Optionally redirect to sign-in page after success
        setTimeout(() => {
          navigate('/signin');
        }, 1500);
      }
    } catch (err) {
      let errorMessage = "Failed to reset password. Please try again or check your reset link.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      console.error("Reset password error:", err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleResetPasswordSubmit}>
        <h2 className={styles.loginTitle}>
          <div className={styles.loginTitleIcon}>
            <img src={cloud} alt="cloud icon" />
          </div>
          Reset Password
        </h2>
        <p className={styles.loginSubtitle}>Enter your new password</p>

        {/* New Password */}
        <label className={styles.inputLabel}>New Password</label>
        <input
          type="password"
          className={`${styles.inputField} ${newPasswordError ? styles.inputError : ''}`}
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        {newPasswordError && <p className={styles.errorMessage}>{newPasswordError}</p>}

        {/* Confirm New Password */}
        <label className={styles.inputLabel}>Confirm New Password</label>
        <input
          type="password"
          className={`${styles.inputField} ${confirmNewPasswordError ? styles.inputError : ''}`}
          placeholder="Confirm New Password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          required
        />
        {confirmNewPasswordError && <p className={styles.errorMessage}>{confirmNewPasswordError}</p>}

        <button type="submit" className={styles.loginButton}onClick={handleResetPasswordSubmit}>Reset Password</button>

        {error && <p className={styles.errorMessage}>{error}</p>}
        {successMessage && <p className={styles.successMessage}>{successMessage}</p>}
      </form>
    </div>
  );
}

export default ResetPasswordForm;