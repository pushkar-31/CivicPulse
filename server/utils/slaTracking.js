const SLA_HOURS_BY_PRIORITY = Object.freeze({
  high: 24,
  medium: 72,
  low: 24 * 7,
});

export function getSlaDetails(issue, now = new Date()) {
  const priority = SLA_HOURS_BY_PRIORITY[issue.priority] ? issue.priority : "medium";
  const createdAt = new Date(issue.createdAt || now);
  const dueAt = new Date(createdAt.getTime() + SLA_HOURS_BY_PRIORITY[priority] * 60 * 60 * 1000);
  const completed = ["resolved", "rejected"].includes(issue.status);
  const referenceTime = completed
    ? new Date(issue.updatedAt || now)
    : new Date(now);
  const remainingMs = dueAt.getTime() - referenceTime.getTime();
  const breached = !completed && remainingMs < 0;
  const completedWithinSla = completed && referenceTime.getTime() <= dueAt.getTime();

  return {
    slaTargetHours: SLA_HOURS_BY_PRIORITY[priority],
    slaDueAt: dueAt.toISOString(),
    slaStatus: completed
      ? (completedWithinSla ? "met" : "breached")
      : (breached ? "overdue" : "on-track"),
    slaRemainingMs: completed ? 0 : remainingMs,
    slaCompleted: completed,
  };
}

export function addSlaDetails(issue, now = new Date()) {
  return { ...issue, ...getSlaDetails(issue, now) };
}
