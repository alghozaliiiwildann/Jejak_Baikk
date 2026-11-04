
import React from 'react';
import {
  Droplet,
  Dumbbell,
  BookOpen,
  Code,
  Leaf,
  Heart,
  Smile,
  Star,
} from 'lucide-react-native';

interface HabitIconProps {
  name: string;
  size: number;
  color: string;
}

const iconMap = {
  droplet: Droplet,
  dumbbell: Dumbbell,
  'book-open': BookOpen,
  code: Code,
  leaf: Leaf,
  heart: Heart,
  smile: Smile,
  star: Star,
};

export const HabitIcon = ({ name, size, color }: HabitIconProps) => {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Star;

  return <Icon size={size} color={color} />;
};
