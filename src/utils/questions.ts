export interface Option {
  optionId: string;
  optionText: string;
  points: number;
  guruReply: (user: string, crush: string) => string;
}

export interface Question {
  id: number;
  questionText: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 1,
    questionText: "If they post a story with a song, what’s your immediate move?",
    options: [
      { optionId: "a", optionText: "Like it instantly", points: 3, guruReply: (_u, _c) => `Ah, letting them know you're watching! 😉` },
      { optionId: "b", optionText: "Listen to the song first to decode lyrics", points: 5, guruReply: (_u, _c) => `Overanalyzing lines, ${_u}? Classic soulmate behavior with ${_c}. 🕵️‍♂️` },
      { optionId: "c", optionText: "Ignore it but check who else liked it", points: 2, guruReply: (_u, _c) => `Oof ${_u}, keeping tabs on ${_c}'s competition? Dangerous.` },
      { optionId: "d", optionText: "Wait 3 hours so you don't look desperate", points: 4, guruReply: (_u, _c) => `Playing it cool, ${_u}... but your heart is racing for ${_c}, right? 😂` }
    ]
  },
  {
    id: 2,
    questionText: "How long does a typical text conversation last between you two?",
    options: [
      { optionId: "a", optionText: "We text 24/7 non-stop", points: 5, guruReply: (_u, _c) => `Clearly ${_c} is addicted to your notifications, ${_u}!` },
      { optionId: "b", optionText: "Long paragraphs but hours of delay", points: 4, guruReply: (_u, _c) => `Busy, but ${_c} is deeply invested when they do reply.` },
      { optionId: "c", optionText: "Mostly Reels/Memes exchange with dry replies", points: 3, guruReply: (_u, _c) => `Ah, the modern language of 'I'm thinking of you ${_c}, but don't know what to say'.` },
      { optionId: "d", optionText: "Left on delivered, or vice-versa", points: 1, guruReply: (_u, _c) => `Yikes ${_u}... some radio silence here with ${_c}. Let's fix that.` }
    ]
  },
  {
    id: 3,
    questionText: "When your eyes meet in a crowded room, what happens?",
    options: [
      { optionId: "a", optionText: "Quick smile and look away blushing", points: 5, guruReply: (_u, _c) => `That's pure cinematic romance between you and ${_c}! ✨` },
      { optionId: "b", optionText: "Awkward stare contest until someone blinks", points: 3, guruReply: (_u, _c) => `Dominance dynamic or pure confusion with ${_c}? Fascinating.` },
      { optionId: "c", optionText: "Pretend I didn't see them at all", points: 2, guruReply: (_u, _c) => `Smooth, ${_u}... but ${_c} definitely noticed you ignoring them.` },
      { optionId: "d", optionText: "We give each other a casual head nod", points: 4, guruReply: (_u, _c) => `Ah, the elite 'we have a secret understanding' nod with ${_c}.` }
    ]
  },
  {
    id: 4,
    questionText: "Have you guys ever text/called each other past midnight?",
    options: [
      { optionId: "a", optionText: "Yes, that’s when our best conversations happen", points: 5, guruReply: (_u, _c) => `Late night thoughts with ${_c} = real feelings. Huge green flag, ${_u}.` },
      { optionId: "b", optionText: "Only for project help or practical reasons", points: 2, guruReply: (_u, _c) => `Strictly business... or is it an excuse to talk to ${_c}? 👀` },
      { optionId: "c", optionText: "Never, we are strictly daytime chatters", points: 1, guruReply: (_u, _c) => `Keeping it safe and within business hours with ${_c}, I see.` },
      { optionId: "d", optionText: "We send a 'Goodnight' streak snap but that's it", points: 3, guruReply: (_u, _c) => `At least you're the last thing ${_c} sees before sleep.` }
    ]
  },
  {
    id: 5,
    questionText: "What do your mutual friends say about the dynamic between you two?",
    options: [
      { optionId: "a", optionText: "They constantly tease us and say 'just date already'", points: 5, guruReply: (_u, _c) => `Friends always see the sparks first, ${_u}! They want you and ${_c} to date.` },
      { optionId: "b", optionText: "They think we are just normal friends/classmates", points: 3, guruReply: (_u, _c) => `You and ${_c} are hiding it way too well.` },
      { optionId: "c", optionText: "They don't even know we talk", points: 2, guruReply: (_u, _c) => `A secret alliance with ${_c}? Sneaky, I love it.` },
      { optionId: "d", optionText: "They think there's secret tension/drama", points: 4, guruReply: (_u, _c) => `Unresolved tension with ${_c} is the best kind of tension.` }
    ]
  },
  {
    id: 6,
    questionText: "How do they react when you talk closely with someone else?",
    options: [
      { optionId: "a", optionText: "They suddenly get quiet or leave the spot", points: 5, guruReply: (_u, _c) => `Oh, ${_c} cares. They care A LOT, ${_u}. 📈` },
      { optionId: "b", optionText: "They act completely normal and unbothered", points: 2, guruReply: (_u, _c) => `Either a poker face champion or ${_c} is genuinely chill.` },
      { optionId: "c", optionText: "They jump into the conversation to join", points: 4, guruReply: (_u, _c) => `Marking territory! Standard psychological play by ${_c}.` },
      { optionId: "d", optionText: "They playfully tease me about that person", points: 3, guruReply: (_u, _c) => `Teasing is just ${_c}'s masked jealousy, trust me.` }
    ]
  },
  {
    id: 7,
    questionText: "Do they remember the small details you casually mention?",
    options: [
      { optionId: "a", optionText: "Yes! Favorite food, birthdays, and tiny stories", points: 5, guruReply: (_u, _c) => `${_c} listens to you like you're an audio book, ${_u}.` },
      { optionId: "b", optionText: "Sometimes, but I have to remind them", points: 3, guruReply: (_u, _c) => `Selective hearing by ${_c}, standard human behavior.` },
      { optionId: "c", optionText: "Rarely, they forget easily", points: 1, guruReply: (_u, _c) => `Ouch. Time to make yourself unforgettable to ${_c}, ${_u}.` },
      { optionId: "d", optionText: "Only remember things related to college/work", points: 2, guruReply: (_u, _c) => `${_c}'s brain is hardwired to utility. Let's shift that.` }
    ]
  },
  {
    id: 8,
    questionText: "If you walked up to them right now completely sad, what would they do?",
    options: [
      { optionId: "a", optionText: "Match my energy immediately and ask what's wrong", points: 5, guruReply: (_u, _c) => `Pure empathy. ${_c} is deeply connected to you, ${_u}.` },
      { optionId: "b", optionText: "Cracking a joke to make me smile", points: 4, guruReply: (_u, _c) => `The classic 'I hate seeing you sad' mechanism from ${_c}.` },
      { optionId: "c", optionText: "Offer standard polite comfort", points: 3, guruReply: (_u, _c) => `Safe, sweet, but ${_c} is a little guarded.` },
      { optionId: "d", optionText: "Might not notice unless I explicitly say it", points: 1, guruReply: (_u, _c) => `${_c} is a bit oblivious... we need to wake them up.` }
    ]
  },
  {
    id: 9,
    questionText: "When sitting next to each other, what is the vibe?",
    options: [
      { optionId: "a", optionText: "Our shoulders/knees accidentally brush and nobody moves away", points: 5, guruReply: (_u, _c) => `Physical comfort level with ${_c} is off the charts! 🔥` },
      { optionId: "b", optionText: "Clean, respectful distance with plenty of space", points: 3, guruReply: (_u, _c) => `Very formal. Leaving room for the holy spirit between you and ${_c}.` },
      { optionId: "c", optionText: "They lean in closer when I speak", points: 4, guruReply: (_u, _c) => `Subconscious attraction rule #1: ${_c} is leaning in.` },
      { optionId: "d", optionText: "Awkward, rigid posture", points: 2, guruReply: (_u, _c) => `The nervousness is real. ${_c} is terrified of messing up.` }
    ]
  },
  {
    id: 10,
    questionText: "Do you guys share the exact same broken sense of humor?",
    options: [
      { optionId: "a", optionText: "We laugh at things literally no one else understands", points: 5, guruReply: (_u, _c) => `Inside jokes with ${_c} are the foundation of empires.` },
      { optionId: "b", optionText: "We laugh at standard memes but have different tastes", points: 3, guruReply: (_u, _c) => `A healthy overlap with ${_c}. Safe territory.` },
      { optionId: "c", optionText: "Our conversations are mostly serious/formal", points: 1, guruReply: (_u, _c) => `Time to break that ice with ${_c} using some unhinged memes.` },
      { optionId: "d", optionText: "I laugh at their jokes, but they find mine corny", points: 2, guruReply: (_u, _c) => `Hey, corny is cute! Don't let ${_c} tell you otherwise, ${_u}.` }
    ]
  },
  {
    id: 11,
    questionText: "If you text them right now, how fast are they replying?",
    options: [
      { optionId: "a", optionText: "Within 60 seconds", points: 5, guruReply: (_u, _c) => `You are pinned to the top of ${_c}'s chat list, clearly.` },
      { optionId: "b", optionText: "Within 10-30 minutes", points: 4, guruReply: (_u, _c) => `Good pacing by ${_c}. They aren't playing games.` },
      { optionId: "c", optionText: "2 to 4 hours later but with an apology/excuse", points: 3, guruReply: (_u, _c) => `${_c} respects your time enough to explain the delay.` },
      { optionId: "d", optionText: "Next business day", points: 1, guruReply: (_u, _c) => `Are they working a corporate job or what? Unacceptable.` }
    ]
  },
  {
    id: 12,
    questionText: "Have they ever casually included you in their future plans?",
    options: [
      { optionId: "a", optionText: "Yes, saying 'We should visit that cafe next month'", points: 5, guruReply: (_u, _c) => `${_c} is actively building a future timeline with you, ${_u}.` },
      { optionId: "b", optionText: "Never, we only talk about the present", points: 2, guruReply: (_u, _c) => `Living in the moment with ${_c}. Safe, but static.` },
      { optionId: "c", optionText: "Only hypothetical 'What if' jokes", points: 4, guruReply: (_u, _c) => `Testing the waters with ${_c} using jokes. Clever.` },
      { optionId: "d", optionText: "They talk about moving away or individual goals", points: 1, guruReply: (_u, _c) => `Independent spirit. We need to tie ${_u} into ${_c}'s plan.` }
    ]
  }
];
