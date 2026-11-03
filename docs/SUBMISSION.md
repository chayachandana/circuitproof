# CircuitProof — submission notes

Live product: https://circuitproof-chaya.shrewd-shrew-1225.chatgpt.site

Public repository: https://github.com/chayachandana/circuitproof

## Short description

CircuitProof is an engineering workbench where Meta's Muse Spark investigates simulated circuit faults, runs experiments, and proposes repairs that must pass independent verification before they can be applied.

## Problem and audience

Makers and electronics learners often know that a circuit is failing but struggle to connect the observed symptoms to component mistakes. A plausible explanation is not enough: they need to test whether a correction satisfies the intended behavior. CircuitProof makes that investigation visible and repeatable in a focused DC simulation.

## What I built

A graph-based DC solver for resistors, LEDs, and switches; five interactive circuit examples; JSON import for custom circuits; a Meta tool-using investigation loop; streaming experiment evidence; independently checked repairs; and an exportable experiment notebook. The interface includes a clearly labeled recording of a real Meta investigation so visitors can explore the process without spending API credits.

## Meta's role

Muse Spark 1.3 receives the circuit and baseline calculations. It chooses component edits using the experiment tool, observes their calculated effects, and returns a recommendation. The server refuses an untested or failing proposal. The browser independently recalculates both the proposed and applied correction. The source keeps model explanations separate from solver-generated measurements.

## Theme

Push the Frontier: a tool-using model investigates executable engineering designs and closes the loop with independently checked results. This version operates on simulated systems, not camera images or physical electronics.

## Technical limits

The LED model is piecewise linear; no device tolerances, transients, thermal behavior, or reverse breakdown are modeled. The model can change component values, enabled state, and LED polarity. It cannot change endpoints, supply voltage, or goals. Rate limiting is per server instance and is not a durable global spending cap; the separate access code is the primary protection for live API access.

## Before pressing Submit

- Confirm the repository and video links are publicly accessible.
- Use the deployed Site URL, not a localhost URL.
- Include the separate live-demo access code only in private judge instructions, never the Meta API key.
- Upload the three-minute walkthrough video and check playback while signed out.
- List every human contributor accurately; disclose coding assistance if the form asks.
- Copy the measured results from web/evaluation.json; don't imply this small development set is a held-out benchmark.
- Complete any required event acknowledgments yourself.
- If entering the viral award, post the demo on X and provide its link in the platform's requested field.

This document is preparation, not a submitted entry. The account owner must submit through the CV platform.
