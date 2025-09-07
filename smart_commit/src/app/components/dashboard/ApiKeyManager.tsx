'use client'

import { useState, useEffect } from 'react'

interface ApiKey {
  id: string
  api_key: string
  name: string
  is_active: boolean
  last_used_at: string | null
  created_at: string
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showNewKey, setShowNewKey] = useState<string | null>(null)

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/user/api-key')
      const data = await response.json()
      if (data.apiKeys) {
        setApiKeys(data.apiKeys)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const generateNewKey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
      })
      const data = await response.json()

      if (data.apiKey) {
        setShowNewKey(data.apiKey.api_key)
        await fetchApiKeys()
      }
    } catch (error) {
      console.error('Failed to generate API key:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <button
          onClick={generateNewKey}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Generate New Key'}
        </button>
      </div>

      {showNewKey && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">New API Key Generated!</h4>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white border rounded font-mono text-sm text-gray-800">
              {showNewKey}
            </code>
            <button
              onClick={() => copyToClipboard(showNewKey)}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Copy
            </button>
          </div>
          <p className="text-sm text-green-700 mt-2">
            Save this key now - you won't be able to see it again!
          </p>
          <button
            onClick={() => setShowNewKey(null)}
            className="text-sm text-green-600 underline mt-2"
          >
            I've saved it
          </button>
        </div>
      )}

      <div className="space-y-3">
        {apiKeys.map((key) => (
          <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-medium">{key.name}</div>
              <div className="text-sm text-gray-500">
                Created: {new Date(key.created_at).toLocaleDateString()}
                {key.last_used_at && (
                  <span className="ml-4">
                    Last used: {new Date(key.last_used_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-400">
              sk_****{key.api_key.slice(-8)}
            </div>
          </div>
        ))}

        {apiKeys.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No API keys yet. Generate one to get started!
          </div>
        )}
      </div>
    </div>
  )
}