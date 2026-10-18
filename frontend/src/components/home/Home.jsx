import React from 'react'
import Navbar from './navbar/Navbar'
import Content from './content/Content'
import Features from './features/Features'
import Footer from './footer/Footer'
import styles from './home.module.css';
function Home() {
  return (
    <div className={styles.home}>
      <Navbar/>
      <Content/>
      <Features/>
      <Footer/>
    </div>
  )
}

export default Home
