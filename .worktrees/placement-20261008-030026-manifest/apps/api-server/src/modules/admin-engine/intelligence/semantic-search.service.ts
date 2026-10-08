export const SemanticSearchService = {
  // Simple stub: treat the literal string "dup" as a conceptual duplicate for testing/coverage.
  async isDuplicate(text: string): Promise<boolean> {
    return text === 'dup';
  },
};
