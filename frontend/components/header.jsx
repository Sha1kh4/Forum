export default function Header() {
  return (
    <header className="text-yellow-600 body-font bg-black">
      <div className="container mx-auto flex flex-wrap p-5 flex-col md:flex-row items-center justify-end">
        <a href="/login">
          <button className="inline-flex items-center bg-yellow-100 border-0 py-1 px-3 focus:outline-none hover:bg-gray-200 rounded text-base mt-4 md:mt-0">
            Login
            <svg
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-4 h-4 ml-1"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5l7 7-7 7"></path>
            </svg>
          </button>
        </a>
      </div>
    </header>
  );
}
