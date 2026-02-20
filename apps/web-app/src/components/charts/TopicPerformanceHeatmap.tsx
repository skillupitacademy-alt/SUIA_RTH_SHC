"use client";

import { apiClient, TopicPerformanceResponse } from "@quiz/api-client";
import { useEffect, useState } from "react";

import BaseChart from "./BaseChart";

export default function TopicPerformanceHeatmap() {
    const [data, setData] = useState<TopicPerformanceResponse>({
        topics: [],
        accuracy: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getUserTopicPerformance();
                setData(res);
            } catch (err: unknown) {
                console.error("Failed to load topic performance", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[300px] text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                Unable to load topic performance
            </div>
        );
    }

    const isEmpty = !loading && data.topics.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Complete some quizzes to see your topic performance
            </div>
        );
    }

    // Sort by accuracy ascending (weakest first)
    const indices = data.topics.map((_, i) => i);
    indices.sort((a, b) => data.accuracy[a] - data.accuracy[b]);

    const sortedTopics = indices.map(i => data.topics[i]);
    const sortedAccuracy = indices.map(i => data.accuracy[i]);

    // Build single-row heatmap matrix: [topicIndex, 0, accuracy]
    const heatmapData = sortedTopics.map((_, i) => [i, 0, sortedAccuracy[i]]);

    const option = {
        tooltip: {
            position: "top",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                const topicIdx = params.value[0];
                const accuracy = params.value[2];
                const topic = sortedTopics[topicIdx];
                const label = accuracy < 40 ? "Needs Work" : accuracy < 70 ? "Developing" : "Strong";
                const color = accuracy < 40 ? "#ef4444" : accuracy < 70 ? "#f59e0b" : "#22c55e";

                return `
          <div class="font-bold mb-1 text-slate-800">${topic}</div>
          <div class="flex items-center gap-2">
            <div class="font-bold" style="color:${color}">${accuracy}%</div>
            <div class="text-xs text-slate-500">— ${label}</div>
          </div>
        `;
            },
        },
        grid: {
            top: 40,
            right: 40,
            bottom: 120,
            left: 40,
        },
        xAxis: {
            type: "category",
            data: sortedTopics,
            axisLabel: {
                color: "#94A3B8",
                fontSize: 10,
                fontWeight: "bold",
                rotate: 35,
                interval: 0,
                overflow: "truncate",
                width: 100,
                margin: 20
            },
            axisLine: { lineStyle: { color: "#E2E8F0" } },
            axisTick: { show: false },
            splitArea: { show: false },
        },
        yAxis: {
            type: "category",
            data: ["Accuracy"],
            axisLabel: { show: false },
            axisLine: { show: false },
            axisTick: { show: false },
        },
        visualMap: {
            min: 0,
            max: 100,
            calculable: false,
            orient: "horizontal",
            left: "center",
            bottom: 20,
            itemWidth: 15,
            itemHeight: 200,
            textStyle: { color: "#94A3B8", fontSize: 10, fontWeight: "bold" },
            inRange: {
                color: ["#ef4444", "#f59e0b", "#22c55e"], // red → amber → green
            },
        },
        series: [
            {
                name: "Topic Accuracy",
                type: "heatmap",
                data: heatmapData,
                label: {
                    show: true,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter: (params: any) => `${params.value[2]}%`,
                    color: "#fff",
                    fontWeight: "black",
                    fontSize: 12,
                },
                itemStyle: {
                    borderWidth: 2,
                    borderColor: "#fff"
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 20,
                        shadowColor: "rgba(0, 0, 0, 0.3)",
                    },
                },
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Topic Strengths & Weaknesses</h3>
                <p className="text-sm text-slate-500">Your accuracy per topic — sorted weakest first</p>
            </div>
            <BaseChart option={option} height={350} loading={loading} />
        </div>
    );
}
