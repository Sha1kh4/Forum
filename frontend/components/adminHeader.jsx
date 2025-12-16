export default function AdminHeader() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto px-5 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Q&A Forum</h1>
          <p className="text-sm text-gray-600">
            Ask questions, share knowledge
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/admin">
            <button className="bg-gray-700 hover:bg-gray-800 text-white py-2 px-4 rounded-lg transition-colors">
              Admin Panel
            </button>
          </a>
        </div>
      </div>
    </header>
  );
}
