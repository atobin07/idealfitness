// Feed channel keys. Posts live in the gym-wide "feed", the "pets" channel, or
// a per-challenge / per-contest space keyed "challenge:<uuid>" / "contest:<uuid>".
export const CHALLENGE_PREFIX = "challenge:";
export const CONTEST_PREFIX = "contest:";

export function challengeChannel(id: string) {
  return `${CHALLENGE_PREFIX}${id}`;
}

export function contestChannel(id: string) {
  return `${CONTEST_PREFIX}${id}`;
}
