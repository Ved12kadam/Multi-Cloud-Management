import React from 'react';
import styles from './footer.module.css';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <motion.footer 
      className={styles.footer}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }} 
    >
      <p>© 2024 Multicloud Storage. All rights reserved.</p>
      <motion.div 
        className={styles.footerLinks}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 1.0 }}
      >
        <a href="/terms">Terms of Service</a>
        <a href="/privacy">Privacy</a>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;