/** Spinner centralizado para estados de carregamento de página */
export function LoadingSpinner({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="text-center">
        <svg
          className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          aria-label="Carregando"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-gray-500 text-sm">{mensagem}</p>
      </div>
    </div>
  );
}
