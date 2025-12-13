import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RideDirection } from "./demo-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDirectionLabel(direction: RideDirection): string {
  switch (direction) {
    case 'to-school':
      return 'To university'
    case 'from-school':
      return 'From university'
    case 'to-train-station':
      return 'To train station'
    case 'to-tennis-center':
      return 'To Tennis Center'
    case 'back-home':
      return 'Back Home'
    default:
      return direction
  }
}

