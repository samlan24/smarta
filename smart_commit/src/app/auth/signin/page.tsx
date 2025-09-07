import { SignInButton } from '../../components/auth/SignInButton'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome to Smart Commit
          </h2>
          <p className="mt-2 text-gray-600">
            Generate perfect commit messages with AI
          </p>
        </div>

        <div className="mt-8">
          <SignInButton />
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Free plan includes 20 requests per month</p>
        </div>
      </div>
    </div>
  )
}