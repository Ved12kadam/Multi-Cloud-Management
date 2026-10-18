import React, { useState, useEffect } from "react";
import styles from "./to.module.css";
import {
  FaFile,
  FaFileImage,
  FaFileVideo,
  FaFilePdf,
  FaFolder,
} from "react-icons/fa";
import { motion } from "framer-motion";

const To = ({
  onSelect,
  selectedProvider,
  onFolderSelect,
  refreshTrigger,
  selectedAccountId,
  selectedFiles, // Added selectedFiles prop
}) => {
  const [accounts, setAccounts] = useState([]); // Store linked accounts
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [files, setFiles] = useState([]);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");

  // Debugging: Check if selectedFiles is received correctly
  useEffect(() => {
    console.log("📩 Received Selected Files in To.jsx:", selectedFiles);
  }, [selectedFiles]);

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
  }, [selectedProvider, selectedAccountId]);

  const fetchFiles = () => {
    if (selectedProvider && selectedAccount) {
      fetch(
        `/list-files?provider=${selectedProvider}&account_id=${selectedAccount}&folder=${currentFolder || ""}`
      )
        .then((response) => response.json())
        .then((data) => setFiles(data))
        .catch((error) => console.error("Error fetching files:", error));
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedProvider, selectedAccount, currentFolder, refreshTrigger]);

  const handleAccountSelect = (accountId) => {
    setSelectedAccount(accountId);
    setCurrentFolder(null);
    setNavigationHistory([]);
    onSelect(selectedProvider, accountId);
  };

  const handleFolderSelect = (folderId) => {
    console.log("📂 Folder Selected:", folderId);
    onFolderSelect(folderId);
    setNavigationHistory([...navigationHistory, currentFolder]);
    setCurrentFolder(folderId);
  };

  const handleBack = () => {
    if (currentFolder) {
      const previousFolder = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(navigationHistory.slice(0, -1));
      setCurrentFolder(previousFolder || null);
    } else if (selectedAccount) {
      setSelectedAccount(null);
      setNavigationHistory([]);
      setFiles([]);
    } else {
      onSelect(null);
      setAccounts([]);
    }
  };

  const handleNewFolder = () => {
    if (newFolderName.trim() === "") {
      alert("Please enter a folder name.");
      return;
    }

    fetch(`/create-folder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: selectedProvider,
        accountId: selectedAccount,
        parent_folder_id: currentFolder || "",
        folder_name: newFolderName,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Server Response:", data);

        if (data.success) {
          setFiles([
            ...files,
            { id: data.folder_info.id, name: newFolderName, isFolder: true },
          ]);
          setNewFolderName("");
          fetchFiles();
        } else {
          alert(`Failed to create folder: ${data.error || "Unknown error"}`);
        }
      })
      .catch((error) => {
        console.error("Error creating folder:", error);
        alert("An error occurred while creating the folder.");
      });
  };

  const getFileIcon = (file) => {
    if (file.isFolder) return <FaFolder className={styles.folderIcon} />;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    const fileIcons = {
      jpg: <FaFileImage className={styles.fileIcon} />,
      jpeg: <FaFileImage className={styles.fileIcon} />,
      png: <FaFileImage className={styles.fileIcon} />,
      gif: <FaFileImage className={styles.fileIcon} />,
      mp4: <FaFileVideo className={styles.fileIcon} />,
      mkv: <FaFileVideo className={styles.fileIcon} />,
      avi: <FaFileVideo className={styles.fileIcon} />,
      pdf: <FaFilePdf className={styles.fileIcon} />,
    };

    return fileIcons[fileExtension] || <FaFile className={styles.fileIcon} />;
  };

  return (
    <motion.div
      className={styles.toContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3>TO</h3>

      <div className={styles.headerContainer}>
        <div className={styles.backButtonContainer}>
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
          <p>Select a destination provider</p>
        </>
      ) : !selectedAccount ? (
        <>
           <h4 className={styles.accountSelectTitle}>Select an Account</h4>
          {accounts.length === 0 ? (
            <p>No linked accounts found.</p>
          ) : (
            <div className={styles.accountList}>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleAccountSelect(account.id)}
                  className={styles.accountButton}
                >
                  {account.email || `Account ${account.id}`}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          
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
                    <span className={styles.fileIcon}>{getFileIcon(file)}</span>{" "}
                    {file.name}
                  </button>
                ) : (
                  <span className={styles.fileLabel}>
                    <span className={styles.fileIcon}>{getFileIcon(file)}</span>{" "}
                    {file.name}
                  </span>
                )}
              </motion.div>
            ))}
          </div>

          <motion.div
            className={styles.bottomSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className={styles.newFolderInput}
            />
            <button onClick={handleNewFolder} className={styles.newFolderButton}>
              Create New Folder
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default To;
