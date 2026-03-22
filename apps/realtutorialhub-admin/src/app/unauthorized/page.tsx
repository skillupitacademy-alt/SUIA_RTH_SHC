export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Unauthorized</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Your session is valid, but it does not include the admin role required for this area.
        </p>
      </div>
    </main>
  );
}
