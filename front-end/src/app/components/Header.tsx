// src/app/components/Header.tsx
export default function Header() {
    return (
      <header className="fixed top-0 left-0 w-full bg-white shadow-sm z-50">
        <nav className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo o título */}
          <h1 className="text-xl font-semibold text-blue-600">En Marti Ferrer Fa Esport.App</h1>
  
          {/* Menú de temáticas */}
          <div className="flex gap-6 text-gray-600 text-sm">
            <button className="hover:text-blue-600 transition">Fútbol</button>
            <button className="hover:text-blue-600 transition">Básquet</button>
            <button className="hover:text-blue-600 transition">Montaña</button>
          </div>
  
          {/* Icono usuario */}
          <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition">
            <span className="text-gray-700 font-semibold">N</span>
          </div>
        </nav>
      </header>
    );
  }
  