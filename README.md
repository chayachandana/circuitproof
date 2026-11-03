# CircuitProof

I built CircuitProof to make AI circuit debugging testable. Meta's Muse Spark can run experiments against a circuit, inspect calculated measurements, and propose a repair. The app only offers that repair after it passes the circuit's targets, then checks it independently in the browser.

## Try it

Pick a circuit, introduce a fault, and run the simulation. You can also edit resistor values, reverse LEDs, open switches, or import a custom circuit as JSON.

**Try the recorded demo** replays a real Meta investigation with two faults. It's labeled as a recording and doesn't make a new API call. Live investigations stream experiment results as they arrive. Review the before/after measurements, apply the proposal, and export the notebook to keep the evidence.

## Run locally

Node.js 22 or later is required. No dependency install is needed.

```sh
npm start
```

Open http://127.0.0.1:5180. The simulator and recorded demo work without a key.

For live AI, copy `.env.example` to `.env`, enter your Meta key as `MODEL_API_KEY`, and restart. `DEMO_ACCESS_CODE` is a separate code for live-demo visitors; never give visitors your Meta API key. Keep `.env` private.

```sh
npm test                 # automated checks
npm run verify           # offline setup check
npm run verify:live      # one paid live smoke test
npm run evaluate         # offline fault detection checks
npm run evaluate:live    # eight paid live investigations
```

## What's included

- A graph-based nodal DC solver for resistors, LEDs, and switches.
- Five examples: parallel LED branches, sensor divider, switched indicator, series LEDs, and loaded divider.
- Circuit JSON import/export, node-voltage inspection, and local notebook persistence.
- A Meta agent with experiment and recommendation tools, streaming evidence, token counts, and bounded requests.
- Server and browser repair verification.
- A protected hosting API and a dependency-free Worker build.
- A demo script, submission notes, evaluation reports, and MIT license.

## Results

The current automated suite has **27 passing tests**. In a live development run, **8/8 cases passed**, including a healthy control. An earlier configuration passed 6/8; both reports are retained. This is a small predefined development set, not a held-out benchmark or a claim of general accuracy. See [the evaluation notes](docs/EVALUATION.md) and [raw summary](web/evaluation.json).

## Model and limits

The backend calls `muse-spark-1.3` through Meta Model API. The agent gets at most five requests, ten tool calls, and 90 seconds per investigation. Each request uses low reasoning effort and a 3,000-token output budget. Failed and truncated runs don't apply changes.

This is a simulation tool. LEDs use a forward threshold plus 10 Ω dynamic resistance. Closed switches use 0.01 Ω; tiny grounding conductance stabilizes floating nodes. There are no transients, thermal effects, tolerances, or reverse-breakdown calculations. The agent can edit values, polarity, and enabled state, but cannot change goals or rewire endpoints.

Hosted live calls require a separate access code. The API allows one active request and four accepted requests per client in ten minutes per server instance. Those counters are not a durable global spending limit. Set a budget in Meta's dashboard too. Circuit notebooks stay in the visitor's browser until exported; a live investigation sends its circuit to Meta.

## Hosting and submission

The Sites deployment is generated from these sources with `npm run build`. The generated Worker contains no keys; runtime secrets are configured separately. The local hosting folder is `../circuitproof-hosting` and is created using the Sites Worker ESM starter.

See [the three-minute demo plan](docs/DEMO-SCRIPT.md) and [submission checklist](docs/SUBMISSION.md). The project is prepared here; the CV submission and any social posts are separate actions for me to review and send.

Meta references: [Chat Completions](https://dev.meta.ai/docs/protocols/chat-completions) · [Tool calling](https://dev.meta.ai/docs/tool-calling) · [Reasoning](https://dev.meta.ai/docs/reasoning)
