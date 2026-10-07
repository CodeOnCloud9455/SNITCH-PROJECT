import React from 'react';
import Nav from '../features/Shared/Components/Nav';
import { Outlet } from 'react-router';

const AppLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-[#f5f5f5] font-sans selection:bg-white selection:text-black">
      <Nav />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
