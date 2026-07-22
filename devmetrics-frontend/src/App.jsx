import "./index.css";

function App() {
  const handleLogin = () => {
    // Direct the browser to the backend OAuth route
    window.location.href = "http://localhost:5000/auth/github";
  };

  // Check the URL for the token after the GitHub redirect
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
      <h1 className="text-5xl font-bold mb-2">DevMetrics</h1>
      <p className="text-gray-400 mb-8">Developer Productivity Dashboard</p>

      {token ? (
        <div className="bg-gray-800 p-6 rounded-lg border border-green-500/30 text-center">
          <p className="text-green-400 font-semibold mb-2">
            Authentication Successful!
          </p>
          <p className="text-sm text-gray-400 truncate w-64 mx-auto">
            Token: {token}
          </p>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded-md transition-colors"
        >
          Connect GitHub Account
        </button>
      )}
    </div>
  );
}

export default App;
