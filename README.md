# DevMetrics

An engineering productivity dashboard that aggregates GitHub analytics—including commit trends, pull request cycle times, top repositories, and an automated developer productivity score.

---

## Key Features

- **30-Day Commit Analytics:** Daily breakdown of commit activity over the last month.
- **PR Cycle Time Tracking:** Visualizes time to merge (in hours) across recent pull requests.
- **Developer Scoring:** Calculates an automated productivity score based on activity density and merge efficiency.
- **OAuth 2.0 Authentication:** Secure GitHub authentication flow using HTTP-only cookies.
- **Optimized Caching:** Reduces GitHub API rate-limit usage with fast server-side caching.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide Icons, Recharts
- **State & Data Fetching:** `@tanstack/react-query`, Axios
- **Backend:** Node.js, Express
- **Authentication:** GitHub OAuth 2.0

---

## Architecture Flow

```text
[ React Frontend ] ---> ( Redirects to GitHub OAuth )
       |
       v
[ Express Backend ] <--- ( Receives Code & Exchanges for Token )
       |
       +---> [ GitHub REST API ] ( Fetch Repos, Commits, PRs )
       |
       v
[ HTTP-Only Cookie ] ---> ( Secure Session Token sent to Client )
```
