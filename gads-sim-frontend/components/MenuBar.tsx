'use client';

import React, { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MenuBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showGeminiWidget, setShowGeminiWidget] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignUp = () => {
    router.push('/signup');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex-shrink-0">
            <a href="/" className="text-xl font-bold text-gray-800 hover:text-gray-600 transition-colors">
              Google Ads Simulator
            </a>
          </div>

          {/* Navigation Items - Only show when logged in */}
          {session && (
            <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
              <div className="flex items-baseline space-x-4">
                <a
                  href="/campaign/new"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  New Campaign
                </a>
                <a
                  href="/keyword-planner"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Keyword Planner
                </a>
              </div>
            </div>
          )}

          {/* Right side - Auth buttons or user widgets */}
          <div className="flex items-center space-x-4">
            {session ? (
              <div className="flex items-center space-x-4">
                {/* Gemini Tokens Widget */}
                <div className="relative">
                  <button
                    onClick={() => setShowGeminiWidget(!showGeminiWidget)}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:border-gray-400 transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 2v11h3v9l7-12h-4l2-8z" />
                    </svg>
                  </button>

                  {/* Gemini Widget Dropdown */}
                  {showGeminiWidget && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                      <div className="space-y-3">
                        <h3 className="font-semibold text-gray-900">Gemini Tokens & Operations</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Available Tokens:</span>
                            <span className="text-sm font-medium text-green-600">1,250</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Google Ads Operations:</span>
                            <span className="text-sm font-medium text-blue-600">45</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Campaign Simulations:</span>
                            <span className="text-sm font-medium text-purple-600">12</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <button className="text-xs text-blue-600 hover:text-blue-800">
                            View Usage Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Initials Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center text-sm font-medium text-gray-900"
                  >
                    {getUserInitials(session.user?.name || 'User')}
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                             <a
                               href="/profile"
                               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                             >
                               Profile Settings
                             </a>
                             <a
                               href="/usage"
                               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                             >
                               Usage Statistics
                             </a>
                             {session.user?.role === 'admin' && (
                               <a
                                 href="/admin"
                                 className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-200 mt-2 pt-2"
                               >
                                 Admin Dashboard
                               </a>
                             )}
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleLogin}
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md text-sm font-medium transition-colors border border-gray-300 hover:border-gray-400"
                >
                  Login
                </button>
                <button
                  onClick={handleSignUp}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu - Only show navigation when logged in */}
      {session && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a
              href="/campaign/new"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              New Campaign
            </a>
            <a
              href="/keyword-planner"
              className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
            >
              Keyword Planner
            </a>
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 px-3 py-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700">
                    {getUserInitials(session.user?.name || 'User')}
                  </div>
                  <span className="text-sm text-gray-700">
                    {session.user?.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(showGeminiWidget || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowGeminiWidget(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </nav>
  );
}
