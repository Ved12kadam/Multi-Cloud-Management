import React, { useState } from "react";
import axios from "axios";
import styles from "./forgotpassword.module.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  // Handle forgot password request (Email Submission)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post("/forgotpassword", { email }); // Removed hardcoded localhost
      setIsEmailSent(true);
      setSuccessMessage("Password reset email sent successfully! Please check your inbox (and spam folder)."); // ✅ Updated success message
      setError("");
    } catch (err) {
      let errorMessage = "Failed to send reset email. Try again.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      console.error("Forgot password email error:", err);
    }finally {
      setIsLoading(false); // Stop loading animation
    }
  };

  // Handle password reset submission (Reset Password Form Submission)
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/resetpassword", { newPassword, resetToken }); // Removed hardcoded localhost
      setIsPasswordReset(true);
      setSuccessMessage("Password successfully reset.");
      setError("");
    } catch (err) {
      let errorMessage = "Failed to reset password. Try again.";
      if (err.response && err.response.data && err.response.data.error) {
        errorMessage = err.response.data.error;
      }
      setError(errorMessage);
      console.error("Reset password error:", err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginForm}>
        {!isEmailSent && !isPasswordReset && ( // Condition for initial email form
          <>
            <h2 className={styles.loginTitle}>Forgot Password</h2>
            <form onSubmit={handleEmailSubmit}>
              <label htmlFor="email" className={styles.inputLabel}>Enter your email:</label>
              <input
                type="email"
                id="email"
                placeholder="Email"
                className={styles.inputField}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className={styles.loginButton} disabled={isLoading}> 
                {isLoading ? ( // Conditional rendering for loading state
                  <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '1.5em', color: 'white' }}/> 
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          </>
        )}

        {isEmailSent && !isPasswordReset && ( // ✅ Condition for "Check Email" message
          <div className={styles.emailSentMessage}>
            <h2 className={styles.loginTitle}>Check Your Email</h2>
            <p className={styles.successMessage}>
              {successMessage} <br />
              Please check your inbox and spam/junk folder for the password reset link.
            </p>
            {/* Optionally, add a link back to the login page or resend email button here */}
          </div>
        )}

        {isPasswordReset && ( // Condition after password reset is submitted (currently might not be reached in this flow)
          <>
            <h2 className={styles.loginTitle}>Reset Password</h2>
            <form onSubmit={handlePasswordResetSubmit}>
              <label htmlFor="newPassword" className={styles.inputLabel}>New Password:</label>
              <input
                type="password"
                id="newPassword"
                placeholder="New password"
                className={styles.inputField}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <label htmlFor="resetToken" className={styles.inputLabel}>Reset Token:</label>
              <input
                type="text"
                id="resetToken"
                placeholder="Enter reset token from email"
                className={styles.inputField}
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
              <button type="submit" className={styles.loginButton}>Reset Password</button>
            </form>
          </>
        )}

        {error && <p className={styles.errorMessage}>{error}</p>}
        {/* Success message now shown in "isEmailSent" block */}
      </div>
    </div>
  );
};

export default ForgotPassword;
