export type BridgeSession = {
  participantId: string;
  displayName: string;
};

export function sessionKey(roomId: string) {
  return `bridge_v2_${roomId}`;
}

export function loadSession(roomId: string): BridgeSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sessionKey(roomId));
    if (!raw) return null;
    const s = JSON.parse(raw) as BridgeSession;
    if (!s.participantId || !s.displayName) return null;
    return s;
  } catch {
    return null;
  }
}

export function saveSession(roomId: string, session: BridgeSession) {
  localStorage.setItem(sessionKey(roomId), JSON.stringify(session));
}
