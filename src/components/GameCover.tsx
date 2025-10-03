import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

export function GameCover({ imageUrls, height = 180 }: { imageUrls?: string[]; height?: number }) {
  const [idx, setIdx] = React.useState(0);
  const urls = Array.isArray(imageUrls) ? imageUrls : [];
  const src = urls[idx];

  React.useEffect(() => { setIdx(0); }, [JSON.stringify(urls)]);

  if (!urls.length) return <Placeholder h={height} />;

  return (
    <Image
      source={{ uri: src }}
      style={{ width: '100%', height, borderRadius: 16, backgroundColor: '#16314A' }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={200}
      placeholder={{ blurhash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' }}
      onError={() => {
        if (idx < urls.length - 1) setIdx(i => i + 1);
      }}
    />
  );
}

function Placeholder({ h }: { h: number }) {
  return <View style={{ width: '100%', height: h, borderRadius: 16, backgroundColor: '#16314A' }} />;
}
