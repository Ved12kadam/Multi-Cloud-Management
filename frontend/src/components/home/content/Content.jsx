import React from 'react';
import styles from './content.module.css';
import contentimage from '../../../assets/1032-removebg.png';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import framer-motion

const Content = () => {
  const navigate = useNavigate();
  const HandleGetStarted = () => {
    navigate('/signin');
  };

  return (
    <motion.div 
      className={styles.contentContainer}
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }} 
    >
      <motion.div 
        className={styles.contentText}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h1>Unified Cloud Storage Management</h1>
        <p>
          Seamlessly manage your data across multiple cloud providers
          with our advanced storage management platform.
        </p>
        <div className={styles.contentButtons}>
          <motion.button 
            className={styles.btnPrimary} 
            onClick={HandleGetStarted}
            whileHover={{ scale: 1.05 }} 
          >
            Get Started
          </motion.button>
          <motion.button 
            className={styles.btnSecondary}
            whileHover={{ scale: 1.05 }} 
          >
            Learn More
          </motion.button>
        </div>
      </motion.div>
      <motion.div 
        className={styles.contentImage}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <img src={contentimage} alt="content" />
      </motion.div>
    </motion.div>
  );
};

export default Content;