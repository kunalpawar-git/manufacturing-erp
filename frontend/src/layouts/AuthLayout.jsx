import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 via-slate-900 to-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Outlet />
    </div>
  );
}

