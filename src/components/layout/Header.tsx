// App header component matching screenshot design
'use client';

import packageInfo from '../../../package.json';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and branding */}
          <div className="flex items-center space-x-6">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-500 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">KR</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Kozan AI Studio</span>
              <span className="text-xs text-gray-400 ml-2">v{packageInfo.version}</span>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-6">
              <div className="flex items-center space-x-1 bg-pink-500 text-white px-3 py-2 rounded">
                <span className="text-sm font-medium">AI Generator</span>
              </div>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm">Upload</span>
              </button>
            </nav>
          </div>

          {/* Right side - Title and user menu */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <h1 className="text-lg font-semibold text-gray-900">AI Generator</h1>
              <p className="text-sm text-gray-500">Compare Fashion AI Services - HuHu AI, FASHN AI, FitRoom</p>
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">A</span>
              </div>
              <div className="text-sm">
                <div className="text-gray-900">Admin</div>
                <div className="text-gray-500">Logout</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}