const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const axios = require("axios");

const app = express();

app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// In-memory cache
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

// ======================
// OAuth Login
// ======================

app.get("/auth/github", (req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&scope=repo,read:user`;

  res.redirect(githubAuthUrl);
});

// ======================
// OAuth Callback
// ======================

app.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const accessToken = tokenResponse.data.access_token;

    res.cookie("github_token", accessToken, {
      httpOnly: true,
      secure: true, // true when deployed with HTTPS
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).send("Authentication Failed");
  }
});

// ======================
// Logout
// ======================

app.post("/logout", (req, res) => {
  res.clearCookie("github_token");
  res.json({
    success: true,
  });
});

// ======================
// Metrics API
// ======================

app.get("/api/metrics", async (req, res) => {
  const token = req.cookies.github_token;

  if (!token) {
    return res.status(401).json({
      error: "Not authenticated",
    });
  }

  const cached = cache.get(token);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log("⚡ Cache Hit");

    return res.json({
      source: "cache",
      data: cached.data,
    });
  }

  const graphqlQuery = {
    query: `
      query {
        viewer {
          login
          name
          avatarUrl

          repositories(
            first: 10
            ownerAffiliations: OWNER
            orderBy: {
              field: STARGAZERS
              direction: DESC
            }
          ) {
            nodes {
              name
              url
              stargazerCount

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

          pullRequests(
            first: 20
            orderBy: {
              field: CREATED_AT
              direction: DESC
            }
          ) {
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
      return res.status(400).json({
        errors: response.data.errors,
      });
    }

    const metrics = response.data.data.viewer;

    cache.set(token, {
      timestamp: Date.now(),
      data: metrics,
    });

    console.log("🌐 GitHub API");

    res.json({
      source: "github_api",
      data: metrics,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "Failed to fetch GitHub metrics",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
