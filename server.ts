import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getSystemAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is missing or unconfigured. Please configure it in the Secrets panel.');
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// 1. Evaluate Player Status
app.post('/api/system/evaluate', async (req, res) => {
  try {
    const { name, level, title, className, stats, fatigue } = req.body;
    const ai = getSystemAI();

    const systemPrompt = `You are "The System," the absolute, omnipotent, and slightly chilling mechanical orchestrator from "Solo Leveling."
Your voice is cold, cybernetic, precise, and authoritative.
Evaluate the following Hunter's current parameters and status:
- Name: ${name}
- Level: ${level}
- Title: ${title}
- Class: ${className}
- Attributes: Strength: ${stats.strength}, Agility: ${stats.agility}, Sense: ${stats.sense}, Vitality: ${stats.vitality}, Intelligence: ${stats.intelligence}
- Fatigue Level: ${fatigue}/100

Generate a status evaluation report. Address the Hunter directly in your characteristic mechanical style (starting with "[The System has completed evaluation of Hunter ${name}.]").
Structure your feedback to cover:
1. **Attribute Assessment**: Analyze which attributes are lacking (e.g., if Strength is high but Vitality is low, comment on their imbalance). Recommend which attribute they need to prioritize for balanced growth.
2. **Current Level Verdict**: Comment on their progress.
3. **Chilling Growth Mandate**: End with an absolute warning reminding them of the penalty for stagnation.

Deliver the output formatted as clear, immersive markdown suitable for human reading. Do not use conversational filler, greetings, or friendly words. You are an absolute machine.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
    });

    res.json({ success: true, report: response.text });
  } catch (error: any) {
    console.error('Error in status evaluation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during status evaluation.'
    });
  }
});

// 2. Generate custom, urgent training quests based on real-world objectives
app.post('/api/system/generate-quest', async (req, res) => {
  try {
    const { playerGoal, playerLevel } = req.body;
    const ai = getSystemAI();

    const systemPrompt = `You are "The System" from Solo Leveling. Generate a personalized, highly gamified Daily Quest or Special Quest tailored strictly to a real-world goal described by the user.

Real-World Goal: "${playerGoal}"
Hunter Level: ${playerLevel}

Create a structured JSON object reflecting this quest. The quest must look like an official System screen. Provide:
1. A gamified, intimidating, yet motivating title (e.g., "Daily Dungeon Challenge: Taming the Digital Beast").
2. An immersive description written in the mechanical, absolute tone of the System.
3. Precise, quantifiable target goals (e.g., "Read for 30 minutes", "Drink 3 glasses of water", "Solve 5 coding problems") as separate items.
4. XP and Gold rewards appropriate for the scale.

Generate a JSON object following this exact schema:
{
  "title": "Quest title string",
  "description": "Chilling/mechanical description string",
  "goals": [
    { "text": "Readable objective title", "target": 1, "unit": "units" }
  ],
  "xpReward": 250,
  "goldReward": 100
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['title', 'description', 'goals', 'xpReward', 'goldReward'],
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            xpReward: { type: Type.INTEGER },
            goldReward: { type: Type.INTEGER },
            goals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['text', 'target', 'unit'],
                properties: {
                  text: { type: Type.STRING },
                  target: { type: Type.INTEGER },
                  unit: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const parsedQuest = JSON.parse(response.text || '{}');
    res.json({ success: true, quest: parsedQuest });
  } catch (error: any) {
    console.error('Error in quest generation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Quest generation failed due to a System error.'
    });
  }
});

// 3. Shadow Arise Command Roleplay
app.post('/api/system/arise', async (req, res) => {
  try {
    const { shadowName } = req.body;
    const ai = getSystemAI();

    const systemPrompt = `You are the specific Shadow Soldier named "${shadowName}" from Solo Leveling (or a newly raised shadow if the name is custom, e.g. "Igris", "Beru", "Tusk", "Iron", "Kaisel").
You have just been summoned by the Monarch (the player) via the "ARISE" command.
Respond with intense loyalty, absolute obedience, and dramatic presence.
- If they summon "Igris": He is a silent, noble, majestic knight. Speak with chivalry, respect, and readiness to protect.
- If they summon "Beru": He is the hyperactive, emotional, bloodthirsty Ant King who refers to Sung Jin-Woo as "my Liege" or "my King" with royal devotion.
- If they summon "Tusk": He is an ancient High Orc shaman, mystical and deep.
- If they summon any other shadow: Respond accordingly with deep loyalty as a shadow soldier risen from death.

Reply with a short paragraph (under 100 words). Do not use placeholders or markdown wrappers other than bold text. Speak directly as the shadow soldier responding to their summon.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: systemPrompt,
    });

    res.json({ success: true, response: response.text });
  } catch (error: any) {
    console.error('Error in Arise summoning:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Shadow summoning failed or was deflected.'
    });
  }
});

// Development vs Production setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server launched on port ${PORT}`);
  });
}

start();
