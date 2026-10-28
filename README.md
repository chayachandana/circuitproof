# CircuitProof

I'm building CircuitProof to help debug circuits with evidence. The idea is to give a Meta model access to a circuit simulator, let it test possible fixes, and check whether its proposed repair actually meets the circuit's goals.

## Run it locally

You'll need Node.js 22 or later.

```sh
npm start
```

Open http://127.0.0.1:5180. There's nothing to install. The simulator runs without an API key.

To enable Meta investigations, copy `.env.example` to `.env`, add your key after `MODEL_API_KEY=`, and restart the server. Keep that file private; it's excluded from Git.

```sh
npm test
```

## Check the setup

I use this offline check before testing the model:

```sh
npm run verify
```

It checks the runtime, all three reference circuits, a combined fault, and a known correction. It doesn't call Meta or spend credits.

Once the key is saved in `.env`, this runs one real investigation:

```sh
npm run verify:live
```

That uses API credits. It asks Meta to repair two faults, independently checks the proposed changes, and saves the evidence in `work/live-verification.json`. The `work` folder is excluded from Git. One passing run is a smoke test, not an accuracy result.

## Try it

Pick a circuit, introduce a fault, and run the simulation. You can edit resistor values, reverse an LED, or open a switch yourself.

With Meta configured, click **Investigate with Meta**. The model can run experiments against the original circuit. The app only accepts a repair after that candidate passes every target. You can review the experiments before applying the change, then export the notebook as JSON.

## What's here

- A graph-based DC solver for resistors, LEDs, and switches.
- Three examples: parallel LED branches, a voltage divider, and a switched indicator.
- Node voltage and component current calculations, with explicit pass/fail targets.
- A server-side Meta tool loop and independently checked repair proposals.
- Tests for the solver and mocked model/tool interactions.

## Current limits

This is a simulator prototype, not a general electronics design tool. The LED model uses a fixed forward threshold and 10 Ω dynamic resistance. Switches have 0.01 Ω closed resistance. A tiny conductance to ground stabilizes floating nodes. It doesn't model transients, reverse breakdown, temperature, or component tolerances.

The tests use mocked model responses. Live Meta accuracy and browser behavior still need to be checked. A configured key means a key is present, not that the API has accepted it.

The server is local-only. Public hosting will need authentication and per-user spending controls. The agent currently has a five-request, ten-tool-call budget and a 90-second overall timeout per investigation.

## Next

I want to test real model runs, add more fault cases, and measure how often the agent finds a repair on cases it hasn't seen before.

Meta API references: [Chat Completions](https://dev.meta.ai/docs/protocols/chat-completions) · [Tool calling](https://dev.meta.ai/docs/tool-calling)
