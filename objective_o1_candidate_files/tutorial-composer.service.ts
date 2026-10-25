import { ObjectiveO1Schema } from '@quiz/types';
import { z } from 'zod';

export const TutorialDocumentSchema = z.object({
  blocks: z.array(
    z.discriminatedUnion('type', [
      ObjectiveO1Schema,
      // ... other block schemas
    ])
  ),
});
