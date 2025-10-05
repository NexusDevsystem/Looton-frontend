import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

// 🔒 BLINDAGEM CONTRA .length CRASH
const len = (v: any) => (Array.isArray(v) ? v.length : 0);
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

export function GameCover({ imageUrls, height = 180 }: { imageUrls?: string[]; height?: number }) {
  const [idx, setIdx] = React.useState(0);
  const urls = React.useMemo(() => 
    arr(imageUrls).filter(url => url && typeof url === 'string' && url.trim() !== ''), 
    [imageUrls]
  );
  const src = urls[idx];

  React.useEffect(() => { setIdx(0); }, [urls]);

  if (len(urls) === 0) return <Placeholder h={height} />;

  return (
    <Image
      source={{ uri: src }}
      style={{ width: '100%', height, borderRadius: 16, backgroundColor: '#16314A' }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
      onError={() => {
        if (idx < len(urls) - 1) setIdx(i => i + 1);
      }}
    />
  );
}

function Placeholder({ h }: { h: number }) {
  return <View style={{ width: '100%', height: h, borderRadius: 16, backgroundColor: '#16314A' }} />;
}
