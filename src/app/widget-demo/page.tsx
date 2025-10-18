'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Code, 
  Copy, 
  Eye, 
  ExternalLink,
  Check,
  Palette,
  Settings
} from 'lucide-react'

export default function WidgetDemoPage() {
  const [companyId, setCompanyId] = useState('1')
  const [limit, setLimit] = useState(5)
  const [theme, setTheme] = useState('light')
  const [showPoweredBy, setShowPoweredBy] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  const generateEmbedCode = () => {
    const params = new URLSearchParams({
      company_id: companyId,
      limit: limit.toString(),
      theme,
      show_powered_by: showPoweredBy.toString(),
    })

    return `<!-- Rezzy Job Widget -->
<div id="rezzy-job-widget-${companyId}" 
     data-rezzy-widget 
     data-company-id="${companyId}" 
     data-limit="${limit}" 
     data-theme="${theme}"
     data-show-powered-by="${showPoweredBy}">
</div>

<!-- Include the widget script -->
<script src="https://rezzybyrlm.com/widget/rezzy-widget.js"></script>`
  }

  const generateIframeCode = () => {
    const params = new URLSearchParams({
      company_id: companyId,
      limit: limit.toString(),
      format: 'html',
    })

    return `<iframe 
  src="https://rezzybyrlm.com/api/widget?${params.toString()}" 
  width="400" 
  height="600" 
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 8px;">
</iframe>`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Widget Demo</h1>
          <p className="text-gray-600">Embed your company's job listings on your website</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Widget Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company ID
                  </label>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="Enter company ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Jobs to Show
                  </label>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={3}>3 jobs</option>
                    <option value={5}>5 jobs</option>
                    <option value={10}>10 jobs</option>
                    <option value={15}>15 jobs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme
                  </label>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('light')}
                    >
                      <Palette className="h-4 w-4 mr-1" />
                      Light
                    </Button>
                    <Button
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme('dark')}
                    >
                      <Palette className="h-4 w-4 mr-1" />
                      Dark
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-powered-by"
                    checked={showPoweredBy}
                    onChange={(e) => setShowPoweredBy(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="show-powered-by" className="text-sm text-gray-700">
                    Show "Powered by Rezzy" footer
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Embed Code (JavaScript)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{generateEmbedCode()}</code>
                    </pre>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(generateEmbedCode())}
                    className="w-full"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Iframe Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Iframe Embed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
                      <code>{generateIframeCode()}</code>
                    </pre>
                  </div>
                  <Button
                    onClick={() => copyToClipboard(generateIframeCode())}
                    variant="outline"
                    className="w-full"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Iframe Code
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Badge variant="outline">Theme: {theme}</Badge>
                    <Badge variant="outline">Limit: {limit}</Badge>
                    <Badge variant="outline">Powered by: {showPoweredBy ? 'Yes' : 'No'}</Badge>
                  </div>
                  
                  {/* Widget Preview */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center text-gray-500 mb-4">
                      Widget preview will appear here
                    </div>
                    <div 
                      id="widget-preview"
                      className="min-h-[400px] bg-white rounded-lg border"
                      style={{ 
                        background: theme === 'dark' ? '#1f2937' : '#fff',
                        color: theme === 'dark' ? '#f9fafb' : '#111827'
                      }}
                    >
                      {/* This would be populated by the actual widget */}
                      <div className="p-4 text-center">
                        <div className="text-lg font-semibold mb-2">Jobs at TechCorp Inc.</div>
                        <div className="text-sm opacity-75 mb-4">5 open positions</div>
                        <div className="space-y-3">
                          <div className="p-3 border rounded">
                            <div className="font-medium text-primary">Senior Software Engineer</div>
                            <div className="text-sm opacity-75">📍 San Francisco, CA • Full-time</div>
                          </div>
                          <div className="p-3 border rounded">
                            <div className="font-medium text-primary">Product Manager</div>
                            <div className="text-sm opacity-75">📍 Remote • Full-time</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Widget Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Responsive Design</p>
                    <p className="text-xs text-gray-600">Automatically adapts to different screen sizes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Real-time Updates</p>
                    <p className="text-xs text-gray-600">Jobs update automatically when you post new ones</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Customizable Themes</p>
                    <p className="text-xs text-gray-600">Light and dark themes to match your site</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">Easy Integration</p>
                    <p className="text-xs text-gray-600">Simple copy-paste code for any website</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-sm">SEO Friendly</p>
                    <p className="text-xs text-gray-600">Search engines can index your job listings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documentation */}
            <Card>
              <CardHeader>
                <CardTitle>Documentation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Getting Started</p>
                  <p>1. Get your Company ID from your employer dashboard</p>
                  <p>2. Copy the embed code above</p>
                  <p>3. Paste it into your website's HTML</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">API Endpoint</p>
                  <p>Direct API access: <code className="bg-gray-100 px-1 rounded">/api/widget?company_id=YOUR_ID</code></p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Support</p>
                  <p>Need help? Contact us at <a href="mailto:support@rezzybyrlm.com" className="text-primary">support@rezzybyrlm.com</a></p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
