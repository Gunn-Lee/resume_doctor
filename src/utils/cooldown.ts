/**
 * Cooldown timer stub
 * Will be implemented in future phase
 */

/**
 * Start a cooldown timer
 * @param seconds - Number of seconds for cooldown
 * @param onTick - Callback invoked each second with remaining time
 * @returns Cleanup function to stop the timer
 * @throws Error - Not yet implemented
 */
export function startCooldown(
  seconds: number,
  onTick: (remaining: number) => void
): () => void {
  // Placeholder - will implement timer logic
  throw new Error(
    `Cooldown timer not yet implemented - future phase (${seconds}s, ${onTick})`
  );
}
