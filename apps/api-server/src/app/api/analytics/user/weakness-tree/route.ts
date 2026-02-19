import { type NextRequest, NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { redis } from "@/lib/redis";
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

export async function GET(req: NextRequest) {
  try {
    // 1. Auth — extract userId from token (never from params)
    const token = TokenService.getAccessToken(req, { scope: "user" });
    if (token === undefined || token === null || token === "") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await TokenService.verifyAccessToken(token, false);
    const userId = payload.userId;

    // 2. Redis Cache
    const CACHE_KEY = CACHE_KEYS.ANALYTICS.USER(userId, "weakness-tree");
    try {
      const cachedData = await redis.get(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json(cachedData);
      }
    } catch (redisError) {
      console.error("[Redis Error]:", redisError);
    }

    // 3. Query — latest accuracy per dimension for this user
    const dimensions = (await sql`
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

    // 4. Get hierarchy mappings (topic → domain, skill → topic → domain)
    const topicHierarchy = (await sql`
      SELECT t.id AS topic_id, t.name AS topic_name,
             d.id AS domain_id, d.name AS domain_name
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id
      JOIN domains d ON d.id = s.domain_id
    `) as HierarchyRow[];

    const skillHierarchy = (await sql`
      SELECT sk.id AS skill_id, sk.name AS skill_name,
             t.id AS topic_id, t.name AS topic_name,
             d.id AS domain_id, d.name AS domain_name
      FROM skills sk
      JOIN topic_skills ts ON ts.skill_id = sk.id
      JOIN topics t ON t.id = ts.topic_id
      JOIN subjects s ON s.id = t.subject_id
      JOIN domains d ON d.id = s.domain_id
    `) as SkillHierarchyRow[];

    // 5. Build lookup maps
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

    // 6. Build tree: Domain → Topic → Skill with weakness = 100 - accuracy
    const domainMap = new Map<string, { name: string; topics: Map<string, { name: string; skills: TreeNode[] }> }>();

    for (const dim of dimensions) {
      if (dim.accuracy === null || dim.accuracy === undefined) continue;
      const weakness = 100 - Number(dim.accuracy);

      if (dim.dimension_type === "domain") {
        // Ensure domain node exists
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

    // 7. Convert Map → JSON tree
    const tree: TreeNode[] = [];
    for (const [, domain] of domainMap) {
      const topicNodes: TreeNode[] = [];
      for (const [, topic] of domain.topics) {
        if (topic.skills.length > 0) {
          topicNodes.push({ name: topic.name, children: topic.skills });
        } else {
          // Topic with no skills — show as leaf with its own weakness
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

    // 8. Cache
    try {
      if (tree.length > 0) {
        await redis.set(CACHE_KEY, tree, { ex: CACHE_TTL.USER_PERSONAL });
      }
    } catch (redisError) {
      console.error("[Redis Cache Error]:", redisError);
    }

    return NextResponse.json(tree);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[User Weakness Tree Error]:", error);
    return NextResponse.json(
      { error: "Failed to fetch weakness tree", message },
      { status: 500 }
    );
  }
}
