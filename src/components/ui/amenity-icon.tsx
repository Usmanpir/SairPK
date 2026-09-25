import {
  Car,
  Check,
  Coffee,
  ConciergeBell,
  Dumbbell,
  Flame,
  Mountain,
  Plane,
  Tv,
  UtensilsCrossed,
  Waves,
  Wifi,
  Wind,
  type LucideIcon
} from 'lucide-react';

const RULES: [RegExp, LucideIcon][] = [
  [/wi-?fi|internet/i, Wifi],
  [/parking/i, Car],
  [/breakfast|coffee/i, Coffee],
  [/room service|concierge/i, ConciergeBell],
  [/mountain|view/i, Mountain],
  [/heat/i, Flame],
  [/restaurant|dining/i, UtensilsCrossed],
  [/airport|shuttle/i, Plane],
  [/pool|swim/i, Waves],
  [/gym|fitness/i, Dumbbell],
  [/tv|television/i, Tv],
  [/air ?con|ac\b/i, Wind]
];

export function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = RULES.find(([re]) => re.test(name))?.[1] ?? Check;
  return <Icon className={className} aria-hidden />;
}
