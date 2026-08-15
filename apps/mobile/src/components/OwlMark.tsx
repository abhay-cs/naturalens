import Svg, { Circle, Path } from 'react-native-svg';
import { Colors } from '../theme/tokens';

interface OwlMarkProps {
  size?: number;
  color?: string;
}

/**
 * The brand mark — `packages/design/mark/owl.svg` transcribed onto its 32 grid.
 *
 * As a component rather than the rasterised `assets/mark.png` so it can take the page's
 * ink colour: white over the viewfinder, `border` grey in an empty state, black on paper.
 *
 * Stroke widens to 2.5 under 40px, per `docs/DESIGN.md` §6 — at small sizes the 2px line
 * thins out and the mark loses its shape.
 */
export function OwlMark({ size = 32, color = Colors.fg }: OwlMarkProps) {
  const strokeWidth = size < 40 ? 2.5 : 2;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={16} cy={12} r={9} />
      <Path d="M20.5,4.2C19.2,3.4,17.6,3,16,3s-3.2,0.4-4.5,1.2C14.2,5.8,16,8.7,16,12C16,8.7,17.8,5.8,20.5,4.2z" />
      <Circle cx={12} cy={12} r={1} />
      <Circle cx={20} cy={12} r={1} />
      <Path d="M16.1,21c2.2,2.3,5.4,3.8,8.9,3.8h0V12" />
      <Path d="M7,12c0,9,9.7,17,19,17" />
    </Svg>
  );
}
