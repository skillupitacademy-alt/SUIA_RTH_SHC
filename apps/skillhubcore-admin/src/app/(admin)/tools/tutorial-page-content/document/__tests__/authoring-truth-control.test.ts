import { expect, it } from 'vitest';
import { prepareBlockForStorage } from '../blockVersionDefinitions';
import { definitionD1Example } from '../../blocks/definition/D1/definitionD1.examples';
import { introductionI1Example } from '../../blocks/introduction/I1/introductionI1.examples';

it.each([['definition', 'D1', definitionD1Example], ['introduction', 'I1', introductionI1Example]] as const)(
  'does not fill missing %s author content with example lesson claims', (type, version, example) => {
    const prepared = prepareBlockForStorage({ page: { title: 'Unrelated Python lesson' } }, type, version);
    const result = JSON.stringify(prepared.content);
    const exampleText = JSON.stringify(example.page);
    expect(result).not.toBe(exampleText);
    expect(result).not.toContain(type === 'definition' ? definitionD1Example.page.definition : introductionI1Example.page.learningGoal);
  },
);
it('preserves a fully supplied definition payload', () => {
  expect(prepareBlockForStorage(definitionD1Example, 'definition', 'D1').content).toEqual(definitionD1Example);
});
