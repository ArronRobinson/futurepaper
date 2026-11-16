// Vercel serverless function: turns a premise into a streamed front-page JSON.
// Needs the ANTHROPIC_API_KEY environment variable (set it in Vercel, never in code).

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const SCENES = ["city","harbor","countryside","monument","bridge","crowd","sky"];
const OVERLAYS = ["none","longneck","airship","rocket","statue","saucer"];

const str = { type: "string" };
const strList = { type: "array", items: str };
const PHOTO = {
  photoScene: { type: "string", enum: SCENES },
  photoOverlay: { type: "string", enum: OVERLAYS },
  caption: str
};
const EDITION_TOOL = {
  name: "print_edition",
  description: "Print the finished front page of the newspaper.",
  input_schema: {
    type: "object",
    properties: {
      paperName: str, motto: str, city: str, date: str, volume: str, number: str, price: str, edition: str, weather: str,
      lead: { type: "object", properties: { kicker: str, headline: str, deck: str, byline: str, bylineNote: str, dateline: str, body: strList, jump: str, ...PHOTO },
              required: ["kicker","headline","deck","byline","dateline","body","photoScene","photoOverlay","caption"] },
      second: { type: "object", properties: { headline: str, deck: str, byline: str, dateline: str, body: strList, ...PHOTO },
                required: ["headline","deck","byline","dateline","body","photoScene","photoOverlay","caption"] },
      briefs: { type: "array", items: { type: "object", properties: { title: str, text: str }, required: ["title","text"] } },
      stories: { type: "array", items: { type: "object", properties: { headline: str, body: strList }, required: ["headline","body"] } },
      editorial: { type: "object", properties: { title: str, body: strList }, required: ["title","body"] },
      quote: { type: "object", properties: { text: str, attribution: str }, required: ["text","attribution"] },
      inside: strList,
      ads: { type: "array", items: { type: "object", properties: { headline: str, tagline: str, body: str, price: str, footer: str }, required: ["headline","tagline","body","price","footer"] } },
      classifieds: strList,
      markets: { type: "array", items: { type: "object", properties: { name: str, value: str, change: str }, required: ["name","value","change"] } }
    },
    required: ["paperName","motto","city","date","volume","number","price","edition","weather","lead","second","briefs","stories","editorial","quote","inside","ads","classifieds","markets"]
  }
};

function buildPrompt(premise) {
  return `You are the entire editorial staff of the leading newspaper of an alternate world. The world is defined by this premise, which is simply true there:

"${premise}"

Write today's complete front page of that world's most respected daily newspaper.

Rules:
- Treat the premise as settled fact and follow its consequences everywhere: politics, local news, prices, sport, fashion, etiquette, technology, advertising, classifieds, commodity markets. Every single item must clearly follow from the premise.
- Choose the era for the paper's date: if the premise changes history, set it a few decades after the change so its consequences are visible (keep it between 1890 and today). If it is about the present, use a present-day date.
- Name the newspaper as that world would (plausible and dignified; a joke may live in the motto).
- Voice: deadpan, utterly serious broadsheet journalism of that era. The humor comes from specific, plausible, mundane details, never from winking at the reader. Use concrete numbers, place names and quoted officials with invented names. Do not use real living people as characters.
- If the premise involves war, atrocity or a hateful regime, never celebrate or promote it: keep it non-graphic and aim the satire at bureaucracy, propaganda, shortages and everyday absurdity.
- Ads: products that only make sense in this world, in period advertising voice, priced in that world's currency.
- LANGUAGE: Write every word in plain, readable English, always, even if this world's newspaper would really be printed in German, Latin, Japanese or any other language. Treat it as the English-language edition. Foreign words may appear only in proper names (people, places, products, the paper's name) and at most one short phrase per article; never write a full sentence in another language.
- Respect every length limit; the page layout depends on them.

Deliver the front page by calling the print_edition tool. Fill every field, following these lengths:
{
 "paperName": "≤ 28 chars",
 "motto": "≤ 60 chars",
 "city": "city of publication",
 "date": "e.g. Tuesday, March 9, 1954",
 "volume": "Roman numerals", "number": "e.g. 35,412", "price": "e.g. Five Cents", "edition": "e.g. Late City Edition",
 "weather": "≤ 80 chars, flavored by the premise",
 "lead": {
   "kicker": "1-3 words", "headline": "≤ 70 chars", "deck": "≤ 130 chars",
   "byline": "By FIRSTNAME M. LASTNAME", "bylineNote": "e.g. Special to The Tribune", "dateline": "CITY, Month Day",
   "body": ["5 paragraphs, 55-75 words each"],
   "jump": "e.g. Continued on Page 8, Column 2",
   "photoScene": one of ${JSON.stringify(SCENES)},
   "photoOverlay": one of ${JSON.stringify(OVERLAYS)},
   "caption": "≤ 40 words, starting with a short ALL-CAPS phrase and a dash, ending with a photographer credit"
 },
 "second": { "headline": "≤ 70 chars", "deck": "≤ 70 chars", "byline": "By ...", "dateline": "CITY, Month Day", "body": ["3 paragraphs, 35-50 words each"], "photoScene": one of the scenes, "photoOverlay": one of the overlays, "caption": "≤ 25 words" },
 "briefs": [5 × { "title": "≤ 24 chars", "text": "20-32 words" }],
 "stories": [4 × { "headline": "≤ 64 chars", "body": ["2 paragraphs, 30-45 words each"] }],
 "editorial": { "title": "≤ 40 chars", "body": ["2 paragraphs, 50-65 words each"] },
 "quote": { "text": "≤ 25 words", "attribution": "name and role" },
 "inside": ["5 items like 'Sports: headline · 31'"],
 "ads": [3 × { "headline": "≤ 26 chars", "tagline": "≤ 55 chars", "body": "20-32 words", "price": "≤ 20 chars", "footer": "company, address or phone, ≤ 50 chars" }],
 "classifieds": ["8 items, 14-24 words each, each starting with an ALL-CAPS category and a colon, e.g. LOST: ..."],
 "markets": [6 × { "name": "≤ 16 chars, a commodity of this world", "value": "e.g. 4.12", "change": "e.g. +0.08 or -0.12" }]
}`;
}


// Open /api/edition in a browser to check the setup.
export async function GET() {
  return Response.json({
    ok: true,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
    model: MODEL,
    node: process.version
  });
}

export async function POST(request) {
  let body = {};
  try { body = await request.json(); } catch {}
  const premise = typeof body.premise === "string" ? body.premise.trim() : "";
  if (!premise || premise.length > 220) {
    return new Response("Premise must be 1-220 characters.", { status: 400 });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return new Response("Server is missing ANTHROPIC_API_KEY.", { status: 500 });

  // One plain request: wait for the whole edition, then send it to the page in one piece.
  let upstream;
  try {
    upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8000,
        tools: [EDITION_TOOL],
        tool_choice: { type: "auto" },
        messages: [{ role: "user", content: buildPrompt(premise) }]
      }),
      signal: AbortSignal.timeout(280000)
    });
  } catch (e) {
    console.error("Could not reach the Claude API", e);
    return new Response("Could not reach the Claude API: " + (e && e.message), { status: 502 });
  }

  const raw = await upstream.text();
  let data = null;
  try { data = JSON.parse(raw); } catch {}

  if (!upstream.ok) {
    console.error("Anthropic API error", upstream.status, raw);
    const msg = data?.error?.message || raw.slice(0, 300);
    return new Response("Claude API error " + upstream.status + ": " + msg, { status: upstream.status === 429 ? 429 : 502 });
  }

  const blocks = Array.isArray(data?.content) ? data.content : [];
  const tool = blocks.find(b => b.type === "tool_use" && b.name === "print_edition");
  if (tool && tool.input && typeof tool.input === "object" && tool.input.lead) {
    if (data.stop_reason === "max_tokens") console.warn("Edition hit max_tokens");
    return Response.json(tool.input, { headers: { "cache-control": "no-store" } });
  }

  // Fall back to a JSON answer written as plain text, if that is what came back.
  const text = blocks.filter(b => b.type === "text").map(b => b.text).join("");
  const a = text.indexOf("{"), z = text.lastIndexOf("}");
  if (a >= 0 && z > a) {
    try { return Response.json(JSON.parse(text.slice(a, z + 1)), { headers: { "cache-control": "no-store" } }); } catch {}
  }

  const summary = "stop_reason=" + data?.stop_reason + ", blocks=" + (blocks.map(b => b.type).join("+") || "none");
  console.error("No usable edition", summary, raw.slice(0, 2000));
  return new Response(
    data?.stop_reason === "max_tokens"
      ? "The edition ran too long and was cut off. Please try again."
      : "Claude answered, but without a usable edition (" + summary + ").",
    { status: 502 }
  );
}
