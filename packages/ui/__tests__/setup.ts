import '@testing-library/jest-dom';

// Configure act environment for React 19 testing library
// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Ensure CommonJS React exports act for react-dom-test-utils in React 19
try {
  const reqReact = require('react');
  if (typeof reqReact.act !== 'function') {
    reqReact.act = (cb: any) => cb();
  }
} catch {}
