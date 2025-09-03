"use client";

export default function AddColumnButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg min-w-[300px] h-20 flex items-center justify-center transition-colors"
    >
      <span className="text-2xl mr-2">+</span>
      <span>Adicionar Coluna</span>
    </button>
  );
}