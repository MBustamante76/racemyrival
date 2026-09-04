import { CANONICAL_LAP_M } from "../race/constants";

export { CANONICAL_LAP_M };

export const STADIUM_BEND_RADIUS_M = 36.5;

export const STADIUM_TWO_BENDS_M = 2 * Math.PI * STADIUM_BEND_RADIUS_M;

export const STADIUM_STRAIGHT_M = (CANONICAL_LAP_M - STADIUM_TWO_BENDS_M) / 2;

export const STADIUM_BEND_M = STADIUM_TWO_BENDS_M / 2;
