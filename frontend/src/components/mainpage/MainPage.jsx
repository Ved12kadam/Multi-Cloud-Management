import React, { useState } from 'react';
import Navbar from './navbar/Navbar';
import SideBar from './sidebar/SideBar';
import styles from './mainpage.module.css';
import DashBoard from './dashboard/DashBoard';
import FileManager from './filemanager/FileManager';
import Transfer from './transfer/Transfer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Instruction from './Instruction';
import Settings from './settings/Settings';

function MainPage({ refresh, onUnlinkSuccess }) {
  const [selectedAccountId, setSelectedAccountId] = useState(null); // Store selected account ID

  return (
    <div className={styles.mainpage}>
      <Navbar />
      <SideBar refresh={refresh} setSelectedAccount={setSelectedAccountId} /> {/* Pass function to Sidebar */}
      <motion.div
        className={styles.right_container}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        <Routes>
          <Route path="/" element={<Instruction />} />
          <Route path="dashboard" element={<DashBoard accountId={selectedAccountId} />} /> {/* Pass accountId */}
          <Route path="filemanager/:provider/:id" element={<FileManager />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="settings" element={<Settings onUnlinkSuccess={onUnlinkSuccess} />} />
        </Routes>
      </motion.div>
    </div>
  );
}

export default MainPage;
