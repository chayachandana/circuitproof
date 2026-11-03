# Evaluation

## Method

Eight predefined development cases: seven seeded faults and one healthy control. One live Meta investigation per case, no automatic retries. Proposed repairs must have a passing experiment and must also pass an independent calculation. This is a development test set, not a held-out benchmark, and it does not establish accuracy on arbitrary circuits.

## Results

- Model: `muse-spark-1.3`.
- Initial configuration: 6/8 passed. Two divider cases reached the request budget. The unmodified report is in `evaluation-first-run.json`.
- Revised configuration: 8/8 passed with explicit low reasoning effort and a 3,000-token per-request limit.
- Average wall-clock time in the revised run: 10.7 seconds.
- Reported token use across that run: 30,418. These are tokens, not a dollar-cost estimate.
- Automated suite: 27 passing tests.

## Cases

| Case | Result | Seconds | Experiments |
| --- | --- | ---: | ---: |
| reversed LED | Pass | 8.4 | 1 |
| two interacting faults | Pass | 7.3 | 1 |
| dim second branch | Pass | 5.4 | 1 |
| sensor divider ratio | Pass | 13.6 | 1 |
| open switch | Pass | 4.8 | 1 |
| series polarity fault | Pass | 5.9 | 1 |
| loaded divider faults | Pass | 33.3 | 1 |
| healthy circuit control | Pass | 6.8 | 0 |

The original recorded two-fault demo used three experiments. The revised live two-fault run solved it in one experiment; neither exact path is guaranteed. No real-user study or no-tools model baseline has been completed. Physical circuits have not been tested.
