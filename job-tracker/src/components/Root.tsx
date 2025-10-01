import { Outlet, Link } from '@tanstack/react-router'
import { Briefcase, Plus, Home, FileText, Search } from 'lucide-react'
import { useAuth } from '../context/AuthProvider'
import { Footer } from './Footer'

export function Root() {
  const { user, signOut, isEnabled } = useAuth()

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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

            <div className="flex items-center space-x-4">
              {/* Auth status banner */}
              {isEnabled && (
                <div className="flex items-center space-x-2 text-sm">
                  {user ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Signed in as:</span>
                      <span className="font-medium text-blue-600">{user.email}</span>
                      <button
                        onClick={() => signOut()}
                        className="text-gray-500 hover:text-gray-700 underline"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Not signed in</span>
                      <Link
                        to="/login"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Sign in
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <nav className="flex space-x-4">
                <Link
                  to="/"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  activeProps={{
                    className:
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50',
                  }}
                >
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Link>

                <Link
                  to="/jobs"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  activeProps={{
                    className:
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50',
                  }}
                >
                  <Briefcase className="h-4 w-4 mr-1" />
                  My Jobs
                </Link>

                <Link
                  to="/discover"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  activeProps={{
                    className:
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50',
                  }}
                >
                  <Search className="h-4 w-4 mr-1" />
                  Discover
                </Link>

                {/* Optional: hide Add Job for logged-out users when auth is enabled */}
                {(!isEnabled || user) && (
                  <Link
                    to="/jobs/new"
                    className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Job
                  </Link>
                )}

                <Link
                  to="/documents"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  activeProps={{
                    className:
                      'flex items-center px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50',
                  }}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Documents
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
