export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-100">500 - Internal Server Error</h1>
        <p className="text-gray-400 mt-2">An unexpected error occurred.</p>
      </div>
    </div>
  );
}
