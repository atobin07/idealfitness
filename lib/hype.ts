// Community-first hype copy for the class cards. No "booking" language —
// members are coming to get a great workout in and be part of the crew.

export const HYPE: string[] = [
  "We're so excited to see you! 🙌",
  "Get strong! 💪",
  "Let's move together",
  "Come get after it",
  "Your crew's waiting 👊",
  "See you on the floor!",
  "Let's get to work 💥",
  "Time to shine ✨",
  "Bring the energy ⚡",
  "Show up, get strong",
  "Count me in! 🙌",
  "Let's gooo! 🚀",
  "Sweat with your people",
  "Good vibes & gains",
  "Be part of it 💙",
  "Come feel amazing",
  "Let's make today count",
  "Stronger together 💪",
  "I'm all in!",
  "Here for it 🔥",
  "Let's earn those endorphins",
  "Show up for you",
  "Come move & smile 😄",
  "Your best hour awaits",
  "Let's build something 💪",
  "Rally the crew 👊",
  "Ready to sweat 💦",
  "Let's have some fun",
  "Come as you are, leave stronger",
  "Make it a great one",
  "Let's chase the good stuff",
  "See you there, friend 💙",
  "Bring a buddy!",
  "Level up today ⬆️",
  "Do the thing 💪",
  "Let's feel alive",
  "Own it today",
  "Community over everything 💙",
  "Let's sweat & connect",
  "Progress starts now",
  "You + the crew = magic ✨",
  "Let's get 1% better",
  "Show the barbell who's boss 😤",
  "Fuel your day here",
  "Come be great",
  "Let's light it up 🔥",
  "Move. Sweat. Belong.",
  "Here we grow 🌱",
  "I'm pumped! 🙌",
  "Let's do this together 💪",
];

// Encouraging line where a "spots left" count used to be.
export const ROOM: string[] = [
  "Room for you 🙌",
  "The more the merrier",
  "Come join the crew",
  "There's a spot with your name on it",
  "We saved you a space 💙",
  "Plenty of good energy left",
  "Grab a buddy and come",
  "Jump in!",
  "The floor's calling 📣",
  "Everyone's welcome here",
];

export const FULL_ROOM = "Packed house! 🔥 Hop on the waitlist";

// Little celebrations once someone's in.
export const YOURE_IN: string[] = [
  "You're in! Can't wait to see you 🙌",
  "You're in! Let's get strong 💪",
  "Locked in — bring the energy ⚡",
  "You're in! The crew just got better 💙",
  "You're in! Time to shine ✨",
  "You're in! Let's move 🔥",
  "You're in! See you on the floor 👊",
  "You're in! Today's gonna be good 😄",
];

export function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
