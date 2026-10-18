import React, { useState } from 'react';
import styles from './signin.module.css';
import axios from "axios";
import cloud from '../../assets/download (2).png';
import googleIcon from '../../assets/google_icon-removebg-preview.png';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEye, FaEyeSlash } from 'react-icons/fa';


function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [emailError, setEmailError] = useState(''); // New state
     const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const backendUrl = 'https://localhost:5000';

    const validateEmail = (email) => {
        if (!email) {
            return 'Email is required';
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const handleEmailChange = (e) => {
      const newEmail = e.target.value;
      setEmail(newEmail);
  
      // Remove error immediately when user starts typing
      setEmailError("");
  
      // Validate after user has typed
      if (newEmail.trim() !== "") {
          setTimeout(() => setEmailError(validateEmail(newEmail)), 500); // Small delay to prevent aggressive validation
      }
    };
  
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const emailValidationError = validateEmail(email);
        setEmailError(validateEmail(email)); // Validate before submit

        if (emailValidationError) {
            return;
        }

        try {
            const response = await axios.post(`${backendUrl}/signin`, {
                email,
                password,
            });
            if (response.status === 200) {
                navigate('/mainpage');
            }
        } catch (error) {
            setError(error.response?.data?.error || "Login failed!");
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${backendUrl}/google-login`;
    };

    return (
        <AnimatePresence>
            <motion.div
                className={styles.loginContainer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                <motion.form
                    className={styles.loginForm}
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                >
                    <h2 className={styles.loginTitle}>
                        <div className={styles.loginTitleIcon}>
                            <img src={cloud} alt="cloud icon" />
                        </div>
                        MultiCloud Storage
                    </h2>
                    <p className={styles.loginSubtitle}>Login to manage your cloud storage</p>

                    <label className={styles.inputLabel}>Email</label>
                    <input
                        type="email"
                        className={styles.inputField}
                        placeholder="youremail@gmail.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setEmailError(validateEmail(e.target.value));
                        }}
                        required
                    />
                    {emailError && <p className={styles.errorMessage}>{emailError}</p>}

                    <label className={styles.inputLabel}>Password</label>

                    <div className={styles.passwordContainer}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className={styles.inputField}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(null);
                            }}
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
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <motion.button
                        type="submit"
                        className={styles.loginButton}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        Sign In
                    </motion.button>

                    <div className={styles.divider}>
                        <span>OR CONTINUE WITH</span>
                    </div>

                    <motion.button
                        type="button"
                        className={`${styles.googleLoginButton} ${styles.inputField}`}
                        onClick={handleGoogleLogin}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                    >
                        <img src={googleIcon} alt="Google icon" className={styles.googleIcon} />
                        Continue with Google
                    </motion.button>

                    <div className={styles.loginFooter}>
                        <a href="/ForgotPassword" className={styles.forgotPasswordLink}>Forgot password?</a>
                        <span className={styles.separator}>|</span>
                        <a href="/signup" className={styles.signupLink}>Don't have an account? Sign up</a>
                    </div>
                </motion.form>
            </motion.div>
        </AnimatePresence>
    );
}

export default SignIn;