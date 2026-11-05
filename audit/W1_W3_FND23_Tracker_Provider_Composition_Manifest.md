# FND23 analytics tracker/provider composition manifest

Baseline 8301bcd9. Provider HTTP failure correction was tested only in isolation; tracker records health based on provider resolution. Add offline actual tracker + actual internal provider test with isolated configuration, consent fixture and intercepted transport, asserting 503 increases failure health and 202 does not. No physical queue, provider, storage or browser. No runtime change. Sol review required.
