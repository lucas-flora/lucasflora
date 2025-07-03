'use client';

import { TerminalEntry } from '../lib/terminal-types';

interface FallbackPageProps {
  entries: TerminalEntry[];
}

export default function FallbackPage({ entries }: FallbackPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Lucas Flora
          </h1>
          <p className="text-xl text-gray-300 mb-6">Full Stack Developer</p>
          <div className="inline-block px-4 py-2 bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-300 text-sm">
              ⚠️ Your browser does not support WebGPU. You are viewing the fallback version.
            </p>
            <p className="text-yellow-200 text-xs mt-1">
              For the full 3D experience, try Chrome 113+ or Edge 113+
            </p>
          </div>
        </div>

        {/* Terminal Output Section */}
        {entries.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">Terminal Output</h2>
            <div className="bg-black bg-opacity-50 rounded-lg p-6 font-mono text-sm max-h-96 overflow-y-auto border border-gray-700">
              {entries.map((entry) => (
                <div key={entry.id} className="mb-2 text-green-400">
                  <span className="text-gray-500 text-xs mr-2">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="whitespace-pre-wrap">{entry.render()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Project Card Template */}
          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-colors">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Project 1</h3>
            <p className="text-gray-300 text-sm mb-4">
              A sample project description. This will be replaced with actual portfolio content.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-600 bg-opacity-20 text-blue-300 text-xs rounded">React</span>
              <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-300 text-xs rounded">Node.js</span>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-colors">
            <div className="h-32 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Project 2</h3>
            <p className="text-gray-300 text-sm mb-4">
              Another sample project. Real content will be added later.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-purple-600 bg-opacity-20 text-purple-300 text-xs rounded">TypeScript</span>
              <span className="px-2 py-1 bg-orange-600 bg-opacity-20 text-orange-300 text-xs rounded">WebGPU</span>
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-50 rounded-lg p-6 border border-gray-700 hover:border-gray-500 transition-colors">
            <div className="h-32 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg mb-4"></div>
            <h3 className="text-xl font-semibold mb-2">Project 3</h3>
            <p className="text-gray-300 text-sm mb-4">
              Third sample project placeholder.
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-red-600 bg-opacity-20 text-red-300 text-xs rounded">Three.js</span>
              <span className="px-2 py-1 bg-indigo-600 bg-opacity-20 text-indigo-300 text-xs rounded">R3F</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Get In Touch</h2>
          <div className="flex justify-center gap-6">
            <a 
              href="#" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              GitHub
            </a>
            <a 
              href="#" 
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              LinkedIn
            </a>
            <a 
              href="#" 
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
            >
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 