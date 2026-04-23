export function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      <strong className="font-medium">Errore. </strong>
      {message}
    </div>
  );
}
