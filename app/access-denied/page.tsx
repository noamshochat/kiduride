export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-3xl font-bold text-primary mb-4">Access Denied</h1>
        <p className="text-lg text-muted-foreground mb-2">
          This service is only available in Israel.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  )
}

