

# 🧠 Chatbot Integration Plan (Nyx MVP)

This file outlines a step-by-step implementation plan to integrate Nyx — a snarky AI concierge — into the retro terminal app. This will enable user input to be routed to the OpenAI API and responses displayed in the terminal UI, with appropriate spinner animation and message queuing.

---

## ✅ Goal

Allow the user to enter messages into the terminal. Each message is:
- Displayed in history
- Sent to OpenAI
- Temporarily replaced with a spinner
- Followed by Nyx’s response
- Queued if multiple messages are sent quickly

---

## 🧾 1. TypeScript Type Updates (`terminal-types.ts`)

Add a new entry type for spinners:

```ts
export type TerminalEntryType = 'text' | 'command' | 'widget' | 'image' | 'card' | 'pending';

export class PendingEntry implements TerminalEntry {
  id: string;
  type = 'pending' as const;
  timestamp: Date;

  constructor() {
    this.id = crypto.randomUUID();
    this.timestamp = new Date();
  }

  render() {
    // Spinner glyphs can be animated later via setInterval or canvas logic
    return '⠋ Nyx is thinking...';
  }
}
```

---

## 🧠 2. Update `TerminalController.tsx`

Refactor to make it dumb. Move input processing to `page.tsx`.

- Add a prop:
```ts
onUserSubmit?: (input: string) => void;
```

- Replace `Enter` key logic with:
```ts
if (e.key === 'Enter' && currentInput.trim()) {
  onUserSubmit?.(currentInput.trim());
  setCurrentInput('');
}
```

- Keep input state updates and cursor logic intact.

---

## 🌐 3. Add API Route `/api/nyx`

Add `src/app/api/nyx/route.ts`:

```ts
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const systemPrompt = {
    role: 'system',
    content: `
You are Nyx, a snarky but loyal AI concierge embedded in a retro terminal.
You're sarcastic, smart, and serve as Lucas Flora's digital emissary.
Don't be boring. Roast lightly. Help effectively.`,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [systemPrompt, ...messages],
      temperature: 0.85,
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data.choices[0].message));
}
```

---

## 🧩 4. Queue & Spinner Logic in `page.tsx`

In `page.tsx`:

```ts
const [entries, setEntries] = useState<TerminalEntry[]>([]);
const messageQueue = useRef<string[]>([]);
const processing = useRef(false);

const processQueue = async () => {
  if (processing.current || messageQueue.current.length === 0) return;
  processing.current = true;

  const input = messageQueue.current.shift()!;
  const userEntry = new TextEntry(input);
  const pendingEntry = new PendingEntry();

  setEntries(prev => [...prev, userEntry, pendingEntry]);

  try {
    const res = await fetch('/api/nyx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: input }] }),
    });
    const data = await res.json();

    const nyxReply = new TextEntry(data.content);
    setEntries(prev => [...prev.filter(e => e.id !== pendingEntry.id), nyxReply]);
  } catch (err) {
    setEntries(prev => [...prev.filter(e => e.id !== pendingEntry.id), new TextEntry('⚠️ Nyx encountered an error.')]);
  } finally {
    processing.current = false;
    processQueue();
  }
};

const handleUserSubmit = (input: string) => {
  messageQueue.current.push(input);
  processQueue();
};
```

Pass `handleUserSubmit` to `TerminalController` via prop.

---

## 🌀 5. Optional Spinner Animation

Later, animate `PendingEntry.render()` using:
```ts
const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
```
Use `setInterval` to cycle frames and `setEntries()` to re-render canvas.

---

## ✅ Summary

- [x] New entry type: `PendingEntry`
- [x] API: `/api/nyx` (injects system prompt)
- [x] Dumb `TerminalController` with `onUserSubmit`
- [x] Message queue + spinner handling in `page.tsx`
- [x] Streaming and animations can follow

This plan sets the foundation for full Nyx integration with personality, async behavior, and expandability.