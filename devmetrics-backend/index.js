const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// In-Memory Caching Layer: { token: { data: ..., timestamp: ... } }
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour (Time-To-Live)

// Step 1: Redirect user to GitHub OAuth
app.get("/auth/github", (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=repo,read:user`;
  res.redirect(githubAuthUrl);
});

// Step 2: Handle OAuth Callback
app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code },
      { headers: { Accept: "application/json" } },
    );

    const accessToken = tokenResponse.data.access_token;
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${accessToken}`,
    );
  } catch (error) {
    console.error("OAuth Exchange Error:", error);
    res.status(500).send("Authentication failed");
  }
});

// Step 3: Phase 2 Metrics Endpoint with Caching & GraphQL
app.get("/api/metrics", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  // --- Caching Check ---
  const cached = cache.get(token);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log("⚡ [Cache Hit] Returning cached metrics data");
    return res.json({ source: "cache", data: cached.data });
  }

  // --- GraphQL Fetch ---
  const graphqlQuery = {
    query: `
      query {
        viewer {
          login
          name
          avatarUrl
          repositories(first: 10, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER) {
            nodes {
              name
              stargazerCount
              url
              primaryLanguage {
                name
              }
            }
          }
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
          pullRequests(first: 20, orderBy: {field: CREATED_AT, direction: DESC}) {
            nodes {
              title
              createdAt
              mergedAt
              state
              repository {
                name
              }
            }
          }
        }
      }
    `,
  };

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      graphqlQuery,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data.errors) {
      return res.status(400).json({ errors: response.data.errors });
    }

    const metricsData = response.data.data.viewer;

    // Save fresh response to cache
    cache.set(token, {
      timestamp: Date.now(),
      data: metricsData,
    });

    console.log("🌐 [Cache Miss] Fetched fresh metrics from GitHub API");
    res.json({ source: "github_api", data: metricsData });
  } catch (error) {
    console.error(
      "GraphQL Request Error:",
      error.response?.data || error.message,
    );
    res
      .status(500)
      .json({ error: "Failed to fetch data from GitHub GraphQL API" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
