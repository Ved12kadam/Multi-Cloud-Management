import React from 'react';
import styles from './Instructions.module.css';
import { FaLink } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import GridViewIcon from '@mui/icons-material/GridView';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import { FaArrowsAlt } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import WbCloudyOutlinedIcon from '@mui/icons-material/WbCloudyOutlined';
function Instruction() {
  const listVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeInOut' } },
  };

  return (
    <motion.div
      className={styles.instructionsContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      <motion.h2
        className={styles.title}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        <WbCloudyOutlinedIcon className={styles.icon} />
        Welcome to MultiCloud Storage!
      </motion.h2>
      <motion.p
        className={styles.intro}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        This application helps you manage files across multiple cloud providers in one place.
        Below are some quick tips to get started:
      </motion.p>
      <motion.ul
        className={styles.instructionsList}
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.2 }}
      >
        <motion.li variants={listVariants}>
          <FaLink className={styles.listIcon} />
          <strong>Link Your Accounts:</strong> First, link your Google Drive and Dropbox accounts by clicking on the navbar links.
        </motion.li>
        <motion.li variants={listVariants}>
          <GridViewIcon className={styles.listIcon} />
          <strong>Dashboard:</strong> See an overview of your cloud usage and linked accounts.
        </motion.li>
        <motion.li variants={listVariants}>
          <FolderRoundedIcon className={styles.listIcon} />
          <strong>File Manager:</strong> Browse, upload, and download files from your linked providers.
        </motion.li>
        <motion.li variants={listVariants}>
          <FaArrowsAlt className={styles.listIcon} />
          <strong>Transfer:</strong> Transfer or sync files between different cloud accounts seamlessly.
        </motion.li>
        <motion.li variants={listVariants}>
          <IoSettingsOutline className={styles.listIcon} />
          <strong>Settings:</strong> Manage your profile and adjust application preferences.
        </motion.li>
      </motion.ul>
      <motion.p
        className={styles.footerText}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        Your linked accounts will appear in the sidebar for easy access. Explore each section in the sidebar to unlock all the features!
      </motion.p>
    </motion.div>
  );
}

export default Instruction;