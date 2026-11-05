# FND20 multi-select evaluator compatibility control manifest

Baseline 24c5c6d3. Actual scorer interprets comma-delimited answer strings and accepts numeric score >=0.8 as boolean correct. Add isolated real AnswerEvaluationEngine/EvaluatorFactory controls for full match, wrong option penalty, incomplete selections and threshold behavior. This characterizes existing behavior without endorsing policy or changing algorithms; option text containing commas and persistence remain separate. Guarded config-free runner, no network/DB/browser. Sol review required.
