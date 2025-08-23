import React from 'react';
import { Outlet, Link } from '@tanstack/react-router';
import { Briefcase, Plus, Home } from 'lucide-react';

export function Root() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                Job Application Tracker
              </h1>
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                activeProps={{
                  className: "flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50"
                }}
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Link>
              <Link
                to="/jobs/new"
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Job
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
