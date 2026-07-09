'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="p-8 bg-red-100 text-red-900 rounded-xl m-8">
      <h2 className="text-2xl font-black mb-4">React Error Boundary Caught An Exception!</h2>
      <p className="font-bold">{error.message}</p>
      <pre className="mt-4 whitespace-pre-wrap text-sm opacity-80">{error.stack}</pre>
      <button
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        onClick={() => reset()}
      >
        Thử lại
      </button>
    </div>
  )
}
