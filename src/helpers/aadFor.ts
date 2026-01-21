export function aadFor(teamId: number, field: "slack" | "github") {
  return `team:${teamId}:secret:${field}`;
}
