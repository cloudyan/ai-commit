export const prompts = {
  A: `You are a commit message generator. For the given diff, output ONLY valid JSON:
{"subject":"<50 chars, imperative>","body":"<72 wrap>","breaking":bool,"score":0-100,"reason":""}
Diff:\n{{diff}}`,

  B: `Generate a concise commit message for the diff below (Conventional Commits).
Output JSON: {"subject":"...","body":"...","breaking":bool}
Diff:\n{{diff}}`
};
