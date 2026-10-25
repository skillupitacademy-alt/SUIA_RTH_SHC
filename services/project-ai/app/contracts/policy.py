"""
Project LLM Framework Compliance-Only Policy.

Defines the canonical governing policy for Project LLM contract generation,
agent execution, validation, and certification boundaries.
"""

from pathlib import Path

FRAMEWORK_COMPLIANCE_POLICY_TEXT = """# PROJECT LLM — FRAMEWORK COMPLIANCE-ONLY POLICY

## 1. Sole responsibility

Project LLM is responsible for evidence-backed framework compliance, repository integration, and verification of candidate blocks against the canonical project architecture.

Project LLM must not design, prescribe, or redefine block-specific GUI layout, visual styling, component composition, or interaction behavior.

## 2. GUI ownership

The user and External AI own GUI design and implementation decisions, using the existing canonical block/version specifications and user-approved requirements.

Project LLM may inspect GUI implementation as evidence for compliance, but must not turn its observations into new design instructions unless a documented framework requirement explicitly requires them.

## 3. Canonical sources and documentation

Before creating or changing a specification, search the existing repository and documentation.

Reuse the authoritative source. Update or append to the existing canonical document where appropriate. Do not create duplicate Markdown files or parallel specifications merely to record the same requirements.

Do not invent missing schemas, APIs, registry entries, component conventions, or framework requirements.

## 4. Permitted compliance requirements

Validate only requirements supported by canonical architecture, repository evidence, approved policy, or the applicable existing block specification, including as relevant:

- UBRC and runtime compatibility.
- Passive ILS integration.
- Page-level LSNB and RSSB integration.
- Existing Tutorial Composer, registry, renderer, and type-system compatibility.
- Theme injection and brand independence.
- Repository placement, dependency boundaries, and approved-file changes.
- Required automated tests and evidence-backed certification.

Do not dictate the candidate's visual presentation or interaction design.

## 5. Fail-closed evidence policy

Every compliance claim must have traceable evidence.

If a required source, API, contract, or integration point cannot be verified, report BLOCKED and identify the missing evidence. Do not fabricate APIs, infer unsupported requirements, or report PASS without verification.

## 6. Multi-agent enforcement

This policy applies to every agent, orchestrator, prompt, generator, validator, contract, test template, and legacy execution path.

Role-specific instructions may add responsibilities but must not weaken or contradict this policy.

## 7. Completion criteria

Completion requires relevant tests, evidence of framework compliance, an accurate changed-file report, and confirmation that no GUI prescriptions were introduced.

Passing tests alone does not prove compliance with this policy.
"""


def get_framework_compliance_policy() -> str:
    """Return the shared governing policy for Project LLM agents."""
    return FRAMEWORK_COMPLIANCE_POLICY_TEXT
