import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import '../theme.css';
import './MainLayout.css';

const MainLayout = ({ children }) => (
  <div className="main-layout">
    <Header />
    <div className="layout-body">
      <Sidebar />
      <main className="layout-content">
        {children}
      </main>
    </div>
    <Footer />
  </div>
);

export default MainLayout;
