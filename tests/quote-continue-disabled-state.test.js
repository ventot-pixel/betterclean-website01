/**
 * A disabled Continue button must look disabled.
 *
 * Regression: `.btn-primary` had no `:disabled` rule, and `.btn-primary:hover`
 * was unguarded. A disabled #bookingStep1Continue therefore rendered with the
 * full green background, and darkened + lifted on hover, exactly like a live
 * button. Clicking it did nothing. Reported as "nothing happens when I click
 * continue to date and area" (2026-07-09).
 *
 * The button disables when the home size is blank or above 180 m².
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'request-quote.html'), 'utf8');

assert.match(
  html,
  /\.btn-primary:disabled \{[^}]*opacity:[^}]*\}/,
  'disabled .btn-primary must be visually dimmed via opacity'
);

assert.match(
  html,
  /\.btn-primary:disabled \{[^}]*cursor: not-allowed[^}]*\}/,
  'disabled .btn-primary must show a not-allowed cursor'
);

// The hover rule must not fire on a disabled button.
const hoverRule = html.match(/\.btn-primary[^{]*:hover \{[^}]*\}/g) || [];
assert.ok(hoverRule.length > 0, '.btn-primary hover rule exists');
for (const rule of hoverRule) {
  assert.match(
    rule,
    /:not\(:disabled\)/,
    'the .btn-primary hover rule must be guarded with :not(:disabled) so a ' +
      'disabled button never darkens or lifts: ' + rule.slice(0, 60)
  );
}

console.log('quote-continue-disabled-state: OK');
