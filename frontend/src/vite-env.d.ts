/// <reference types="vite/client" />

declare module 'plotly.js-dist-min' {
  const Plotly: any;
  export default Plotly;
}

declare module 'lucide-react' {
  import React from 'react';
  export interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    strokeWidth?: number | string;
    color?: string;
  }
  export type Icon = React.FC<IconProps>;
  export const Mic: Icon;
  export const MicOff: Icon;
  export const Send: Icon;
  export const Bot: Icon;
  export const User: Icon;
  export const Database: Icon;
  export const Calculator: Icon;
  export const BarChart: Icon;
  export const BarChart3: Icon;
  export const Terminal: Icon;
  export const Clock: Icon;
  export const Sparkles: Icon;
  export const ChevronDown: Icon;
  export const ChevronUp: Icon;
  export const Volume2: Icon;
  export const Maximize2: Icon;
  export const Minimize2: Icon;
  export const Download: Icon;
  export const Code2: Icon;
  export const RefreshCw: Icon;
  export const Table: Icon;
  export const X: Icon;
  export const Radio: Icon;
  export const Cpu: Icon;
  export const Activity: Icon;
  export const Users: Icon;
  export const Zap: Icon;
  export const Layers: Icon;
  export const History: Icon;
  export const ShieldCheck: Icon;
  export const ShieldAlert: Icon;
  export const VolumeX: Icon;
  export const TrendingUp: Icon;
  export const Check: Icon;
  export const Search: Icon;
  export const SlidersHorizontal: Icon;
  export const Eye: Icon;
  export const EyeOff: Icon;
  const icons: Record<string, Icon>;
  export default icons;
}
