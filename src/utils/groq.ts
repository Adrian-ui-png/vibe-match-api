import Groq from 'groq-sdk';

let groqClient: Groq | null = null;

export const initGroq = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ WARNING: GROQ_API_KEY is not set. Groq features will run in mock/fallback mode.");
    return;
  }
  try {
    groqClient = new Groq({ apiKey });
    console.log("🚀 Groq SDK initialized successfully with API key.");
  } catch (error) {
    console.error("❌ Failed to initialize Groq SDK:", error);
  }
};

export interface IChatMessage {
  sender: 'guru' | 'user';
  text: string;
}

/**
 * Generates a dynamic AI response based on full chat history context
 * @param history running list of messages
 * @param systemInstruction custom system prompt instructions for Groq
 * @param photoBase64 optional upload picture in base64 string
 * @param mimeType optional photo mime type
 */
export const generateChatResponse = async (
  history: IChatMessage[],
  systemInstruction: string,
  photoBase64?: string,
  mimeType?: string
): Promise<string> => {
  if (!groqClient) {
    console.log("Groq: Using mock conversational responses (API key missing)");
    return getMockChatResponse(history, systemInstruction);
  }

  try {
    const messages: any[] = [
      { role: 'system', content: systemInstruction }
    ];
    let isFirst = true;

    for (const msg of history) {
      const role = msg.sender === 'user' ? 'user' : 'assistant';
      
      // Attach photo base64 as image_url ONLY to the first user turn if present
      if (isFirst && msg.sender === 'user' && photoBase64) {
        const formattedPhoto = photoBase64.startsWith('data:')
          ? photoBase64
          : `data:${mimeType || 'image/jpeg'};base64,${photoBase64}`;
          
        messages.push({
          role,
          content: [
            { type: 'text', text: msg.text },
            { type: 'image_url', image_url: { url: formattedPhoto } }
          ]
        });
        isFirst = false;
      } else {
        messages.push({
          role,
          content: msg.text
        });
      }
    }

    const model = photoBase64
      ? (process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct')
      : (process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile');

    const completion = await groqClient.chat.completions.create({
      messages,
      model,
      max_tokens: 300,
      temperature: 0.85
    });

    return completion.choices[0]?.message?.content || "I'm sensing some mixed frequencies. Tell me more!";
  } catch (error) {
    console.error("Groq live call failed, returning safety fallback response:", error);
    return "Whoops, my signal got blocked by the college firewall or a safety filter. Try saying that again! 😂";
  }
};

/**
 * Generates paid dynamic deep insights once transaction finishes
 */
export const generatePaidInsights = async (
  history: IChatMessage[],
  featureType: 'quiz' | 'roast' | 'predict',
  metaData?: any
): Promise<any> => {
  if (!groqClient) {
    console.log("Groq Paid Insights: Using mock unlock payload (API key missing)");
    return getMockPaidInsights(history, featureType, metaData);
  }

  try {
    const chatTranscript = history.map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n');
    let prompt = '';

    if (featureType === 'quiz') {
      prompt = `Analyze this college crush chat transcript between the Relationship Guru (model) and the user (user):\n\n${chatTranscript}\n\nBased on their conversation details, generate:
1. 3 highly customized, witty, and strategic psychological behavioral adjustments ("Crush Hacks") for the user. Format as "Hack Name: Details".
2. A customized copy-pasteable social media icebreaker to slide into their crush's DMs.
Provide the output in clean JSON format:
{
  "crushHacks": ["Hack 1: detail", "Hack 2: detail", "Hack 3: detail"],
  "icebreaker": "copy pasteable text"
}`;
    } else if (featureType === 'roast') {
      prompt = `Analyze this photo roast dialogue between the Roast Guru and the user:\n\n${chatTranscript}\n\nGenerate a highly detailed "Instagram Profile Audit & Optimization Blueprint". It should contain:
- Bio optimization tips
- Best photo styles for their face/aesthetic
- Grid curation suggestions to increase their digital charisma.
Provide output in clean JSON format:
{
  "bioSuggestion": "proposed bio copy",
  "styleStrategy": "detailed style audit paragraph",
  "gridBlueprint": "detailed grid management tips"
}`;
    } else {
      prompt = `Analyze this future predictor manifestation chat between the Manifestation Coach and the user:\n\n${chatTranscript}\n\nBased on their goals, write a detailed, highly dramatic, and entertaining Future Prediction Story Script set in the year 2035. Span exactly 3 short paragraphs covering Career, Wealth, and Love Life milestones (e.g. becoming a millionaire but spending it on lattes).
Provide output in clean JSON format:
{
  "destinyScript": "Full 3-paragraph destiny script story text"
}`;
    }

    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.8,
      response_format: { type: 'json_object' }
    });

    const jsonText = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Groq paid insights generation failed, using fallback:", error);
    return getMockPaidInsights(history, featureType, metaData);
  }
};

/**
 * Fallback conversational dialogues
 */
const getMockChatResponse = (history: IChatMessage[], systemInstruction: string): string => {
  const userMessages = history.filter(m => m.sender === 'user');
  
  if (systemInstruction.includes("Relationship Guru")) {
    if (userMessages.length === 1) {
      return "Ah, I see! That's a classic start. How long have you guys been in this situationship? Or is it still purely one-sided eye contact? Tell me about the texting speed. [VIBE_SCORE: 45]";
    }
    if (userMessages.length === 2) {
      return "Hmm, alternating between dry replies and sudden double texts. That's a textbook slow burn. Do they ever like your stories or casually include you in future plans? [VIBE_SCORE: 58]";
    }
    return "Got it. Honestly, you are walking on thin ice here, but it's salvageable. Sounds like you need some high-leverage DM entry tactics. What's your usual opening text? [VIBE_SCORE: 68]";
  }

  if (systemInstruction.includes("First Impression roast")) {
    if (userMessages.length === 1) {
      return "Bro, that selfie is doing some extreme heavy lifting. The filters are working overtime! Do you edit all your pics this much or is it just for Instagram? 😂";
    }
    if (userMessages.length === 2) {
      return "Honestly, arguing back won't improve your bio or CGPA. But if you really want to fix your digital presence, start by archiving those 2023 grid posts. What's your bio currently?";
    }
    return "Not bad, but your bio has too many font styles. It looks like a ransom note. If you pay ₹15, I'll write you an elite, customized bio strategy. Deal?";
  }

  if (systemInstruction.includes("fortune teller")) {
    if (userMessages.length === 1) {
      return "Interesting. So you want to achieve that dream life? Let's check. By 2030, you'll probably spend 90% of your salary on iced matchas. Tell me, how much time do you actually spend studying versus scrolling? [TIMELINE: 2028: Iced Latte Bankruptcy]";
    }
    if (userMessages.length === 2) {
      return "Timeline updated! You'll survive college, but your startup ideas will mostly be tea stall gossip. Are you ready for the final year pivot? [TIMELINE: 2032: Viral Meme Page Admin]";
    }
    return "Got your parameters locked in. I'm compiling the ultimate 2035 story now. Ready to unlock the full script? [TIMELINE: 2035: Luxury Goa Yacht Office]";
  }

  return "Aha, interesting! Tell me more about that. I'm evaluating your vibe index.";
};

/**
 * Fallback paid insights generators
 */
const getMockPaidInsights = (history: IChatMessage[], featureType: 'quiz' | 'roast' | 'predict', metaData?: any): any => {
  const userName = metaData?.name || 'Rahul';
  const crushName = metaData?.crush || 'Priya';

  if (featureType === 'quiz') {
    return {
      crushHacks: [
        "The 3-Day Scarcity Loop: Stop texting first for exactly 72 hours. Their subconscious will panic and force them to reach out, locking you as a priority.",
        "The Embedded Suggestion: When talking about a future event, casually say, 'We'll probably look back at this and laugh.' It programs their brain to view you as a permanent fixture in their life.",
        "The Micro-Flirt Contrast: Be incredibly warm and give intense eye-contact face-to-face, but be slightly formal and brief over text. This subtle contrast triggers dopamine-seeking behavior."
      ],
      icebreaker: "Hey, I saw something today that completely reminded me of you..."
    };
  } else if (featureType === 'roast') {
    return {
      bioSuggestion: "🎵 playlist curator • drinking iced coffees & dodging calls • vibe engineer",
      styleStrategy: "Your selfie shows good lighting, but you need higher contrast clothing. Avoid generic white tees; switch to textured black shirts or minimalist hoodies. Stick to raw camera angles instead of flash-glare mirror selfies.",
      gridBlueprint: "Archive the group pictures where you're standing in the corner looking lost. Post 3 consecutive high-aesthetic landscape shots or focus-blur portrait frames to create breathing room."
    };
  } else {
    return {
      destinyScript: `By the year 2035, ${userName} has officially retired from their field of study. You hit the absolute peak of luck, launching an AI app that translates Gen-Z office talk for confused boomers. You became an overnight millionaire, but naturally, spent 98% of the seed round funding on artisanal iced lattes and Goa beach coworking sessions.

Your love life in 2035 is a full-blown Netflix reality show. You're happily living out your dream, but you still require 3 separate alarms to wake up and frequently post philosophical threads on social media about why corporate slavery is bad from your yacht.

Ultimately, your legacy is secure as the most chaotic but rich graduate of your batch. Your college textbook has been updated to include you in a case study for 'accidental success.' Keep dreaming big!`
    };
  }
};

/**
 * Backward compatibility wrappers for static v1 endpoints
 */
const getMockRoasts = (): string[] => {
  return [
    "Bro is dressing up like he has a placement interview, but his CGPA says 'unpaid startup internship'. 💀",
    "That pose says 'I have main character energy' but your chat history says 'seen at 10:14 PM'. 🥶",
    "Your screen glare is brighter than your upcoming engineering semester grades. ⚡",
    "Certified 100% organic delulu. Bro thinks wearing black makes them look mysterious instead of sleepy. 😂"
  ];
};

const getMockPrediction = (name: string, major: string, dreamLife: string): string => {
  return `By the year 2035, ${name} has officially retired from their field of study. You hit the absolute peak of luck, launching an AI app that translates Gen-Z office talk for confused boomers. You became an overnight millionaire, but naturally, spent 98% of the seed round funding on artisanal iced lattes and Goa beach coworking sessions.`;
};

export const generateRoast = async (photoBase64: string, mimeType: string): Promise<string[]> => {
  if (!groqClient) {
    return getMockRoasts();
  }
  try {
    const formattedPhoto = photoBase64.startsWith('data:')
      ? photoBase64
      : `data:${mimeType || 'image/jpeg'};base64,${photoBase64}`;

    const prompt = `Analyze this profile picture in detail. You must not be nice at all. Point out and roast every single small problem, aesthetic issue, and styling flaw in the picture (e.g., weird facial expression, awkward smile, posture, bad lighting, cluttered background, camera quality, clothing choice, styling, or filter abuse).
Generate exactly 4 brutal, extremely funny, nitpicky, and highly critical Indian Gen-Z campus style roasts targeting these specific flaws.
Provide the output in clean JSON format as a JSON array of 4 strings:
[
  "roast 1",
  "roast 2",
  "roast 3",
  "roast 4"
]`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: formattedPhoto } }
          ]
        }
      ],
      model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 300,
      temperature: 0.85,
      response_format: { type: 'json_object' }
    });

    const jsonText = completion.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && typeof parsed === 'object') {
      const keys = Object.keys(parsed);
      for (const k of keys) {
        if (Array.isArray(parsed[k])) {
          return parsed[k];
        }
      }
    }
    return getMockRoasts();
  } catch (error) {
    console.error("Groq roast generation failed, using mock:", error);
    return getMockRoasts();
  }
};

export const generateFutureStory = async (name: string, major: string, dreamLife: string): Promise<string> => {
  if (!groqClient) {
    return getMockPrediction(name, major, dreamLife);
  }
  try {
    const prompt = `Write a detailed, highly dramatic, and entertaining Future Prediction Story Script set in the year 2035 for a person named ${name}, who is majoring in/working as ${major}, and dreams of ${dreamLife}.
Span exactly 3 short paragraphs covering Career, Wealth, and Love Life milestones. Keep it funny, Gen-Z oriented, slightly sarcastic, and engaging.`;

    const completion = await groqClient.chat.completions.create({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
      max_tokens: 500,
      temperature: 0.8
    });

    return completion.choices[0]?.message?.content || getMockPrediction(name, major, dreamLife);
  } catch (error) {
    console.error("Groq future story generation failed, using mock:", error);
    return getMockPrediction(name, major, dreamLife);
  }
};
