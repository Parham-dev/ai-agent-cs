"use client"

import Link from 'next/link'
import { Heart, Github, Twitter } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          {/* Left side - Copyright */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>© 2024 AI Customer Service Platform</span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              Made with <Heart className="h-3 w-3 text-red-500 mx-1" /> by the community
            </span>
          </div>

          {/* Right side - Links */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4 text-sm">
              <Link 
                href="/docs" 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Docs
              </Link>
              <Link 
                href="/support" 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Support
              </Link>
              <Link 
                href="/changelog" 
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Changelog
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link 
                href="https://github.com/yourusername/ai-customer-service-platform" 
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" />
              </Link>
              <Link 
                href="https://twitter.com/aicustomerplatform" 
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}