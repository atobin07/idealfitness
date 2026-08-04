// Feed channel keys. Posts live in the gym-wide "feed", the "pets" channel, or
// a per-challenge space keyed "challenge:<uuid>".
export const CHALLENGE_PREFIX = "challenge:";

export function challengeChannel(id: string) {
  return `${CHALLENGE_PREFIX}${id}`;
}
