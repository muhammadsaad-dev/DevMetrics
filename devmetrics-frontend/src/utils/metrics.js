export function processMetrics(rawData) {
  if (!rawData) return null;

  const {
    login,
    avatarUrl,
    repositories,
    contributionsCollection,
    pullRequests,
  } = rawData;

  // 1. Process 30-Day Commit Heatmap Data
  const weeks = contributionsCollection?.contributionCalendar?.weeks || [];
  const allDays = weeks.flatMap((w) => w.contributionDays);
  const last30Days = allDays.slice(-30).map((day) => ({
    date: day.date.slice(5), // Short date "MM-DD"
    commits: day.contributionCount,
  }));

  const total30DayCommits = last30Days.reduce((acc, d) => acc + d.commits, 0);

  // 2. Process PR Cycle Times (hours between createdAt and mergedAt)
  const prNodes = pullRequests?.nodes || [];
  const mergedPRs = prNodes.filter((pr) => pr.mergedAt);

  let totalCycleHours = 0;
  const cycleTimeData = mergedPRs.map((pr) => {
    const created = new Date(pr.createdAt);
    const merged = new Date(pr.mergedAt);
    const hours = Math.max(0.1, (merged - created) / (1000 * 60 * 60));
    totalCycleHours += hours;

    return {
      title:
        pr.title.length > 18 ? pr.title.substring(0, 18) + "..." : pr.title,
      hours: parseFloat(hours.toFixed(1)),
      repo: pr.repository?.name || "Repo",
    };
  });

  const avgCycleTime =
    mergedPRs.length > 0 ? (totalCycleHours / mergedPRs.length).toFixed(1) : 0;

  // 3. Compute Productivity Score (0 to 100 scale)
  // Formula: (Commits * 1.5) + (Merged PRs * 10)
  const rawScore = Math.round(total30DayCommits * 1.5 + mergedPRs.length * 10);
  const productivityScore = Math.min(100, Math.max(10, rawScore));

  // 4. Top Repositories
  const topRepos = (repositories?.nodes || []).map((r) => ({
    name: r.name,
    stars: r.stargazerCount,
    language: r.primaryLanguage?.name || "Code",
    url: r.url,
  }));

  return {
    login,
    avatarUrl,
    total30DayCommits,
    last30Days,
    mergedPRsCount: mergedPRs.length,
    avgCycleTime,
    cycleTimeData,
    productivityScore,
    topRepos,
  };
}
