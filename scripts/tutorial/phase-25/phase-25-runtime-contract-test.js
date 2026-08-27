'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

const FILES = {
  renderer:
    path.join(
      ROOT,
      'packages/ui/src/tutorial/TutorialBlockRenderer.tsx'
    ),

  types:
    path.join(
      ROOT,
      'packages/ui/src/tutorial/types.ts'
    ),

  shell:
    path.join(
      ROOT,
      'src/share-branding/LearningExperience/components/TutorialPageShell.tsx'
    ),

  runtime:
    path.join(
      ROOT,
      'src/share-branding/LearningExperience/runtime/TutorialRuntimeContext.ts'
    ),

  delivery:
    path.join(
      ROOT,
      'src/share-branding/LearningExperience/tutorialSidebarDelivery.ts'
    ),
};

function read(name) {
  const file = FILES[name];

  if (!fs.existsSync(file)) {
    throw new Error(`Required file does not exist: ${file}`);
  }

  return fs.readFileSync(file, 'utf8');
}

function test(name, condition, details) {
  if (condition) {
    console.log(`PASS  ${name}`);
    return true;
  }

  console.error(`FAIL  ${name}`);

  if (details) {
    console.error(`      ${details}`);
  }

  return false;
}

function main() {
  console.log('');
  console.log(
    'PHASE 2.5 RUNTIME CONTRACT AUDIT'
  );
  console.log('');

  const renderer = read('renderer');
  const types = read('types');
  const shell = read('shell');
  const runtime = read('runtime');
  const delivery = read('delivery');

  const results = [];

  results.push(
    test(
      'runtimeContext type exists',
      types.includes(
        'TutorialBlockRuntimeContext'
      )
    )
  );

  results.push(
    test(
      'BlockComponentProps exposes runtimeContext',
      types.includes(
        'runtimeContext?: TutorialBlockRuntimeContext'
      )
    )
  );

  results.push(
    test(
      'renderer accepts runtimeContext',
      renderer.includes('runtimeContext')
    )
  );

  results.push(
    test(
      'renderer passes runtimeContext',
      renderer.includes(
        'runtimeContext={runtimeContext}'
      )
    )
  );

  results.push(
    test(
      'shell creates runtime context',
      shell.includes(
        'createBlockRuntimeContext'
      )
    )
  );

  results.push(
    test(
      'shell actually passes runtime context',
      shell.includes(
        'runtimeContext={blockRuntimeContext}'
      )
    )
  );

  results.push(
    test(
      'sectionId exists in runtime context',
      runtime.includes(
        'sectionId: string | null'
      )
    )
  );

  results.push(
    test(
      'delivery contains sectionId',
      delivery.includes(
        'sectionId'
      )
    )
  );

  /*
   * Critical anti-pattern check.
   */
  results.push(
    test(
      'no blockType → navigationNodeId fake mapping',
      !shell.includes(
        'completedBlocks.includes(node.id)'
      )
    )
  );

  /*
   * Important type-safety audit.
   */
  const hasAnyVersionCast =
    /\(block as any\)\.version/.test(shell);

  results.push(
    test(
      'no unsafe block version cast',
      !hasAnyVersionCast,
      hasAnyVersionCast
        ? 'Found (block as any).version'
        : undefined
    )
  );

  const failed =
    results.filter(Boolean).length !== results.length;

  console.log('');

  if (failed) {
    console.error(
      'Runtime contract audit FAILED.'
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    'Runtime contract audit PASSED.'
  );
}

main();
