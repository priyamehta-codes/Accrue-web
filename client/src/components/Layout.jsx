import React from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

const Layout = ({ children, onTxAdded, mainClassName = '' }) => (
  <div className="app-shell">
    <Sidebar />
    <main className={`main-content ${mainClassName}`}>{children}</main>
    <BottomNav onTxAdded={onTxAdded} />
  </div>
);

export default Layout;
