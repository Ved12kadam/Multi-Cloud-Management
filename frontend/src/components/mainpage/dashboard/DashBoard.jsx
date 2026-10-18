import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./dashboard.module.css";
import { MdOutlineFileDownload } from "react-icons/md";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import { FaArrowsAlt, FaGoogleDrive, FaDropbox, FaGoogle } from "react-icons/fa"; // Added FaGoogle
import { HiOutlineDocumentText } from "react-icons/hi";
import { SyncLoader } from "react-spinners";
import SyncProblemIcon from "@mui/icons-material/SyncProblem";
import { motion } from "framer-motion"; // Import Framer Motion

axios.defaults.withCredentials = true;
const backendUrl = "https://localhost:5000"; // ✅ Fixed backend URL

function DashBoard() {
    const [storageData, setStorageData] = useState([]);
    const [fileData, setFileData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log(`Fetching storage data`);
                const storageResponse = await axios.get(`${backendUrl}/storage-data`);
                console.log("Storage data response:", storageResponse.data);
                setStorageData(storageResponse.data || []);

                console.log(`Fetching file data`);
                const fileResponse = await axios.get(`${backendUrl}/file-data`);
                console.log("File data response:", fileResponse.data);

                // Flattening structure: Extract files from each account and add provider info
                const formattedFiles = fileResponse.data.flatMap(account =>
                    account.files.map(file => ({
                        ...file,
                        provider: account.provider, // Store provider info
                        account_id: account.account_id // Keep account ID for reference
                    }))
                );

                console.log("Formatted file data:", formattedFiles);
                setFileData(formattedFiles || []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "An error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const formatFileSize = (size) => {
        if (!size || isNaN(size)) return "Unknown";
    
        const gb = size / (1024 * 1024 * 1024);
        if (gb >= 1) {
            return `${gb.toFixed(2)} GB`;
        }
    
        const mb = size / (1024 * 1024);
        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`;
        }
    
        const kb = size / 1024;
        return `${kb.toFixed(2)} KB`;
    };

    const formatStorageSize = (size) => {
        if (!size || isNaN(size)) return "Unknown";
        
        return `${parseFloat(size).toFixed(2)}`; // Ensures two decimal places
    };
    
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            console.log(`Refreshing file data`);
            const fileResponse = await axios.get(`${backendUrl}/file-data`);
            console.log("Refreshed file data response:", fileResponse.data);
            setFileData(fileResponse.data || []);
        } catch (err) {
            console.error("Error refreshing file data:", err);
            setError(err.message || "An error occurred during refresh.");
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className={styles["loading-container"]}>
                <SyncLoader color="#eaeaea" />
            </div>
        );
    }

    if (error) {
        return <div><SyncProblemIcon /> {error}</div>;
    }

    return (
        <motion.div
            className={styles.dashboard}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Storage Cards */}
            <motion.div
                className={styles.storage_cards}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                {storageData.length > 0 ? (
                    storageData.map((storage, index) => (
                        <motion.div
                            key={index}
                            className={styles.storage_card}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <span className={styles.storage_icon}>
                                {storage.provider === "GoogleDrive" ? <FaGoogleDrive /> : (storage.provider === "Dropbox" ? <FaDropbox /> : <FaGoogleDrive />)} {/* Google Drive Icon for Google and Dropbox Icon for Dropbox*/}
                            </span>
                            <p className={styles.storage_title}>{storage.name}</p>
                            <p className={styles.storage_usage}>
                                {formatStorageSize(storage.used)} GB / {storage.total} GB
                            </p>
                            <motion.div className={styles.progress_bar}>
                                <motion.div
                                    className={styles.progress}
                                    style={{ width: `${(storage.used / storage.total) * 100}%` }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(storage.used / storage.total) * 100}%` }}
                                    transition={{ duration: 1.2, ease: "easeInOut" }}
                                ></motion.div>
                            </motion.div>
                        </motion.div>
                    ))
                ) : (
                    <p>No storage data available.</p>
                )}
            </motion.div>

            {/* File Manager */}
            <motion.div
                className={styles.file_manager}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <div className={styles.file_manager_header}>
                    <h2>File Manager</h2>
                    <div className={styles.file_actions}>
                        {/* Removed Upload, Download, Transfer Buttons */}
                        <motion.button
                            className={styles.action_btn}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            whileHover={{ scale: 1.1 }}
                            
                        >
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </motion.button>
                    </div>
                </div>

                <div className={styles.file_table_container}>
                    <table className={styles.file_table}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Size</th>
                                <th>Modified</th>
                                {/* Removed Actions Column Header */}
                            </tr>
                        </thead>
                        <motion.tbody
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            {fileData.length > 0 ? (
                                fileData.map((file, index) => (
                                    <motion.tr
                                        key={index}
                                        whileHover={{ backgroundColor: "#222", scale: 1.02 }}
                                    >
                                        <td>
                                            {file.provider === "GoogleDrive" && <FaGoogleDrive className={styles.providerIcon} />} {/* Google Drive Icon */}
                                            {file.name && file.name.endsWith("/") ? <FolderRoundedIcon /> : <HiOutlineDocumentText />} {file.name || "unknown"}
                                        </td>
                                        <td>{formatFileSize(file.size)}</td>
                                        <td>{file.modified}</td>
                                        {/* Removed Actions Column Data */}
                                    </motion.tr>
                                ))
                            ) : (
                                <tr><td colSpan="3">No file data available.</td></tr> 
                            )}
                        </motion.tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default DashBoard;