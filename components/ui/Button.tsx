export function Button({ onClick, children, className = "" }: { onClick: () => void, children: React.ReactNode, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
