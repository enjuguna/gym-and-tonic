# Demo video script — Gym & Tonic (~2:30)

## Beats

**0:00–0:15 Hook.**
Black screen → app fades in on the photo hero.
VO: "Fourteen slots a week. One question that never stops: should I train today? This is Gym & Tonic — and your ChatGPT is the coach."

**0:15–0:35 The grid.**
Show the 14-slot week grid, color chips, empty dashed slots.
VO: "Every session lives here. Muscle-group color coding, minutes, and a post-workout plate from home."

**0:35–1:15 The coach works (the WebMCP money shot).**
In ChatGPT's built-in browser beside the page:
- Type: "Check what my week is missing."
- Show `check_balance` tool call fire → verdict appears in chat.
- Type: "Fix it."
- `propose_session` fires → proposal row slides into the app → **click Approve on screen** → grid fills, coverage strip lights up.
- VO: "The coach reads your live plan through site tools — no screenshots, no clicking around. And it can't touch anything without your approval."

**1:15–1:40 The story layer.**
Click a session → DayStory spread opens (photo, numbered exercises with cues, refuel recipe card).
Show Coach Voice typing: "Wheel Day on the board. Your future self just exhaled."
VO: "Every session is a story — cues, refuels from home, and a coach who talks back."

**1:40–2:00 The details.**
Quick cuts: streak flame growing · muscle-group strip lighting up · WhatsApp gear share · progress ring filling.

**2:00–2:15 The finale.**
Fill the last slot → rubber stamp slams: "WEEK COMPLETE · WELL TRAINED." + victory sting.

**2:15–2:30 Close.**
VO: "The agent plans. You approve. That's WebMCP."
End card: repo URL + "Built with Astro, React & WebMCP".

---

## Recording checklist
- [ ] Latest ChatGPT desktop app; model GPT-5.6 Sol or Terra (site tools enabled)
- [ ] Chrome + WebMCP fallback recorded too (backup takes)
- [ ] Fresh plan state before take (clear slots)
- [ ] Mic check; ambience OFF for VO takes, ON for one feel-good cutaway
- [ ] Pre-stage: 3–4 sessions already planned so `check_balance` has data to judge
- [ ] Screen resolution 1920×1080, browser zoom 100%, hide bookmarks bar

## Devpost links block
- Live URL: https://gym-and-tonic-five.vercel.app
- Repo: https://github.com/enjuguna/gym-and-tonic
- Tools reference: https://gym-and-tonic-five.vercel.app/tools
