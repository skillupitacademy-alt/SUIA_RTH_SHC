import { createContext } from 'react';

export interface BlockLearningStateResponse {
  blockId: string;
  blockVersion: string;

  visitCount: number;
  revisionCount: number;

  /**
   * Cumulative authoritative active time.
   *
   * This is NOT the delta delivered by the telemetry request.
   */
  activeTimeSec: number;

  expectedTimeSec: number | null;

  firstViewedAt: string | null;
  lastViewedAt: string | null;
  completedAt: string | null;
}

export type OnActiveTimeDeliveryAcknowledged = (
  blockId: string,
  blockVersion: string,
  state: BlockLearningStateResponse,
) => void;

export interface TelemetryCallbackContextValue {
  onActiveTimeDeliveryAcknowledged?: OnActiveTimeDeliveryAcknowledged;
}

export const TelemetryCallbackContext =
  createContext<TelemetryCallbackContextValue | null>(null);
