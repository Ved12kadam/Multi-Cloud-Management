import React, { useState } from "react";
import From from "./from/From";
import To from "./to/To";
import styles from "./transfer.module.css";
import { motion } from "framer-motion";

const Transfer = () => {
  const [fromProvider, setFromProvider] = useState(null);
  const [selectedFromAccountId, setSelectedFromAccountId] = useState(null);
  const [toProvider, setToProvider] = useState(null);
  const [selectedToAccountId, setSelectedToAccountId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [refreshToFiles, setRefreshToFiles] = useState(0);
  const [destinationFolderId, setDestinationFolderId] = useState("");
  const [fromCurrentFolder, setFromCurrentFolder] = useState(null);

  const handleFileSelect = (file) => {
    console.log("📌 Adding File to Selection:", file);

    if (!file || !file.id) {
      console.error("🚨 Error: Received invalid file object!", file);
      return;
    }

    setSelectedFiles((prev) => {
      const updatedFiles = prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file];

      console.log("📂 Updated Selected Files:", updatedFiles);
      return updatedFiles;
    });
  };

  const handleTransfer = async () => {
    console.log("🔍 Checking transfer details:", {
      fromProvider,
      selectedFromAccountId,
      toProvider,
      selectedToAccountId,
      selectedFiles,
      destinationFolderId,
      fromCurrentFolder,
    });
  
    if (!fromProvider || !toProvider || !selectedFromAccountId || !selectedToAccountId) {
      setMessage("Please select both source and destination providers with their accounts");
      return;
    }
  
    if (selectedFiles.length === 0) {
      setMessage("Please select files to transfer");
      return;
    }
  
    setIsTransferring(true);
    setMessage(`Transferring from ${fromProvider} (Account: ${selectedFromAccountId}) to ${toProvider} (Account: ${selectedToAccountId})...`);
  
    try {
      const response = await fetch("/transfer-file", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_provider: fromProvider,
          from_account_id: selectedFromAccountId,
          to_provider: toProvider,
          to_account_id: selectedToAccountId,
          file_id: selectedFiles.length > 0 ? selectedFiles[0].id : null,
          file_name: selectedFiles.length > 0 ? selectedFiles[0].name : null,
          mimetype: selectedFiles.length > 0 ? selectedFiles[0].mimetype : null,
          destination_folder: destinationFolderId || "",
          source_folder: fromCurrentFolder || "",
        }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage(`Transfer completed: ${data.message}`);
        setRefreshToFiles((prev) => prev + 1);
      } else {
        setMessage(`Transfer failed: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsTransferring(false);
    }
  };
  

  return (
    <motion.div
      className={styles.transferContainer}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Cloud Transfer
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        Select files to transfer between cloud drives
      </motion.p>
      <div className={styles.transferSections}>
        <From
          onSelect={(provider, accountId) => {
            console.log("📌 From Provider Selected:", provider, "Account ID:", accountId);
            setFromProvider(provider);
            setSelectedFromAccountId(accountId);
          }}
          selectedProvider={fromProvider}
          selectedAccountId={selectedFromAccountId}
          onFileSelect={handleFileSelect}
          onFolderChange={setFromCurrentFolder}
        />
        <To
          onSelect={(provider, accountId) => {
            console.log("📌 To Provider Selected:", provider, "Account ID:", accountId);
            setToProvider(provider);
            setSelectedToAccountId(accountId);
          }}
          selectedProvider={toProvider}
          selectedAccountId={selectedToAccountId}
          refreshTrigger={refreshToFiles}
          onFolderSelect={setDestinationFolderId}
          selectedFiles={selectedFiles}
        />
      </div>
      <motion.button
        onClick={handleTransfer}
        className={styles.transferButton}
        disabled={isTransferring}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
      >
        {isTransferring ? (
            <>
                <span className={styles.spinner}></span>
                Transferring...
            </>
        ) : 'Transfer Now'}
      </motion.button>
      {message && (
        <motion.p
          className={styles.transferMessage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default Transfer;
