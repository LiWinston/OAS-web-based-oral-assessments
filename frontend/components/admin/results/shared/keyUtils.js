export function eqEntityKey(a, b) {
  if (!a || !b) return false;
  return (
    Number(a.assignmentId) === Number(b.assignmentId) &&
    Number(a.sessionId) === Number(b.sessionId) &&
    String(a.kind) === String(b.kind) &&
    Number(a.entityId) === Number(b.entityId)
  );
}

export function keyToId(key) {
  if (!key) return '';
  return `${key.assignmentId}:${key.sessionId}:${key.kind}:${key.entityId}`;
}

