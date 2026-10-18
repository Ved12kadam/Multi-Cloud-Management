import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./navbar.module.css";
import cloud from "../../../assets/download (2).png";

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const response = await fetch("https://localhost:5000/signout", {
        method: "GET",
        credentials: "include",
      });
  
      if (response.ok) {
        const data = await response.json();
        localStorage.clear();  // Clear frontend session data
        window.location.href = data.redirect;  // Redirect to sign-in page
      }
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.nav_logo}>
        <img src={cloud} alt="cloud logo" className={styles.cloud_logo} />
        <p>Cloud Manager</p>
      </div>
      <ul className={styles.nav_links}>
        <li>
          <a href="https://localhost:5000/google-drive">Google Drive</a>
        </li>
        <li>
          <a href="https://localhost:5000/dropbox">Dropbox</a>
        </li>
      </ul>
      <button className={styles.sign_out} onClick={handleSignOut}>
        Sign Out
      </button>
    </nav>
  );
};

export default Navbar;
