import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #f9fafb 0%, #eff6ff 100%)',
      }}
    >
      {/* Navigation Header */}
      <nav className="modern-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <Link href="/" className="nav-brand">
                <div className="nav-brand-icon">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                Personal Tracker
              </Link>

              {/* Navigation Links */}
              <div className="hidden sm:ml-8 sm:flex nav-links">
                <Link
                  href="/"
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  <svg
                    className="nav-link-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  Goals
                </Link>

                <Link
                  href="/reports"
                  className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
                >
                  <svg
                    className="nav-link-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Reports
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center">
              <button
                type="button"
                className="mobile-menu-button"
                onClick={() => {
                  const mobileMenu = document.getElementById('mobile-menu');
                  const button = document.querySelector('.mobile-menu-button');
                  if (mobileMenu && button) {
                    mobileMenu.classList.toggle('hidden');
                    button.classList.toggle('menu-open');
                  }
                }}
              >
                <span className="sr-only">Open main menu</span>
                <div className="hamburger-lines">
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                  <span className="hamburger-line"></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className="sm:hidden hidden mobile-menu-modern"
          id="mobile-menu"
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(229, 231, 235, 0.8)',
          }}
        >
          <div className="px-3 pt-3 pb-4 space-y-2">
            <Link
              href="/"
              className={`mobile-nav-link ${
                isActive('/') ? 'mobile-nav-link-active' : ''
              }`}
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.add('hidden');
                }
              }}
            >
              <div className="mobile-nav-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <div className="mobile-nav-text">
                <span className="mobile-nav-title">Goals</span>
                <span className="mobile-nav-subtitle">Manage your objectives</span>
              </div>
            </Link>

            <Link
              href="/reports"
              className={`mobile-nav-link ${
                isActive('/reports') ? 'mobile-nav-link-active' : ''
              }`}
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.add('hidden');
                }
              }}
            >
              <div className="mobile-nav-icon">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="mobile-nav-text">
                <span className="mobile-nav-title">Reports</span>
                <span className="mobile-nav-subtitle">View your progress</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            Personal Routine Tracker - Built with Next.js & TypeScript
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
