import React, { useEffect, useState } from 'react';
import styles from './sidebar.module.css';
import GridViewIcon from '@mui/icons-material/GridView';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import { FaArrowsAlt } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';

function Sidebar({ refresh }) {
  const [linkedAccounts, setLinkedAccounts] = useState([]);

  useEffect(() => {
    // Fetch linked accounts from the backend
    axios.get('/linked-accounts')
      .then(response => {
        setLinkedAccounts(response.data);
      })
      .catch(error => {
        console.error("Error fetching linked accounts:", error);
      });
  }, [refresh]);

  return (
    <motion.div
      className={styles.sidebar}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <motion.ul
        className={styles.sidebar_menu}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeInOut' }}
      >
        <motion.li
          className={styles.menu_item}
          whileHover={{ scale: 1.05 }}
        >
          <NavLink to="dashboard" className={({ isActive }) => isActive ? styles.menu_link_active : styles.menu_link}>
            <span className={styles.icon}><GridViewIcon /></span> Dashboard
          </NavLink>
        </motion.li>

        {/* Dynamically Render File Managers for Each Account */}
        {linkedAccounts.map((account) => (
          <motion.li
            key={account.id}
            className={styles.menu_item}
            whileHover={{ scale: 1.05 }}
          >
            <NavLink
              to={`filemanager/${account.provider}/${account.id}`}
              className={({ isActive }) => isActive ? styles.menu_link_active : styles.menu_link}
            >
              <span className={styles.icon}><FolderRoundedIcon /></span>
              {account.provider} - {account.email.split('@')[0]}
            </NavLink>
          </motion.li>
        ))}

        <motion.li
          className={styles.menu_item}
          whileHover={{ scale: 1.05 }}
        >
          <NavLink to="transfer" className={({ isActive }) => isActive ? styles.menu_link_active : styles.menu_link}>
            <span className={styles.icon}><FaArrowsAlt /></span> Transfer
          </NavLink>
        </motion.li>
        <motion.li
          className={styles.menu_item}
          whileHover={{ scale: 1.05 }}
        >
          <NavLink to="settings" className={({ isActive }) => isActive ? styles.menu_link_active : styles.menu_link}>
            <span className={styles.icon}><IoSettingsOutline /></span> Settings
          </NavLink>
        </motion.li>
      </motion.ul>
    </motion.div>
  );
}

export default Sidebar;
