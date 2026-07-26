// 404 Not Found Page
// Shown automatically by Next.js when a route doesn't exist

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-xl font-semibold">Page Not Found</p>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <a
        href="/home"
        className="mt-6 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition"
      >
        Go to Dashboard
      </a>
    </main>
  )
}
