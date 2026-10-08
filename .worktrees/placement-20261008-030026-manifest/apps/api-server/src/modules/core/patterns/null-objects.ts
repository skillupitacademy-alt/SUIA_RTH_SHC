import { DomainNode, SubjectNode, TopicNode } from "@quiz/types/report";

/**
 * Null Object Pattern implementations for hierarchical data.
 * Used to avoid repetitive null coalescing and defensive coding 
 * when reporting or evaluating partial data structures.
 */

export const NullDomain: DomainNode = {
  id: 'null-domain',
  name: 'Unknown Domain',
  subjects: []
};

export const NullSubject: SubjectNode = {
  id: 'null-subject',
  name: 'Unknown Subject',
  topics: []
};

export const NullTopic: TopicNode = {
  id: 'null-topic',
  name: 'Unknown Topic',
  subtopicCount: 0
};

export const NullSubtopic = {
  id: 'core-focus',
  name: 'Core Focus' // By business logic, loose topics fallback to "Core Focus"
};

/**
 * Helper factory to get safe default strings for Materializer
 */
export function getSafeSubtopic(id: string | null | undefined, subtopicMap: Map<string, string>): { id: string, name: string } {
    if (id !== undefined && id !== null && id !== "") {
        const name = subtopicMap.get(id);
        if (name !== undefined && name !== null && name !== '') {
            return { id, name };
        }
    }
    return NullSubtopic;
}

export function getSafeDomain(domainId?: string | null, domainName?: string | null): { id: string, name: string } {
    return {
        id: domainId ?? NullDomain.id,
        name: domainName ?? NullDomain.name
    };
}
