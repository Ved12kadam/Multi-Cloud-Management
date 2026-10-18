import React from 'react';
import styles from './navbar.module.css';
import cloud from '../../../assets/download (1).png';
import { motion } from 'framer-motion';

const Navbar = () => {
  return (
    <motion.nav 
      className={styles.navbar}
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className={styles.logo}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <img src={cloud} alt="Cloud Logo" />
      </motion.div>
      <motion.ul 
        className={styles.nav_links}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </motion.ul>
    </motion.nav>
  );
};

export default Navbar;