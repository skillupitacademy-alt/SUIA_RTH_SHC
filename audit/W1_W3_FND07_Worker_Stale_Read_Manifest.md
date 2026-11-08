# FND07 worker stale-private-read control addendum

Baseline d66ffb37. Existing worker control covers writes only. Add actual handler fixture simulating cached prior student response and offline network; it must not serve that cached private response. Do not access real cache/browser/network; no runtime change. This is a hypothetical cache fixture, not evidence of real account switch. Retain failure and public positive.
