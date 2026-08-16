/**
 * TEMPORARY - Security verification for Prompt 12A
 * Testing URL encoding and case sensitivity
 */

import { tutorialContentSanitizationService } from './packages/db-tutorial/src/services/tutorial-content-sanitization.service';

// Test 1: URL encoding
console.log('\n=== Test 1: URL Encoding ===');
const encoded1 = tutorialContentSanitizationService.sanitizeUrl('javascript%3Aalert(1)');
console.log('javascript%3Aalert(1) →', encoded1);
console.log('Modified:', encoded1.modified);

// Test 2: Double encoding
console.log('\n=== Test 2: Double Encoding ===');
const encoded2 = tutorialContentSanitizationService.sanitizeUrl('javascript%253Aalert(1)');
console.log('javascript%253Aalert(1) →', encoded2);
console.log('Modified:', encoded2.modified);

// Test 3: Mixed case
console.log('\n=== Test 3: Mixed Case ===');
const mixed1 = tutorialContentSanitizationService.sanitizeUrl('JaVaScRiPt:alert(1)');
console.log('JaVaScRiPt:alert(1) →', mixed1);
console.log('Modified:', mixed1.modified);

// Test 4: Whitespace obfuscation
console.log('\n=== Test 4: Whitespace ===');
const ws1 = tutorialContentSanitizationService.sanitizeUrl('java script:alert(1)');
console.log('java script:alert(1) →', ws1);
console.log('Modified:', ws1.modified);

const ws2 = tutorialContentSanitizationService.sanitizeUrl(' javascript:alert(1)');
console.log(' javascript:alert(1) (leading space) →', ws2);
console.log('Modified:', ws2.modified);

// Test 5: Null byte
console.log('\n=== Test 5: Null Byte ===');
const null1 = tutorialContentSanitizationService.sanitizeUrl('javascript\x00:alert(1)');
console.log('javascript\\x00:alert(1) →', null1);
console.log('Modified:', null1.modified);

// Test 6: Tab/newline
console.log('\n=== Test 6: Tab/Newline ===');
const tab1 = tutorialContentSanitizationService.sanitizeUrl('java\tscript:alert(1)');
console.log('java\\tscript:alert(1) →', tab1);
console.log('Modified:', tab1.modified);

// Test 7: SVG encoding
console.log('\n=== Test 7: SVG Attacks ===');
const svg1 = tutorialContentSanitizationService.sanitizeSVG('<svg><script>alert(1)</script></svg>');
console.log('Script removed:', !svg1.sanitized.includes('<script>'));

const svg2 = tutorialContentSanitizationService.sanitizeSVG('<svg><SCRIPT>alert(1)</SCRIPT></svg>');
console.log('Uppercase SCRIPT removed:', !svg2.sanitized.includes('<SCRIPT>'));

const svg3 = tutorialContentSanitizationService.sanitizeSVG('<svg><ScRiPt>alert(1)</ScRiPt></svg>');
console.log('Mixed case ScRiPt:', svg3.sanitized.includes('ScRiPt'));
