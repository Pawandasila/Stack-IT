"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🚀 Demo Information</CardTitle>
            <p className="text-gray-600">
              This is a Stack Overflow clone with mock data. Here's how to test it:
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">🔐 Authentication</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium text-blue-800 mb-2">Demo Login Credentials:</p>
                <div className="space-y-1">
                  <p className="text-sm"><strong>Email:</strong> test@example.com</p>
                  <p className="text-sm"><strong>Password:</strong> password123</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Use these credentials to test the login functionality. Registration works but uses mock validation.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">✨ Features Available</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Badge variant="secondary">Public Features</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Browse questions without login</li>
                    <li>• View question details</li>
                    <li>• Search and filter questions</li>
                    <li>• Responsive navbar</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <Badge variant="default">Authenticated Features</Badge>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Ask questions</li>
                    <li>• User profile with reputation</li>
                    <li>• Notification icon (mock)</li>
                    <li>• Dashboard access</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">🔄 Mock Data Flow</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ol className="text-sm space-y-2">
                  <li><strong>1.</strong> Homepage shows mock questions for everyone</li>
                  <li><strong>2.</strong> Login with demo credentials stores mock user data</li>
                  <li><strong>3.</strong> Navbar changes to show user avatar and notifications</li>
                  <li><strong>4.</strong> "Ask Question" becomes available</li>
                  <li><strong>5.</strong> User profile shows mock reputation: 1,250 points</li>
                  <li><strong>6.</strong> Logout clears all mock data</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">🛠️ Technical Notes</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• All API calls are mocked with simulated delays</p>
                <p>• Authentication uses localStorage + cookies for middleware</p>
                <p>• Route protection works with mock tokens</p>
                <p>• Toast notifications for user feedback</p>
                <p>• Ready to replace with real API endpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  )
}
