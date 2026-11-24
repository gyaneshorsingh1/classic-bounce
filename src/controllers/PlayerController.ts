import { BallFormConfig, BALL_FORM_CONFIGS } from '../game/ballConfigs';
import { RawInputState } from './InputController';

export interface PlayerKinematicsResult {
  vx: number;
  vy: number;
  didJump: boolean;
  scaleX?: number;
  scaleY?: number;
}

/**
 * PlayerController:
 * Authoritative movement and jump physics controller.
 *
 * Core Guarantees:
 * 1. Jump FSM: Strictly follows `if (grounded && jumpPressed && jumpAllowed) { triggerJump(); }`.
 * 2. Single Tap: Tap jump -> single jump -> releasing airborne prevents re-jumping on landing.
 * 3. Continuous Hold: Holding jump triggers first jump, prevents mid-air jumps, and re-triggers
 *    immediately upon landing if jumpPressed is still active.
 * 4. Deterministic Horizontal Movement:
 *    - Left moves left (-1).
 *    - Right moves right (+1).
 *    - Left + Right neutralizes to 0 (stable, predictable).
 *    - Smooth ground acceleration and skid-braking turnaround.
 *    - Consistent air control while airborne.
 *    - Smooth damping upon release without sudden velocity halts.
 * 5. Multi-Form Kinematics: Preserves form-specific personalities (Original, Big, Stone, Snow).
 */
export class PlayerController {
  private jumpAllowed: boolean = true;
  private wasGrounded: boolean = false;

  /**
   * Reset internal jump state (e.g. on respawn, level transition, or checkpoint reset).
   */
  public reset(): void {
    this.jumpAllowed = true;
    this.wasGrounded = false;
  }

  /**
   * Compute horizontal velocity based on directional inputs, ground/air state,
   * and the active ball form's physics configuration.
   */
  public computeHorizontalVelocity(
    currentVx: number,
    isGrounded: boolean,
    input: RawInputState,
    config: BallFormConfig = BALL_FORM_CONFIGS.original,
    _isMobile: boolean = false
  ): number {
    const { leftPressed, rightPressed } = input;
    const maxSpeed = config.maxSpeed;
    const groundDamping = config.groundDamping;
    const airDamping = config.airDamping;

    // Deterministic direction handling: Left and Right cancel to neutral (0)
    let moveDir = 0;
    if (leftPressed && !rightPressed) {
      moveDir = -1;
    } else if (rightPressed && !leftPressed) {
      moveDir = 1;
    }

    if (moveDir !== 0) {
      const isReversing = (currentVx > 0 && moveDir < 0) || (currentVx < 0 && moveDir > 0);

      if (isGrounded) {
        if (isReversing) {
          // Skid-braking traction when reversing direction on ground
          const skidDecel = 0.82;
          if (Math.abs(currentVx) > skidDecel) {
            return currentVx + moveDir * skidDecel;
          } else {
            // Braking completed: continue smoothly into progressive acceleration
            const remainder = skidDecel - Math.abs(currentVx);
            const accel = Math.min(remainder, config.acceleration);
            return moveDir * accel;
          }
        } else {
          // Progressive rolling acceleration up to calibrated maxSpeed
          const accel = config.acceleration;
          const newVx = currentVx + moveDir * accel;
          return Math.abs(newVx) > maxSpeed ? moveDir * maxSpeed : newVx;
        }
      } else {
        // Airborne: aerodynamic air acceleration preserving ballistic momentum
        const airAccel = config.airAcceleration;
        const newVx = currentVx + moveDir * airAccel;
        return Math.abs(newVx) > maxSpeed ? moveDir * maxSpeed : newVx;
      }
    }

    // No directional input (or both held): apply natural rolling resistance or air damping
    if (isGrounded) {
      const dampedVx = currentVx * groundDamping;
      return Math.abs(dampedVx) < 0.15 ? 0 : dampedVx;
    }

    // In air: preserve ballistic jump arc with slight aerodynamic air damping
    const airDampedVx = currentVx * airDamping;
    return Math.abs(airDampedVx) < 0.05 ? 0 : airDampedVx;
  }

  /**
   * Compute vertical velocity and jump triggers.
   * Follows the strict rule: `if (grounded && jumpPressed && jumpAllowed) { triggerJump(); }`
   */
  public computeVerticalVelocity(
    currentVy: number,
    isGrounded: boolean,
    input: RawInputState,
    config: BallFormConfig = BALL_FORM_CONFIGS.original
  ): { vy: number; didJump: boolean; scaleX?: number; scaleY?: number } {
    const { jumpPressed } = input;

    // Detect landing transition: airborne -> grounded
    const justLanded = isGrounded && !this.wasGrounded;
    if (justLanded) {
      // Re-enable jump allowance for this new landing
      this.jumpAllowed = true;
    }

    // If resting on ground and Jump button is released, ready the next tap jump
    if (isGrounded && !jumpPressed) {
      this.jumpAllowed = true;
    }

    // Record grounded state for next frame transition
    this.wasGrounded = isGrounded;

    // If airborne: ball cannot jump in mid-air
    if (!isGrounded) {
      return { vy: currentVy, didJump: false };
    }

    // Grounded evaluation: trigger at most one jump per landing cycle
    if (jumpPressed && this.jumpAllowed) {
      this.jumpAllowed = false;
      this.wasGrounded = false; // Immediately marks airborne

      return {
        vy: config.jumpVelocity,
        didJump: true,
        scaleX: 0.86,
        scaleY: 1.18,
      };
    }

    return { vy: currentVy, didJump: false };
  }
}
