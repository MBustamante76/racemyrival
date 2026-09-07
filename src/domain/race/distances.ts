import { METRES_PER_MILE } from "./constants";
import type { RaceDistanceOption } from "./types";

export const RACE_DISTANCES: readonly RaceDistanceOption[] = [
  { id: "100", label: "100m", distanceM: 100 },
  { id: "200", label: "200m", distanceM: 200 },
  { id: "400", label: "400m", distanceM: 400 },
  { id: "600", label: "600m", distanceM: 600 },
  { id: "800", label: "800m", distanceM: 800 },
  { id: "1000", label: "1000m", distanceM: 1000 },
  { id: "1500", label: "1500m", distanceM: 1500 },
  { id: "mile", label: "Mile", distanceM: METRES_PER_MILE },
  { id: "3000", label: "3000m", distanceM: 3000 },
  { id: "5000", label: "5000m", distanceM: 5000 },
];

export function raceDistanceById(id: string): RaceDistanceOption | undefined {
  return RACE_DISTANCES.find((distance) => distance.id === id);
}
