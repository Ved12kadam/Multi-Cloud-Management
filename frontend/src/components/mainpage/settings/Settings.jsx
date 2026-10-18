import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./settings.module.css";
import { motion } from "framer-motion";

const Settings = ({ onUnlinkSuccess }) => {
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/linked-accounts", {
        withCredentials: true,
      });
      if (Array.isArray(response.data)) {
        setLinkedAccounts(response.data);
      } else {
        setLinkedAccounts([]);
        setError("Invalid response from server.");
      }
    } catch (err) {
      setError("Failed to fetch linked accounts.");
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlink = async (serviceType) => {
    try {
      const response = await axios.post(
        "/unlink-account",
        { service_type: serviceType ,account_id: linkedAccounts.find(account => account.provider === serviceType).id},
        
        { withCredentials: true }
      );
      setMessage(response.data.message);
      fetchLinkedAccounts();
      onUnlinkSuccess();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to unlink account.");
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <h2>Settings</h2>
      <h3>Linked Accounts</h3>
      {isLoading ? (
        <p>Loading...</p>
      ) : linkedAccounts.length > 0 ? (
        <motion.ul
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {linkedAccounts.map((account) => (
            <motion.li
              key={account.id} // Assuming each account has a unique 'id'
              className={styles.account}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className={styles.accountContent}>
                {account.profile_picture && (
                  console.log(account.profile_picture),
                  <img
    src={account.profile_picture}
    alt={`${account.provider} Profile`}
    className={styles.accountProfilePicture}
    referrerPolicy="no-referrer"
    onError={(e) => {
        console.error("Image failed to load:", e.target.src);
        e.target.src = "https://via.placeholder.com/40"; // Fallback image
    }}
/>

                )}
                <span>{account.provider} - {account.email}</span>
              </div>
              <motion.button
                onClick={() => handleUnlink(account.provider)}
                className={styles.unlinkButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Unlink
              </motion.button>
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p>No linked accounts.</p>
      )}
      {message && <p className={styles.success}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </motion.div>
  );
};

export default Settings;