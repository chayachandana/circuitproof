# Three-minute CircuitProof demo

Use the actual app. Keep credentials out of the recording. The recorded-demo button replays an earlier real Meta run and is explicitly labeled; don't present that playback as a new live request.

## 0:00–0:25 — Problem and product

I'm Chaya, and this is CircuitProof. When a circuit doesn't behave as expected, an AI explanation can sound convincing without being correct. I built a workbench where Meta has to test its proposed repairs against an electrical model. It investigates, measures, and verifies before anything changes.

Show the introduction, five examples, and target measurements.

## 0:25–1:00 — Introduce two faults

This example has two LED branches. Each LED should carry between three and fifteen milliamps. Here, one LED is reversed and the other branch has an undersized resistor. The solver measures zero current in one branch and too much in the other. Both goals fail.

Load the recorded demo or enter these two faults manually. If using playback, say: "This is a recording of a real Meta investigation, replayed here so the experiments are reproducible."

## 1:00–1:40 — Show the investigation

Meta can call an experiment tool. Every experiment starts from the original circuit. Fixing the LED alone leaves the second fault. Fixing the resistor alone leaves the reversed LED. The combined proposal is the first one in this recorded trace that satisfies every target. The measurements come from the solver, not from generated text.

Point at the failed and passed experiments and their measured currents. For an actual live run, describe the experiments it really produces rather than expecting this exact sequence.

## 1:40–2:10 — Apply and verify

The server checks that the proposed correction matches a passing experiment. The browser then independently solves it before applying the edits. Both LED currents are now about eight point eight two milliamps. The fix is verified within the model's assumptions.

Click Apply repair & verify and show TARGETS MET.

## 2:10–2:40 — Beyond one example

The workbench also supports a voltage divider, switched indicator, series LEDs, and a loaded sensor divider. You can edit components, import a circuit as JSON, inspect node voltages, and export the experiment notebook with the complete trace.

Switch to another example; show the inspector and notebook export.

## 2:40–3:00 — Evidence and honest scope

Show the evaluation summary. State the exact pass count, total, and model from the current report. Explain that it is a small development set, not a broad benchmark. End with: "CircuitProof turns a plausible answer into a testable engineering claim. The next step is expanding the model and validating usefulness with real users."
