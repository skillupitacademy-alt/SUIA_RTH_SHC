import { METRICS } from "@quiz/observability";
import { type NextRequest, NextResponse } from "next/server";

import { sqlReplica } from "@/lib/db";
import { recordCounter, recordTimer } from "@/lib/metrics";
import { redis } from "@/lib/redis";
import { withLogging } from "@/lib/withLogging";
import { CACHE_KEYS, CACHE_TTL } from "@/modules/analytics/analytics.constants";
import { TokenService } from "@/modules/auth/token.service";

export const dynamic = "force-dynamic";

interface DimensionRow {
  dimension_type: string;
  dimension_id: string;
  name: string;
  accuracy: number;
}

interface HierarchyRow {
  topic_id: string;
  topic_name: string;
  domain_id: string;
  domain_name: string;
}

interface SkillHierarchyRow {
  skill_id: string;
  skill_name: string;
  topic_id: string;
  topic_name: string;
  domain_id: string;
  domain_name: string;
}

interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

async function handler(req: NextRequest) {
  const start = Date.now();
  try {
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "weakness-tree");
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (__redisError) {
      // Ignored
    }

    const dimensions = (await sqlReplica`
      SELECT DISTINCT ON (r.dimension_type, r.dimension_id)
        r.dimension_type,
        r.dimension_id,
        r.name,
        r.accuracy
      FROM results_by_dimension r
      JOIN exams e ON e.id = r.exam_id
      WHERE e.user_id = ${userId}
        AND r.dimension_type IN ('domain', 'topic', 'skill')
      ORDER BY r.dimension_type, r.dimension_id, r.created_at DESC
    `) as DimensionRow[];

    if (dimensions.length === 0) {
      return NextResponse.json([]);
    }

    const topicHierarchy = (await sqlReplica`
      SELECT t.id AS topic_id, t.name AS topic_name,
             d.id AS domain_id, d.name AS domain_name
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id
      JOIN domains d ON d.id = s.domain_id
    `) as HierarchyRow[];

    const skillHierarchy = (await sqlReplica`
      SELECT sk.id AS skill_id, sk.name AS skill_name,
             t.id AS topic_id, t.name AS topic_name,
             d.id AS domain_id, d.name AS domain_name
      FROM skills sk
      JOIN topic_skills ts ON ts.skill_id = sk.id
      JOIN topics t ON t.id = ts.topic_id
      JOIN subjects s ON s.id = t.subject_id
      JOIN domains d ON d.id = s.domain_id
    `) as SkillHierarchyRow[];

    const topicToDomain = new Map<string, { domainId: string; domainName: string }>();
    for (const row of topicHierarchy) {
      topicToDomain.set(row.topic_id, { domainId: row.domain_id, domainName: row.domain_name });
    }

    const skillToTopic = new Map<string, { topicId: string; topicName: string; domainId: string; domainName: string }>();
    for (const row of skillHierarchy) {
      skillToTopic.set(row.skill_id, {
        topicId: row.topic_id,
        topicName: row.topic_name,
        domainId: row.domain_id,
        domainName: row.domain_name,
      });
    }

    const domainMap = new Map<string, { name: string; topics: Map<string, { name: string; skills: TreeNode[] }> }>();

    for (const dim of dimensions) {
      if (dim.accuracy === null || dim.accuracy === undefined) continue;
      const weakness = 100 - Number(dim.accuracy);

      if (dim.dimension_type === "domain") {
        if (!domainMap.has(dim.dimension_id)) {
          domainMap.set(dim.dimension_id, { name: dim.name ?? "Unknown Domain", topics: new Map() });
        }
      } else if (dim.dimension_type === "topic") {
        const parent = topicToDomain.get(dim.dimension_id);
        const domainId = parent?.domainId ?? "unknown";
        const domainName = parent?.domainName ?? "Other";

        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, { name: domainName, topics: new Map() });
        }
        const domain = domainMap.get(domainId)!;

        if (!domain.topics.has(dim.dimension_id)) {
          domain.topics.set(dim.dimension_id, { name: dim.name ?? "Unknown Topic", skills: [] });
        }
      } else if (dim.dimension_type === "skill") {
        const parent = skillToTopic.get(dim.dimension_id);
        const domainId = parent?.domainId ?? "unknown";
        const domainName = parent?.domainName ?? "Other";
        const topicId = parent?.topicId ?? "unknown";
        const topicName = parent?.topicName ?? "Other";

        if (!domainMap.has(domainId)) {
          domainMap.set(domainId, { name: domainName, topics: new Map() });
        }
        const domain = domainMap.get(domainId)!;

        if (!domain.topics.has(topicId)) {
          domain.topics.set(topicId, { name: topicName, skills: [] });
        }
        const topic = domain.topics.get(topicId)!;

        topic.skills.push({
          name: dim.name ?? "Unknown Skill",
          value: weakness,
        });
      }
    }

    const tree: TreeNode[] = [];
    for (const [, domain] of domainMap) {
      const topicNodes: TreeNode[] = [];
      for (const [, topic] of domain.topics) {
        if (topic.skills.length > 0) {
          topicNodes.push({ name: topic.name, children: topic.skills });
        } else {
          const topicDim = dimensions.find(
            d => d.dimension_type === "topic" && d.name === topic.name
          );
          if (topicDim !== undefined) {
            topicNodes.push({ name: topic.name, value: 100 - Number(topicDim.accuracy) });
          }
        }
      }

      if (topicNodes.length > 0) {
        tree.push({ name: domain.name, children: topicNodes });
      }
    }

    try {
      if (tree.length > 0) {
        await redis.set(CACHE_KEY, tree, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (__redisError) {
      // Ignored
    }

    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.WEAKNESS_TREE, 1, { outcome: 'success' });
    recordTimer(METRICS.ANALYTICS.WEAKNESS_TREE + '.duration', durationMs, { outcome: 'success' });
    return NextResponse.json(tree, {
      headers: { 'X-Duration-Ms': durationMs.toString() }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const durationMs = Date.now() - start;
    recordCounter(METRICS.ANALYTICS.WEAKNESS_TREE, 1, { outcome: 'failure' });
    recordTimer(METRICS.ANALYTICS.WEAKNESS_TREE + '.duration', durationMs, { outcome: 'failure' });
    return NextResponse.json(
      { error: "Failed to fetch weakness tree", message },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handler, { component: 'analytics', operation: 'get_weakness_tree' });
