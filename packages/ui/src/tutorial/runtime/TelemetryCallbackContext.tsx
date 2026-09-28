/**
 * Telemetry Callback Context
 * 
 * Private runtime context for propagating successful telemetry delivery
 * acknowledgements from BlockTelemetryProvider to ILSProvider.
 * 
 * PURPOSE:
 * Enables reactive ILS cache updates when the server acknowledges telemetry
 * delivery and returns authoritative block learning state.
 * 
 * SEMANTIC CONTRACT:
 * The callback represents: "server acknowledged telemetry and supplied
 * authoritative block learning state."
 * 
 * It does NOT represent "increment active time" or "exactly-once event."
 * 
 * The server owns exactly-once/idempotent persistence via event ledger.
 * The callback is an idempotent notification of authoritative state.
 * 
 * ARCHITECTURE:
 * - ILSProvider provides this context
 * - BlockTelemetryProvider consumes this context
 * - Private to runtime layer (not exposed to application)
 */

import { createContext } from 'react';

/**
 * Block learning state from API response
 * 
 * Matches the runtime representation used by ILSProvider and returned by
 * /api/tutorial/ils/block-active-time endpoint.
 * 
 * NOTE: Date fields are JSON strings (not Date objects) at this boundary.
 * ILSProvider performs normalization when deriving activeBlockProgress.
 */
export interface BlockLearningStateResponse {
  blockId: string;
  blockVersion: string;
  visitCount: number;
  revisionCount: number;
  activeTimeSec: number;        // Cumulative (not delta)
  expectedTimeSec: number | null;
  firstViewedAt: string | null; // ISO timestamp string
  lastViewedAt: string | null;  // ISO timestamp string
  completedAt: string | null;   // ISO timestamp string
}

/**
 * Callback invoked when telemetry delivery is acknowledged by server
 * 
 * FIRES FOR BOTH SUCCESSFUL OUTCOMES:
 * - processed=true: New event, database state updated
 * - alreadyProcessed=true: Duplicate event, idempotent response
 * 
 * Both outcomes carry authoritative server state.
 * 
 * PARAMETERS:
 * @param blockId - Block identifier
 * @param blockVersion - Block version (e.g., "D1", "C1")
 * @param state - Authoritative server state after telemetry processing
 * 
 * IDEMPOTENCY:
 * Callback may fire multiple times for the same block (e.g., after lost
 * response + retry). Consumer must use replacement semantics, not accumulation.
 * 
 * ISOLATION:
 * Callback failures must not affect telemetry delivery success.
 * Server has already persisted the event when this callback fires.
 */
export type OnActiveTimeDeliveryAcknowledged = (
  blockId: string,
  blockVersion: string,
  state: BlockLearningStateResponse
) => void;

/**
 * Context value for telemetry acknowledgement callback
 */
export interface TelemetryCallbackContextValue {
  /**
   * Optional callback for telemetry delivery acknowledgement
   * 
   * Provided by ILSProvider, consumed by BlockTelemetryProvider.
   * 
   * When undefined, telemetry continues to work but ILS cache is not
   * reactively updated (original behavior).
   */
  onActiveTimeDeliveryAcknowledged?: OnActiveTimeDeliveryAcknowledged;
}

/**
 * Private context for telemetry → ILS propagation
 * 
 * Default is null to distinguish "no provider" from "provider with no callback."
 */
export const TelemetryCallbackContext = createContext<TelemetryCallbackContextValue | null>(null);
