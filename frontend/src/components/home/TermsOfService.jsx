import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    FaFileContract,
    FaUserShield,
    FaHandshake,
    FaUserLock,
    FaCopyright,
    FaRegEnvelope,
    FaArrowLeft,
} from 'react-icons/fa';
import styles from './termsofservice.module.css';

function TermsOfService() {
    const controls = useAnimation();
    const navigate = useNavigate();

    useEffect(() => {
        controls.start((i) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: 'easeInOut',
            },
        }));
    }, [controls]);

    const handleGoBack = () => {
        navigate('/');
    };

    return (
        <motion.div
            className={styles.termsContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={controls}
        >
            <motion.div custom={0} className={styles.header}>
                <button className={styles.backButton} onClick={handleGoBack}>
                    <FaArrowLeft /> Back
                </button>
                <motion.h1>
                    <FaFileContract className={styles.headingIcon} /> Terms of Service
                </motion.h1>
            </motion.div>

            <motion.section custom={1}>
                <h2>
                    <FaUserShield className={styles.sectionIcon} /> 1. Acceptance of Terms
                </h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    By accessing or using our website and services, you agree to be bound by these
                    Terms of Service. If you disagree with any part of the terms, you may not access
                    the website.
                </motion.p>
            </motion.section>

            <motion.section custom={2}>
                <h2>
                    <FaHandshake className={styles.sectionIcon} /> 2. Use of the Service
                </h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    Our service allows you to manage and transfer files across multiple cloud storage
                    providers. You are responsible for maintaining the confidentiality of your account
                    credentials and for all activities that occur under your account.
                </motion.p>
            </motion.section>

            <motion.section custom={3}>
                <h2>
                    <FaCopyright className={styles.sectionIcon} /> 3. Intellectual Property
                </h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    The content on our website, including but not limited to text, graphics, logos,
                    and software, is the property of MultiCloud Storage and is protected by applicable
                    copyright and intellectual property laws.
                </motion.p>
            </motion.section>

            <motion.section custom={4}>
                <h2>
                    <FaUserLock className={styles.sectionIcon} /> 4. Data Privacy
                </h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    We are committed to protecting your privacy. Our Privacy Policy explains how we
                    collect, use, and disclose your personal information.
                </motion.p>
            </motion.section>

            <motion.section custom={5}>
                <h2>
                    <FaRegEnvelope className={styles.sectionIcon} /> 5. Contact Us
                </h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    If you have any questions about these Terms of Service, please contact us at{' '}
                    <a href="mailto:multicloudproject0@gmail.com">multicloudproject0@gmail.com</a>.
                </motion.p>
            </motion.section>
        </motion.div>
    );
}

export default TermsOfService;