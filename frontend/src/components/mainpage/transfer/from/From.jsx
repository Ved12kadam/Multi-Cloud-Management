import React, { useState, useEffect } from "react";
import styles from "./from.module.css";
import { FaFolder } from "react-icons/fa";
import { motion } from "framer-motion";

const From = ({ onSelect, selectedProvider,selectedAccountId,onFileSelect, onFolderChange }) => {
  const [accounts, setAccounts] = useState([]); // Store linked accounts
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [navigationHistory, setNavigationHistory] = useState([]);

  // Fetch linked accounts when a provider is selected
  useEffect(() => {
    if (selectedProvider) {
      fetch(`/linked-accounts?provider=${selectedProvider}`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Linked Accounts:", data);
          setAccounts(data);
        })
        .catch((error) => console.error("Error fetching accounts:", error));
    }
  }, [selectedProvider,selectedAccountId]);

  // Fetch files for selected account and folder
  useEffect(() => {
    if (selectedProvider && selectedAccount) {
      fetch(
        `/list-files?provider=${selectedProvider}&account_id=${selectedAccount}&folder=${currentFolder || ""}`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Files from API:", data);
          setFiles(data);
          onFolderChange(currentFolder);
        })
        .catch((error) => console.error("Error fetching files:", error));
    }
  }, [selectedProvider, selectedAccount, currentFolder, onFolderChange]);

  // Handle account selection
  const handleAccountSelect = (accountId) => {
    setSelectedAccount(accountId);
    setCurrentFolder(null); // Reset folder navigation
    setNavigationHistory([]); // Clear history when selecting a new account
    onSelect(selectedProvider,accountId);
  };

  // Handle folder selection and navigation
  const handleFolderSelect = (folderId) => {
    setNavigationHistory([...navigationHistory, currentFolder]); // Save current folder to history
    setCurrentFolder(folderId);
    onFolderChange(folderId);
  };

  // Handle back button functionality
  const handleBack = () => {
    if (currentFolder) {
      // If inside a folder, go back to the previous folder
      const previousFolder = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentFolder(previousFolder || null);
      onFolderChange(previousFolder || null);
    } else if (selectedAccount) {
      // If at account selection, go back to provider selection
      setSelectedAccount(null);
      setNavigationHistory([]);
      setFiles([]);
    } else {
      // If at provider selection, reset everything
      onSelect(null);
      setAccounts([]);
    }
  };

  return (
    <motion.div
      className={styles.fromContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>FROM</h3>
      <div className={styles.headerContainer}> {/* Header Container */}
                <div className={styles.backButtonContainer}> {/* Back Button Container */}
                    {selectedProvider && (
                        <button onClick={handleBack} className={styles.backButton}>
                            &#8592;
                        </button>
                    )}
                </div>
                
            </div>

      {!selectedProvider ? (
        <>
          <motion.div
            className={styles.providerButtons}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => onSelect("GoogleDrive")}
              className={styles.providerButton}
            >
              Google Drive
            </button>
            <button
              onClick={() => onSelect("Dropbox")}
              className={styles.providerButton}
            >
              Dropbox
            </button>
          </motion.div>
          <p>Select a provider to transfer files from</p>
        </>
      ) : !selectedAccount ? (
        <>
          <h4 className={styles.accountSelectTitle}>Select an Account</h4>
          {accounts.length === 0 ? (
            <p>No linked accounts found.</p>
          ) : (
            <div className={`${styles.accountList} ${styles.verticalAccountList}`}>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account.id)}
                  className={`${styles.accountButton} ${styles.verticalAccountButton}`}
                >
                  {account.email || `Account ${account.id}`}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className={styles.fileList}>
          {files.map((file) => (
            <motion.div
              key={file.id}
              className={styles.fileItem}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {file.isFolder ? (
                <button
                  onClick={() => handleFolderSelect(file.id)}
                  className={styles.folderButton}
                >
                  <span className={styles.fileIcon}>
                    <FaFolder />
                  </span>{" "}
                  {file.name}
                </button>
              ) : (
                <label className={styles.fileLabel}>
                  <input
                    type="checkbox"
                    value={file.id}
                    className={styles.fileCheckbox}
                    onChange={() => {
                      console.log("✅ Selected File:", file);
                      if (!file.mimeType) {
                        console.warn(
                          "⚠️ Warning: Missing mimeType for:",
                          file.name
                        );
                      }
                      onFileSelect({
                        id: file.id,
                        name: file.name,
                        mimetype: file.mimeType || "application/octet-stream",
                      });
                    }}
                  />
                  <span className={styles.fileIcon}>📄</span> {file.name}
                </label>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default From;
