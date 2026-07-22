import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { processMetrics } from "./utils/metrics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  GitCommit,
  GitPullRequest,
  Clock,
  Award,
  Star,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Data Fetcher
const fetchMetrics = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/api/metrics`, {
      withCredentials: true,
    });

    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    throw err;
  }
};

function App() {
  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/github`;
  };

  const logout = async () => {
    await axios.post(
      `${API_URL}/logout`,
      {},
      {
        withCredentials: true,
      },
    );

    window.location.reload();
  };

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["metrics"],
    queryFn: fetchMetrics,
    retry: false,
  });

  if (error?.message === "UNAUTHORIZED") {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-5xl font-extrabold tracking-tight bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            DevMetrics
          </h1>
          <p className="text-slate-400 text-lg">
            Engineering productivity dashboard with commit analytics, PR cycle
            times, and automated scoring.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-white text-slate-950 hover:bg-slate-200 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Connect GitHub Account
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 font-medium">Fetching GitHub Metrics...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <p className="text-red-400 mb-4 font-semibold">
          Failed to load metrics from server.
        </p>
        <button
          onClick={handleLogin}
          className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm"
        >
          Re-authenticate with GitHub
        </button>
      </div>
    );
  }

  const metrics = processMetrics(data?.data);
  const isCached = data?.source === "cache";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <img
              src={metrics.avatarUrl}
              alt={metrics.login}
              className="w-14 h-14 rounded-full border-2 border-blue-500"
            />

            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {metrics.login}

                <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-normal border border-slate-700">
                  {isCached ? "⚡ Cached Data" : "🌐 Live GitHub API"}
                </span>
              </h1>

              <p className="text-slate-400 text-sm">
                Developer Productivity Overview
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 border border-slate-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw
                className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh Data
            </button>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Productivity Score</span>
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.productivityScore}
              <span className="text-lg text-slate-500">/100</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">30-Day Commits</span>
              <GitCommit className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.total30DayCommits}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Merged PRs</span>
              <GitPullRequest className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.mergedPRsCount}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-sm font-medium">Avg PR Cycle Time</span>
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {metrics.avgCycleTime}
              <span className="text-lg text-slate-500"> hrs</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commit Heatmap Bar Chart */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-blue-400" />
              30-Day Commit Activity
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="commits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PR Cycle Time Chart */}
          <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              PR Cycle Time (Hours to Merge)
            </h2>
            {metrics.cycleTimeData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.cycleTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="title"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="hours" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No recent merged pull requests found.
              </div>
            )}
          </div>
        </div>

        {/* Top Repositories List */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-xl space-y-4">
          <h2 className="text-lg font-semibold">Most Active Repositories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.topRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-4 rounded-lg bg-slate-950/50 hover:bg-slate-800/50 border border-slate-800 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-blue-400 group-hover:underline flex items-center gap-1.5">
                    {repo.name}
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{repo.language}</p>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                  <Star className="w-4 h-4 fill-amber-400" />
                  {repo.stars}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
