import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import type { Mood, Species } from '../lib/types';

export const SPECIES: Record<Species, { name: string; kind: string; body: string; accent: string }> = {
  flo: { name: 'Flo', kind: 'Brote', body: '#2DD4BF', accent: '#2DD4BF' },
  coco: { name: 'Coco', kind: 'Cocodrilo', body: '#4ADE80', accent: '#4ADE80' },
  leo: { name: 'Leo', kind: 'León', body: '#FCD34D', accent: '#F59E0B' },
  balam: { name: 'Balam', kind: 'Jaguar', body: '#FBBF24', accent: '#FBBF24' },
};

export const MOODS: Record<Mood, { label: string; color: string }> = {
  celebrando: { label: 'Celebrando', color: '#34D399' },
  feliz: { label: 'Feliz', color: '#2DD4BF' },
  tranquilo: { label: 'Tranquilo', color: '#60A5FA' },
  preocupado: { label: 'Preocupado', color: '#FBBF24' },
  triste: { label: 'Triste', color: '#94A3B8' },
};

const INK = '#0B1220';

function SpeciesBody({ species }: { species: Species }) {
  switch (species) {
    case 'flo':
      return (
        <G>
          <Path d="M100 62 C100 52 100 46 101 38" stroke="#22C55E" strokeWidth={4} strokeLinecap="round" fill="none" />
          <Path d="M101 42 C88 24 68 28 70 42 C82 50 95 48 101 42 Z" fill="#22C55E" />
          <Path d="M101 38 C114 20 134 24 132 38 C120 46 107 44 101 38 Z" fill="#22C55E" />
          <Ellipse cx={100} cy={122} rx={68} ry={62} fill="#2DD4BF" />
          <Ellipse cx={100} cy={142} rx={40} ry={32} fill="#CCFBF1" />
        </G>
      );
    case 'coco':
      return (
        <G>
          <Ellipse cx={100} cy={128} rx={72} ry={58} fill="#4ADE80" />
          <Circle cx={76} cy={100} r={22} fill="#4ADE80" />
          <Circle cx={124} cy={100} r={22} fill="#4ADE80" />
          <Circle cx={76} cy={108} r={15} fill="#F0FDF4" />
          <Circle cx={124} cy={108} r={15} fill="#F0FDF4" />
          <Path d="M60 150 Q100 128 140 150 Q140 178 100 180 Q60 178 60 150 Z" fill="#86EFAC" />
          <Ellipse cx={90} cy={148} rx={3.5} ry={2.5} fill="#14532D" />
          <Ellipse cx={110} cy={148} rx={3.5} ry={2.5} fill="#14532D" />
          {/* El diente chueco */}
          <Polygon points="114,166 124,166 119,178" fill="#FFFFFF" />
          <Polygon points="78,164 86,164 82,173" fill="#FFFFFF" />
          <Circle cx={60} cy={132} r={4} fill="#22C55E" />
          <Circle cx={146} cy={126} r={5} fill="#22C55E" />
          <Circle cx={138} cy={140} r={3} fill="#22C55E" />
        </G>
      );
    case 'leo':
      return (
        <G>
          <Circle cx={100} cy={118} r={76} fill="#D97706" />
          {[
            [46, 70, 20],
            [154, 70, 20],
            [34, 122, 20],
            [166, 122, 20],
            [54, 170, 18],
            [146, 170, 18],
          ].map(([cx, cy, r]) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="#D97706" />
          ))}
          <Path d="M92 44 Q96 26 104 38 Q108 24 114 42" stroke="#B45309" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Circle cx={62} cy={76} r={14} fill="#FCD34D" />
          <Circle cx={138} cy={76} r={14} fill="#FCD34D" />
          <Circle cx={62} cy={76} r={7} fill="#F59E0B" />
          <Circle cx={138} cy={76} r={7} fill="#F59E0B" />
          <Ellipse cx={100} cy={122} rx={58} ry={54} fill="#FCD34D" />
          <Ellipse cx={100} cy={144} rx={30} ry={22} fill="#FEF3C7" />
          <Path d="M92 126 Q100 121 108 126 Q100 135 92 126 Z" fill="#7C2D12" />
        </G>
      );
    case 'balam':
      return (
        <G>
          <Circle cx={50} cy={74} r={20} fill="#F59E0B" />
          <Circle cx={150} cy={74} r={20} fill="#F59E0B" />
          <Circle cx={50} cy={74} r={10} fill="#78350F" />
          <Circle cx={150} cy={74} r={10} fill="#78350F" />
          <Ellipse cx={100} cy={122} rx={68} ry={62} fill="#FBBF24" />
          <Circle cx={78} cy={78} r={6} fill="none" stroke="#78350F" strokeWidth={3} />
          <Circle cx={100} cy={70} r={5} fill="#78350F" />
          <Circle cx={122} cy={78} r={6} fill="none" stroke="#78350F" strokeWidth={3} />
          <Circle cx={48} cy={118} r={5} fill="#78350F" />
          <Circle cx={152} cy={118} r={5} fill="#78350F" />
          <Circle cx={56} cy={148} r={6} fill="none" stroke="#78350F" strokeWidth={3} />
          <Circle cx={144} cy={148} r={6} fill="none" stroke="#78350F" strokeWidth={3} />
          <Ellipse cx={100} cy={146} rx={32} ry={22} fill="#FEF3C7" />
          <Path d="M92 128 Q100 123 108 128 Q100 137 92 128 Z" fill="#7C2D12" />
        </G>
      );
  }
}

/** La mascota dibujada en SVG; la cara cambia con el humor de tus finanzas. */
export function Mascot({ species, mood, size = 160 }: { species: Species; mood: Mood; size?: number }) {
  const body = SPECIES[species].body;
  const celebrating = mood === 'celebrando';
  const worried = mood === 'preocupado';
  const happyEyes = celebrating || mood === 'feliz';

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      accessibilityLabel={`${SPECIES[species].name}, ${SPECIES[species].kind.toLowerCase()}, ${MOODS[mood].label.toLowerCase()}`}
    >
      {celebrating && (
        <G>
          <Rect x={22} y={30} width={8} height={8} rx={2} fill="#FBBF24" transform="rotate(20 26 34)" />
          <Rect x={168} y={40} width={8} height={8} rx={2} fill="#FB7185" transform="rotate(-15 172 44)" />
          <Circle cx={30} cy={80} r={4} fill="#60A5FA" />
          <Circle cx={172} cy={86} r={4} fill="#34D399" />
          <Rect x={150} y={14} width={6} height={12} rx={2} fill="#A78BFA" transform="rotate(30 153 20)" />
          <Rect x={44} y={12} width={6} height={12} rx={2} fill="#5EE0C8" transform="rotate(-30 47 18)" />
        </G>
      )}
      <Ellipse cx={100} cy={190} rx={52} ry={6} fill="rgba(0,0,0,0.25)" />
      {celebrating ? (
        <G>
          <Ellipse cx={30} cy={96} rx={11} ry={17} fill={body} transform="rotate(-30 30 96)" />
          <Ellipse cx={170} cy={96} rx={11} ry={17} fill={body} transform="rotate(30 170 96)" />
        </G>
      ) : (
        <G>
          <Ellipse cx={36} cy={150} rx={12} ry={16} fill={body} transform="rotate(25 36 150)" />
          <Ellipse cx={164} cy={150} rx={12} ry={16} fill={body} transform="rotate(-25 164 150)" />
        </G>
      )}

      <SpeciesBody species={species} />
      {species === 'balam' && mood === 'feliz' && <Ellipse cx={106} cy={152} rx={6} ry={8} fill="#FB7185" />}

      <Ellipse cx={62} cy={130} rx={10} ry={6} fill="#FB7185" opacity={0.45} />
      <Ellipse cx={138} cy={130} rx={10} ry={6} fill="#FB7185" opacity={0.45} />

      {happyEyes ? (
        <G stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none">
          <Path d="M66 112 Q76 100 86 112" />
          <Path d="M114 112 Q124 100 134 112" />
        </G>
      ) : (
        <G>
          <Ellipse cx={76} cy={110} rx={9} ry={11} fill={INK} />
          {/* Un ojo más chico cuando está preocupado: la cara chistosa */}
          <Ellipse cx={124} cy={110} rx={worried ? 6 : 9} ry={worried ? 7 : 11} fill={INK} />
          <Circle cx={79} cy={106} r={3.5} fill="#FFFFFF" />
          <Circle cx={127} cy={106} r={3.5} fill="#FFFFFF" />
        </G>
      )}

      {worried && (
        <G stroke={INK} strokeWidth={4} strokeLinecap="round">
          <Path d="M66 90 L84 95" />
          <Path d="M134 90 L116 95" />
        </G>
      )}
      {mood === 'triste' && (
        <G stroke={INK} strokeWidth={4} strokeLinecap="round">
          <Path d="M66 96 L84 90" />
          <Path d="M134 96 L116 90" />
        </G>
      )}
      {worried && <Path d="M154 88 C150 96 150 102 154 104 C158 102 158 96 154 88 Z" fill="#93C5FD" />}
      {mood === 'triste' && <Path d="M70 124 C66 132 66 138 70 140 C74 138 74 132 70 124 Z" fill="#93C5FD" />}

      {(mood === 'feliz' || mood === 'tranquilo') && (
        <Path d="M88 136 Q100 150 112 136" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />
      )}
      {worried && (
        <Path d="M86 142 Q93 136 100 142 Q107 148 114 142" stroke={INK} strokeWidth={4.5} strokeLinecap="round" fill="none" />
      )}
      {mood === 'triste' && <Path d="M88 148 Q100 136 112 148" stroke={INK} strokeWidth={5} strokeLinecap="round" fill="none" />}
      {celebrating && <Path d="M84 134 Q100 134 116 134 Q114 156 100 156 Q86 156 84 134 Z" fill={INK} />}
    </Svg>
  );
}

/** Lo que dice la mascota en la pantalla de inicio. */
export function mascotMessage(species: Species, mood: Mood) {
  const name = SPECIES[species].name;
  const lines: Record<Mood, string> = {
    celebrando: '¡Lo lograste! Completaste una meta.',
    feliz: '¡Vamos muy bien este mes!',
    tranquilo: 'Todo en orden, sigamos así.',
    preocupado: 'Ojo: un presupuesto ya va arriba del 90%.',
    triste: 'Este mes salió más de lo que entró. ¿Armamos un plan?',
  };
  return `${name}: ${lines[mood]}`;
}
