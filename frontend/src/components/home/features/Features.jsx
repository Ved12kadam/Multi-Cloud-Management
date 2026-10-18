import React, { useEffect } from 'react';
import styles from './features.module.css';
import cloud from '../../../assets/download (2).png';
import info from '../../../assets/download__2_-removebg-preview.png';
import file from '../../../assets/download__3_-removebg-preview.png';
import { useInView } from 'react-intersection-observer';
import { motion, useAnimation } from 'framer-motion';

const Features = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.3, // Adjust this threshold as needed
    triggerOnce: true // Only trigger the animation once
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  const featureVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        delay: 0.2, // Add a slight delay for a staggered effect
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className={styles.featuresContainer} ref={ref}> {/* Add the ref here */}
      <motion.div 
        className={styles.featureItem}
        variants={featureVariants}
        initial="hidden"
        animate={controls}
      >
        <img src={cloud} alt="Multi-Cloud Support" />
        <h3>Multi-Cloud Support</h3>
        <p>Seamlessly manage your data across AWS, Azure, Google Cloud, and more.</p>
      </motion.div>
      <motion.div 
        className={styles.featureItem}
        variants={featureVariants}
        initial="hidden"
        animate={controls}
      >
        <img src={info} alt="Advanced Analytics" />
        <h3>Advanced Analytics</h3>
        <p>Gain deep insights into your data usage and storage patterns.</p>
      </motion.div>
      <motion.div 
        className={styles.featureItem}
        variants={featureVariants}
        initial="hidden"
        animate={controls}
      >
        <img src={file} alt="Easy File Management" />
        <h3>Easy File Management</h3>
        <p>Effortlessly browse, upload, and download files across your cloud storage.</p>
      </motion.div>
    </div>
  );
};

export default Features;