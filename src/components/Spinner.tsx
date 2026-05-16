import { useEffect, useState } from 'react';
import { Text, View, type ViewStyle, type StyleProp } from 'react-native';

const SCAN_FRAMES = ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'];

interface SpinnerProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function ScanSpinner({ size = 20, color = '#fff', style }: SpinnerProps) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((i) => (i + 1) % SCAN_FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size, color, textAlign: 'center', lineHeight: size * 1.3 }}>
        {SCAN_FRAMES[frame]}
      </Text>
    </View>
  );
}
