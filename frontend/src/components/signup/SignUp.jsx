import React, { useState } from 'react';
import styles from './signup.module.css';
import cloud from '../../assets/download (2).png';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? '' : 'Please enter a valid email address';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    let errors = [];
    if (password.length < 8) errors.push('Minimum 8 characters');
    if (!/[a-z]/.test(password)) errors.push('A lowercase letter');
    if (!/[A-Z]/.test(password)) errors.push('A capital (uppercase) letter');
    if (!/[0-9]/.test(password)) errors.push('A number');
    return errors.length > 0 ? 'Password must contain: ' + errors.join(', ') : '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Confirm Password is required';
    return confirmPassword !== password ? 'Passwords do not match' : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const emailErrorMessage = validateEmail(email);
    const passwordErrorMessage = validatePassword(password);
    const confirmPasswordErrorMessage = validateConfirmPassword(confirmPassword, password);

    if (emailErrorMessage || passwordErrorMessage || confirmPasswordErrorMessage) {
      setEmailError(emailErrorMessage);
      setPasswordError(passwordErrorMessage);
      setConfirmPasswordError(confirmPasswordErrorMessage);
      return;
    }

    try {
      const response = await fetch('https://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setMessage(response.ok ? data.message : data.error || 'Failed to create account');

      if (response.ok) {
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className={styles.signupContainer}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <motion.form
          className={styles.signupForm}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.5, delay: 0.2, ease: 'easeInOut' }}
        >
          <h2 className={styles.signupTitle}>
            <div className={styles.signupTitleIcon}>
              <img src={cloud} alt="cloud icon" />
            </div>
            MultiCloud Storage
          </h2>
          <p className={styles.signupSubtitle}>Create an account to start managing your cloud storage</p>

          {message && <p className={styles.message}>{message}</p>}

          <label className={styles.inputLabel}>Email</label>
          <input
            type="email"
            className={`${styles.inputField} ${emailError ? styles.inputError : ''}`}
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {emailError && <p className={styles.error}>{emailError}</p>}

          <label className={styles.inputLabel}>Password</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              className={`${styles.inputField} ${passwordError ? styles.inputError : ''}`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {passwordError && <p className={styles.error}>{passwordError}</p>}

          <label className={styles.inputLabel}>Confirm Password</label>
          <div className={styles.passwordContainer}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className={`${styles.inputField} ${confirmPasswordError ? styles.inputError : ''}`}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className={styles.showPasswordButton}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {confirmPasswordError && <p className={styles.error}>{confirmPasswordError}</p>}

          <motion.button type="submit" className={styles.signupButton} whileHover={{ scale: 1.05 }}>
            Sign Up
          </motion.button>

          <p className={styles.signupFooter}>
            Already have an account?{' '}
            <motion.a href="/signin" className={styles.signinLink} whileTap={{ scale: 0.95 }}>
              Sign in
            </motion.a>
          </p>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}

export default SignUp;