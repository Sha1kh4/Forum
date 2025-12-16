"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
export default function AdminPanel() {

    
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Admin dashboard state
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [stats, setStats] = useState({ totalQuestions: 0, totalAnswers: 0 });

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if already logged in
  useEffect(() => {
    const storedToken = localStorage.getItem("admin_token");
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      loadDashboardData(storedToken);
    }
  }, []);

  const loadDashboardData = async (authToken) => {
    try {
      // Fetch questions
      const questionsRes = await fetch(`${API_BASE_URL}/questions`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const questionsData = await questionsRes.json();
      setQuestions(questionsData);

      // Fetch answers for each question
      const answersData = {};
      let totalAnswers = 0;
      for (const question of questionsData) {
        const ansRes = await fetch(
          `${API_BASE_URL}/answers/${question.questionid}`,
          {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        );
        const ans = await ansRes.json();
        answersData[question.questionid] = ans;
        totalAnswers += ans.length;
      }
      setAnswers(answersData);
      setStats({ totalQuestions: questionsData.length, totalAnswers });
    } catch (err) {
      console.error("Error loading dashboard:", err);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const formBody = new URLSearchParams();
      formBody.append("username", loginForm.username);
      formBody.append("password", loginForm.password);

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token
      localStorage.setItem("admin_token", data.access_token);
      setToken(data.access_token);
      setIsAuthenticated(true);
      loadDashboardData(data.access_token);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setToken(null);
    setIsAuthenticated(false);
    setQuestions([]);
    setAnswers({});
  };
  const sortedQuestions = questions
    ? [
        ...questions
          .filter((q) => q.Status === 'Escalated')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), // "Escalated" first, sorted by created_at
        ...questions
          .filter((q) => q.Status !== 'Escalated')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), // Then the rest sorted by created_at
      ]
    : [];

  const changeQuestionStatus = async (questionId, newStatus) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/change-status?questionid=${questionId}&new_status=${newStatus}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setQuestions(questions.filter((q) => q.questionid !== questionId));
        alert("Question status changed successfully");
      } else {
        alert("Failed to change question status");
      }
    } catch (err) {
      console.error("Error changing question status:", err);
      alert("Error changing question status");
    }
  };

  const deleteAnswer = async (answerId, questionId) => {
    if (!confirm("Are you sure you want to delete this answer?")) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/answer?answerid=${answerId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        setAnswers((prev) => ({
          ...prev,
          [questionId]: prev[questionId].filter((a) => a.answerid !== answerId),
        }));
        alert("Answer deleted successfully");
      } else {
        alert("Failed to delete answer");
      }
    } catch (err) {
      console.error("Error deleting answer:", err);
      alert("Error deleting answer");
    }
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
            <div className="text-center mb-8">
              <div className="bg-yellow-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Admin Panel
              </h1>
              <p className="text-gray-400">Sign in to manage content</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-900 border border-red-700 text-red-200 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-yellow-700 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>

            <div className="mt-6 text-center">
              <a
                href="/questions"
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Q&A Forum
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-30">
        <div className="container mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">
              Manage questions and answers
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/">
              <button className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors">
                View Forum
              </button>
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalQuestions}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm">Total Answers</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalAnswers}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Questions</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sortedQuestions.map((question) => (
              <div key={question.questionid} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {question.message}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {question.Status} •{" "}
                      {new Date(question.created_at).toLocaleString()}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger>Change Status</DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        {" "}
                        <button
                          onClick={() =>
                            changeQuestionStatus(
                              question.questionid,
                              "Escalated"
                            )
                          }
                          className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg transition-colors"
                        >
                          Escalated
                        </button>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <button
                          onClick={() =>
                            changeQuestionStatus(question.questionid, "Pending")
                          }
                          className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg transition-colors"
                        >
                          Pending
                        </button>{" "}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {" "}
                        <button
                          onClick={() =>
                            changeQuestionStatus(
                              question.questionid,
                              "Answered"
                            )
                          }
                          className="ml-4 bg-red-100 hover:bg-red-200 text-red-700 py-2 px-4 rounded-lg transition-colors"
                        >
                          Answered
                        </button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {answers[question.questionid] &&
                  answers[question.questionid].length > 0 && (
                    <div className="mt-4 ml-4 space-y-2">
                      <p className="font-semibold text-gray-700 text-sm">
                        Answers ({answers[question.questionid].length}):
                      </p>
                      {answers[question.questionid].map((answer) => (
                        <div
                          key={answer.answerid}
                          className="bg-gray-50 p-3 rounded-lg flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <p className="text-gray-800">{answer.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(answer.created_at).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              deleteAnswer(answer.answerid, question.questionid)
                            }
                            className="ml-4 text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
