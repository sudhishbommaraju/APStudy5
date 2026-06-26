// LLM proxy. Replaces base44.integrations.Core.InvokeLLM.
// Supports OpenAI and Anthropic — whichever key is present in the environment.
// Falls back to a clearly-labelled mock when no key is configured, so the UI
// stays fully navigable in "demo" mode.

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Decide which provider to use. Explicit LLM_PROVIDER wins; otherwise pick by
// whichever key is set (OpenAI first).
function getProvider() {
  const explicit = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (explicit === 'openai' || explicit === 'anthropic') return explicit;
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  return 'none';
}

function getModel(provider) {
  if (process.env.LLM_MODEL) return process.env.LLM_MODEL;
  return provider === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-4-6';
}

export function hasKey() {
  return getProvider() !== 'none';
}

const SYSTEM =
  'You are Proofly, an expert AP tutor and study-material generator. ' +
  'Be accurate, rigorous, and aligned to the official College Board AP curriculum. ' +
  'Render ALL mathematical, scientific, and chemical notation in LaTeX using dollar ' +
  'delimiters: inline math wrapped in $ ... $ and display math in $$ ... $$. ' +
  'Never use unicode math symbols (e.g. ×, ², √, π, ≤) when LaTeX is ' +
  'appropriate — write $\\times$, $x^2$, $\\sqrt{x}$, $\\pi$, $\\leq$ instead.';

function schemaInstruction(schema) {
  if (!schema) return '';
  return (
    '\n\nYou MUST respond with ONLY a single valid JSON value that conforms to this JSON schema. ' +
    'Do not include markdown code fences, commentary, or any text before or after the JSON.\n' +
    'CRITICAL: Any LaTeX inside JSON string values must escape every backslash as a double ' +
    'backslash. Write "\\\\frac", "\\\\text", "\\\\times", "\\\\sqrt", "\\\\theta" — never a ' +
    'single backslash, which would corrupt the JSON.\n' +
    'JSON schema:\n' +
    JSON.stringify(schema)
  );
}

// Safety net: when a model emits single-backslash LaTeX inside a JSON string,
// JSON.parse turns \t \f \b \v into control characters (corrupting \text,
// \frac, \binom, \vec, etc.). Convert those control chars back to the intended
// LaTeX command prefix. Real newlines (\n) are intentionally left untouched.
function repairLatex(val) {
  if (typeof val === 'string') {
    return val
      .replace(/	/g, '\\t') // TAB -> \text \times \tan \theta \to
      .replace(//g, '\\f') // FF  -> \frac \forall
      .replace(//g, '\\b') // BS  -> \binom \beta \bar
      .replace(//g, '\\v'); // VT -> \vec \vee \varphi
  }
  if (Array.isArray(val)) return val.map(repairLatex);
  if (val && typeof val === 'object') {
    const o = {};
    for (const k of Object.keys(val)) o[k] = repairLatex(val[k]);
    return o;
  }
  return val;
}

// Extract a JSON value from a model response that may include stray text/fences.
function extractJson(text) {
  if (!text) return null;
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.search(/[\{\[]/);
    if (start === -1) return null;
    const open = t[start];
    const close = open === '{' ? '}' : ']';
    let depth = 0;
    for (let i = start; i < t.length; i++) {
      if (t[i] === open) depth++;
      else if (t[i] === close) {
        depth--;
        if (depth === 0) {
          try {
            return JSON.parse(t.slice(start, i + 1));
          } catch {
            return null;
          }
        }
      }
    }
    return null;
  }
}

function mockResponse({ prompt, response_json_schema }) {
  const note =
    'DEMO MODE — no API key configured. Add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env for real AI output.';
  if (!response_json_schema) {
    return `# ${note}\n\nYour prompt was:\n\n> ${String(prompt).slice(0, 280)}\n\nReal generation (notes, flashcards, practice) activates the moment a valid API key is present.`;
  }
  const props = response_json_schema.properties || {};
  const out = {};
  for (const [key, def] of Object.entries(props)) {
    const type = def.type;
    if (type === 'array') out[key] = [];
    else if (type === 'number' || type === 'integer') out[key] = 0;
    else if (type === 'boolean') out[key] = false;
    else if (type === 'object') out[key] = {};
    else out[key] = note;
  }
  return out;
}

async function callOpenAI({ userContent, model, temperature, jsonMode }) {
  const body = {
    model,
    temperature: typeof temperature === 'number' ? temperature : 0.4,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userContent },
    ],
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const resp = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${t.slice(0, 500)}`);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callAnthropic({ userContent, model, temperature }) {
  const resp = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: typeof temperature === 'number' ? temperature : 0.4,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${t.slice(0, 500)}`);
  }
  const data = await resp.json();
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

export async function invokeLLM({ prompt, response_json_schema, model, temperature }) {
  const provider = getProvider();
  if (provider === 'none') {
    return { ok: true, demo: true, result: mockResponse({ prompt, response_json_schema }) };
  }

  const userContent = String(prompt || '') + schemaInstruction(response_json_schema);
  const resolvedModel = getModel(provider);

  const text =
    provider === 'openai'
      ? await callOpenAI({
          userContent,
          model: resolvedModel,
          temperature,
          jsonMode: !!response_json_schema,
        })
      : await callAnthropic({ userContent, model: resolvedModel, temperature });

  if (response_json_schema) {
    const parsed = extractJson(text);
    if (parsed === null) throw new Error('Model did not return valid JSON for the requested schema.');
    return { ok: true, demo: false, result: repairLatex(parsed) };
  }
  return { ok: true, demo: false, result: text };
}
