import React, { useState, useEffect, useRef } from 'react';
import styles from './filemanager.module.css';
import { MdDelete, MdOutlineRefresh } from "react-icons/md";
import moment from 'moment';
import {BarLoader} from 'react-spinners';
import { useParams } from 'react-router-dom';
import { MdFolder, MdImage, MdVideoLibrary, MdDescription, MdInsertDriveFile, MdOutlineFileDownload } from "react-icons/md";

import { motion } from "framer-motion";

const FileManager = () => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [allFiles, setAllFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const fileTableRef = useRef(null);
    const [isScrollable, setIsScrollable] = useState(false);
    const [downloadingFiles, setDownloadingFiles] = useState({});
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentFolder, setCurrentFolder] = useState('');
    const [navigationHistory, setNavigationHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingFiles, setDeletingFiles] = useState({});



    
    const getFileIcon = (file) => {
        if (file.isFolder) return <MdFolder size={20} className={styles.folder_icon} />;
        
        const extension = file.name.split('.').pop().toLowerCase();
    
        const fileIcons = {
            "jpg": <MdImage size={20} color="#fbbf24" />, 
            "png": <MdImage size={20} color="#fbbf24" />,
            "gif": <MdImage size={20} color="#fbbf24" />,
            "mp4": <MdVideoLibrary size={20} color="#ff5733" />,
            "mkv": <MdVideoLibrary size={20} color="#ff5733" />,
            "avi": <MdVideoLibrary size={20} color="#ff5733" />,
            "pdf": <MdDescription size={20} color="#e63946" />,
            "doc": <MdDescription size={20} color="#4a90e2" />,
            "docx": <MdDescription size={20} color="#4a90e2" />,
            "txt": <MdInsertDriveFile size={20} color="#9ca3af" />,
            "zip": <MdInsertDriveFile size={20} color="#f97316" />,
            "rar": <MdInsertDriveFile size={20} color="#f97316" />
        };
    
        return fileIcons[extension] || <MdInsertDriveFile size={20} color="#eaeaea" />;
    };



    const handleFolderSelect = (folderId) => {
        setNavigationHistory([...navigationHistory, currentFolder]); // Store previous folder
       
        setCurrentFolder(folderId);
        fetchFiles(folderId); // Fetch files in the selected folder
    };

    const handleBack = () => {
        if (navigationHistory.length > 0) {
            const previousFolder = navigationHistory[navigationHistory.length - 1];
            setNavigationHistory(navigationHistory.slice(0, -1));
            setCurrentFolder(previousFolder || null);
            fetchFiles(previousFolder || ""); // Fetch files from the previous folder
        } else {
            setCurrentFolder(null);
            setNavigationHistory([]);
            fetchFiles(""); // Fetch root files
        }
    };

    const { provider, id} = useParams();
    useEffect(() => {
        setLoading(true);
    
        // Clear previous file list before fetching new files
        setAllFiles([]);
        setFilteredFiles([]);
    
        const fetchData = async () => {
            await fetchFiles();
            setLoading(false);
        };
    
        fetchData();
    }, [provider, id]);  // Trigger effect when switching FileManager tabs

    const fetchFiles = async (folderId = '') => {
        setLoading(true); // Show loader before fetching
    
        try {
            const response = await fetch(`/files/${provider}/${id}?folder=${folderId}`);  
            if (!response.ok) {
                throw new Error(`Error fetching files: ${response.statusText}`);
            }
            const data = await response.json();
    
            console.log("file data", data);
            setAllFiles(data);
            filterFiles(data, 'all');
    
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false); // Hide loader after fetching
        }
    };
    

    const filterFiles = (files, category) => {
        let filtered = [];
        
        if (category === 'all') {
            filtered = files;
        } else if (category === 'document') {
            filtered = files.filter(file => {
                if (file && file.name) {
                    const fileExtension = file.name.toLowerCase().slice(-4);
                    return ['.pdf', '.docx', '.doc', '.txt', '.rtf'].some(ext => file.name.toLowerCase().endsWith(ext));
                }
                return false;
            });
        } else if (category === 'image') {
            filtered = files.filter(file => {
                if (file && file.name) {
                    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].some(ext => file.name.toLowerCase().endsWith(ext));
                }
                return false;
            });
        } else if (category === 'video') {
            filtered = files.filter(file => {
                if (file && file.name) {
                    return ['.mp4', '.avi', '.mkv', '.mov', '.flv', '.wmv', '.webm'].some(ext => file.name.toLowerCase().endsWith(ext));
                }
                return false;
            });
        } else {
            filtered = files.filter(file => {
                if (file && file.category) {
                    return file.category.toLowerCase() === category.toLowerCase();
                }
                return false;
            });
        }
    
        setFilteredFiles(filtered);
    };
    const handleSelect = (fileName) => {
        setSelectedFiles((prev) =>
            prev.includes(fileName) ? prev.filter((name) => name !== fileName) : [...prev, fileName]
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedFiles(filteredFiles.map(file => file.name));
        } else {
            setSelectedFiles([]);
        }
    };

    const toggleSelecting = () => {
        setIsSelecting(!isSelecting);
        setSelectedFiles([]);
    };

    const handleDelete = async () => {
        if (selectedFiles.length === 0) return;
    
        try {
            const newDeletingFiles = { ...deletingFiles };
            for (const fileName of selectedFiles) {
                const file = allFiles.find(f => f.name === fileName) || filteredFiles.find(f => f.name === fileName);
                if (!file) continue;
    
                newDeletingFiles[file.id] = true;
            }
            setDeletingFiles(newDeletingFiles); // Start loading animation
    
            for (const fileName of selectedFiles) {
                const file = allFiles.find(f => f.name === fileName) || filteredFiles.find(f => f.name === fileName);
                if (!file) continue;
    
                const response = await fetch(`/delete/${provider}/${id}/${file.id}/${file.name}`, { method: 'DELETE' });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Error deleting ${file.name}: ${errorData.error || response.statusText}`);
                }
            }
    
            setSelectedFiles([]);
            fetchFiles(currentFolder);
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setDeletingFiles({}); // Reset loading state
        }
    };
    

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        if (!provider || !id) {
            setError('Missing provider or account ID.');
            return;
        }
    
        const formData = new FormData();
        formData.append('file', file);
        formData.append('provider', provider);
        formData.append('id', id);
        formData.append('parent_folder_id', currentFolder || ''); // Ensure correct handling
    
        setUploading(true);
    
        try {
            const response = await fetch(`/upload/${provider}/${id}`, {
                method: 'POST',
                body: formData,
            });
    
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error uploading file: ${errorData.error || response.statusText}`);
            }
    
            await response.json();
            fetchFiles(currentFolder); // Refresh file list after upload
            setSuccessMessage('File uploaded successfully!');
        } catch (error) {
            setError(error.message);
        } finally {
            setUploading(false);
            event.target.value = ''; // Clear input on success/failure
        }
    };
    
    

    const handleRefresh = () => {
        fetchFiles();
    };

    const handleNewFolder = async (folderName) => {
        try {
            const response = await fetch(`/create-folder/${provider}/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    folder_name: folderName,  // ✅ Change "name" to "folder_name"
                    parent_folder_id: currentFolder || ""  // Default to root as empty string
                }),
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(`Error creating folder: ${data.error || response.statusText}`);
            }
    
            console.log("✅ Folder created successfully:", data.folder_info);
            
            // Refresh file list after creating the folder
            fetchFiles(currentFolder);
        } catch (error) {
            console.error("❌ Error creating folder:", error);
        }
    };

    const handleDownload = async (file) => {
        setDownloadingFiles(prev => ({ ...prev, [file.id]: true })); // Use file.id as key
    
        try {
            console.log("fileId", file.id);
    
            // Ensure `account_id` is correctly passed
            const response = await fetch(`/download/${provider}/${id}/${file.id}`, { 
                method: 'GET' 
            }); 
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error downloading file: ${errorData.error || response.statusText}`);
            }
    
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
    
            a.href = url;
            a.download = file.name; // Use file.name
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
    
            setError(null);
        } catch (error) {
            setError(error.message);
        } finally {
            setDownloadingFiles(prev => ({ ...prev, [file.id]: false })); // Use file.id as key
        }
    };
    
    
    

    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        filterFiles(allFiles, category);
    };

   
    const getFileExtension = (fileName) => {
        if (!fileName) return ""; // Handle missing file name
        const lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex === -1) return fileName; // No extension found
        return fileName.slice(lastDotIndex + 1).toLowerCase(); // Return extension in lowercase
    };

    const formatFileSize = (size) => {
        if (size === null || size === undefined) return "-";
        const sizeInBytes = parseInt(size, 10);
        if (isNaN(sizeInBytes)) return "-";

        if (sizeInBytes < 1024) {
            return `${sizeInBytes} B`;
        } else if (sizeInBytes < 1024 * 1024) {
            return `${(sizeInBytes / 1024).toFixed(2)} KB`;
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
        } else {
            return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = moment(dateString);
        return date.format('YYYY-MM-DD'); // Or any other format you prefer
    };

    const fileManagerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <motion.div 
            key={id} // Unique key to re-trigger animation when switching File Managers
            className={styles.file_manager}
            variants={fileManagerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            {/* Header Section */}
            <motion.div 
                className={styles.header}
                initial={{ opacity: 0, y: -20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.4 }}
            >
                <h1>Files</h1>
                <p>Manage your files and folders</p>
                <motion.div 
                    className={styles.header_buttons}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {/* Back Button */}
                    {navigationHistory.length > 0 && (
                        <motion.button 
                            className={styles.back_btn} 
                            onClick={handleBack}
                            whileHover={{ scale: 1.1 }} 
                            whileTap={{ scale: 0.9 }}
                        >
                            ← Back
                        </motion.button>
                    )}
    
                    {/* Upload Button */}
                    <input type="file" id="fileUpload" style={{ display: 'none' }} onChange={handleUpload} />
                    <label htmlFor="fileUpload" className={styles.upload_btn} disabled={uploading}>
                        {uploading ? "Uploading..." : "Upload"}
                    </label>
    
                    {/* New Folder Button */}
                    <motion.button 
                        className={styles.new_folder_btn} 
                        onClick={() => {
                            const folderName = prompt("Enter new folder name:");
                            if (folderName) {
                                handleNewFolder(folderName);
                            }
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        New Folder
                    </motion.button>
    
                    {/* Select & Delete Buttons */}
                    <motion.button 
                        className={styles.select_btn} 
                        onClick={toggleSelecting}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        {isSelecting ? 'Cancel' : 'Select'}
                    </motion.button>
    
                    {isSelecting && (
                        <motion.button
                            className={styles.delete_btn}
                            onClick={handleDelete}
                            disabled={selectedFiles.length === 0}
                            whileHover={{ scale: 1.1}}
                        >
                            <MdDelete /> Delete
                        </motion.button>
                    )}
    
                    {/* Refresh Button */}
                    <motion.button 
                        className={styles.refresh_btn} 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {refreshing ? <span className={styles.refreshing_spinner}></span> : <MdOutlineRefresh />}
                    </motion.button>
                </motion.div>
            </motion.div>
    
            {/* Category Tabs */}
            <motion.div 
                className={styles.category_tabs}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {["all", "image", "video", "document"].map((category, index) => (
                    <motion.button
                        key={category}
                        className={selectedCategory === category ? styles.active : ''}
                        onClick={() => handleCategoryChange(category)}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                    >
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                    </motion.button>
                ))}
            </motion.div>
    
            {/* File Table */}
            <motion.table 
                className={`${styles.file_table} ${isScrollable ? styles.scrollable : ''}`} 
                ref={fileTableRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <thead>
                    <tr>
                        <th>
                            {isSelecting && (
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={selectedFiles.length === filteredFiles.length}
                                />
                            )}
                        </th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Modified</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredFiles.map((file, index) => (
                        <motion.tr 
                            key={file.id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <td>
                                {isSelecting && (
                                    <input 
                                        type="checkbox" 
                                        checked={selectedFiles.includes(file.name)} 
                                        onChange={() => handleSelect(file.name)} 
                                    />
                                )}
                            </td>
                            <td>
                                <span 
                                    className={styles.folder_item} 
                                    onClick={() => file.isFolder && handleFolderSelect(file.id)}
                                >
                                    {getFileIcon(file)} {file.name}
                                </span>
                            </td>
                            <td>{file.isFolder ? "Folder" : getFileExtension(file.name)}</td>
                            <td>{formatFileSize(file.size)}</td>
                            <td>{formatDate(file.modified)}</td>
                            <td>
                            <div className={styles.action_buttons}> {/* ADD THIS DIV */}
                                <motion.button 
                                    onClick={() => handleDownload(file)} 
                                    className={styles.download_btn} 
                                    disabled={downloadingFiles[file.id]} 
                                    whileHover={{ scale: 1.1 }}
                                >
                                    {!downloadingFiles[file.id] ? (
                                        <MdOutlineFileDownload size={20} />
                                    ) : (
                                        <BarLoader color="#eaeaea" width={30} />
                                    )}
                                </motion.button>
                                <motion.button
                                    onClick={() => {
                                    setSelectedFiles([file.name]);
                                     handleDelete();}}
                                    className={styles.delete_btn_row}
                                    disabled={deletingFiles[file.id]} // Disable during deletion
                                    whileHover={{ scale: 1.1 }}
>
                                    {deletingFiles[file.id] ? (
                                    <BarLoader color="#eaeaea" width={30} />
                                    ) : (
                                    <MdDelete />
                                    )}
                                </motion.button>
                                </div>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </motion.table>
        </motion.div>
    );
}
export default FileManager;