import { IUnlockedReport } from '../models/transaction.model';

export const getTierDetails = (score: number) => {
  const matchPercentage = Math.round((score / 60) * 100);
  
  if (score >= 48) {
    return {
      tier: 'Tier 1' as const,
      tierName: "The Unspoken Soulmates 💖",
      matchPercentage,
      overallDescription: "You both are completely in sync! The chemistry is electric, your text vibes match perfectly, and everyone in your friend circle is silently waiting for you to just make it official already. You have transcended standard friendship dynamics.",
      crushHacks: [
        "The 3-Day Scarcity Loop: Stop texting first for exactly 72 hours. Their subconscious will panic and force them to reach out, locking you as a priority.",
        "The Embedded Suggestion: When talking about a future event, casually say, 'We'll probably look back at this and laugh.' It programs their brain to view you as a permanent fixture in their life.",
        "The Micro-Flirt Contrast: Be incredibly warm and give intense eye-contact face-to-face, but be slightly formal and brief over text. This subtle contrast triggers dopamine-seeking behavior."
      ],
      icebreaker: "Hey, I saw something today that completely reminded me of you..."
    };
  } else if (score >= 30) {
    return {
      tier: 'Tier 2' as const,
      tierName: "The Crossroads / Slow Burn 🔥",
      matchPercentage,
      overallDescription: "You have a solid foundation, but there is hidden hesitation. You guys alternate between intense late-night texting loops and distant standby periods. You are at a crossroads—either break the casual barrier or settle into bestie vibes.",
      crushHacks: [
        "The Shared Secret Trick: Tell them a small, harmless secret about yourself. It triggers psychological intimacy and forces them to reciprocate, breaking the casual barrier.",
        "The Jealousy Pivot: Casually mention a fun plan you have with an unnamed friend of the opposite gender. Observe if their response speed increases or tone gets shorter—it will reveal their true feelings.",
        "The Mutual Dependency Hook: Ask them to help you with a minor decision (like choosing a gift or outfit). People subconsciously value those they invest effort into."
      ],
      icebreaker: "Quick question, I need an urgent opinion on something. Do you think momos with mayonnaise is overrated or underrated? 🥟"
    };
  } else {
    return {
      tier: 'Tier 3' as const,
      tierName: "The Friendzone Danger Zone 🚧",
      matchPercentage,
      overallDescription: "Warning: You are currently sliding into the quicksand of the friendzone or worse—a convenient standby situationship. The investment levels are heavily lopsided right now. It's time to disrupt the routine.",
      crushHacks: [
        "The Identity Shift: Completely change your text response time and stop initiating. Break the pattern of being 'always available' to instantly change their perception of your value.",
        "The Pattern Interrupt: Next time they text you for help or casual venting, be politely busy and suggest meeting up instead. Force the transition from text-buddy to real-world presence.",
        "The Scarcity Shock: Decline one minor invitation or call. Showing you have active alternative priorities triggers the loss-aversion bias in their subconscious, making them value your time."
      ],
      icebreaker: "Random memory check—do you remember that incredibly funny/awkward thing that happened back during lectures? I was just laughing about it. 😂"
    };
  }
};

export const generateReport = (
  self: string,
  crush: string,
  totalScore: number
): IUnlockedReport => {
  const details = getTierDetails(totalScore);
  
  return {
    tierName: details.tierName,
    matchPercentage: details.matchPercentage,
    overallDescription: details.overallDescription
      .replace(/you both/gi, `${self} and ${crush}`)
      .replace(/you guys/gi, `${self} and ${crush}`),
    crushHacks: details.crushHacks,
    icebreaker: details.icebreaker
  };
};
