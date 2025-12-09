export default function ErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="mt-2 text-gray-600">An unexpected error has occurred.</p>
      </div>
    </div>
  );
}
