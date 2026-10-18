import React, { useState } from 'react';
import { Home, SignUp, SignIn, MainPage, TermsOfService } from './components';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import styles from './app.module.css';
import axios from 'axios';
import { ResetPassword } from './components';
import { ForgotPassword } from './components';


axios.defaults.withCredentials = true;

const App = () => {
    const [refreshSidebar, setRefreshSidebar] = useState(false);

    const triggerSidebarRefresh = () => {
        setRefreshSidebar((prev) => !prev);
    };

    return (
        <div className={styles.app}>
            <Router>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route
                        path="/mainpage/*"
                        element={<MainPage refresh={refreshSidebar} onUnlinkSuccess={triggerSidebarRefresh} />}
                    />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="/ForgotPassword" element={<ForgotPassword />} />

                </Routes>
            </Router>
        </div>
    );
};

export default App;