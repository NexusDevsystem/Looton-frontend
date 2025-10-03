import { useEffect, useRef, useState } from 'react'
import { View, Image, ScrollView, Dimensions } from 'react-native'
import { tokens } from '../theme/tokens'

const { width } = Dimensions.get('window')

// 🔒 BLINDAGEM CONTRA .length CRASH
const len = (v: any) => (Array.isArray(v) ? v.length : 0);
const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

export function HeroCarousel({ images }: { images?: string[] }) {
  const [index, setIndex] = useState(0)
  const ref = useRef<ScrollView>(null)
  const safeImages = arr(images);

  useEffect(() => {
    if (len(safeImages) <= 1) return; // Não roda carrossel se só tem 1 imagem ou menos
    
    const id = setInterval(() => {
      const next = (index + 1) % len(safeImages)
      setIndex(next)
      ref.current?.scrollTo({ x: next * width, animated: true })
    }, 3000)
    return () => clearInterval(id)
  }, [index, len(safeImages)])

  if (len(safeImages) === 0) return null; // Não renderiza se não há imagens

  return (
    <View>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {arr(safeImages).map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width, height: 180, resizeMode: 'cover' }} />
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 8, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
        {arr(safeImages).map((_, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: i === index ? tokens.colors.primary : tokens.colors.border }} />
        ))}
      </View>
    </View>
  )
}
