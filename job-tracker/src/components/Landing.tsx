import { Link } from '@tanstack/react-router'
import { useAuth } from '../context/AuthProvider'
import { Briefcase, ListChecks, FileText } from 'lucide-react'

export function Landing() {
  const { isEnabled } = useAuth()

  return (
    <main className="min-h-[60vh] flex items-center justify-center bg-gray-50">
      <div className="max-w-3xl p-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Organize your job search. All in one place.
        </h1>
        <p className="mt-3 text-gray-600">
          Track applications, generate AI-powered resumes and cover letters, and prep smarter for interviews.
        </p>

        <div className="mt-6 flex gap-3 justify-center">
          <Link
            to={isEnabled ? '/login' : '/jobs'}
            className="inline-flex items-center rounded-lg border px-4 py-2 hover:bg-neutral-50"
          >
            {isEnabled ? 'Sign in to get started' : 'Try the demo'}
          </Link>

          <Link
            to="/discover"
            className="inline-flex items-center rounded-lg px-4 py-2 underline"
          >
            Discover opportunities
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <Feature
            icon={Briefcase}
            title="Add & edit jobs"
            desc="Quickly log new applications and keep details up to date."
          />
          <Feature
            icon={ListChecks}
            title="Track your stages"
            desc="From applied to offer — see everything at a glance."
          />
          <Feature
            icon={FileText}
            title="Prep smarter"
            desc="Attach interview notes and resources to each application."
          />
        </div>

        <p className="mt-10 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to={isEnabled ? '/login' : '/jobs'} className="underline text-blue-600">
            {isEnabled ? 'Sign in' : 'Open demo'}
          </Link>
        </p>
      </div>
    </main>
  )
}

function Feature({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ElementType
  title: string
  desc: string
}) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  )
}
