import { useEffect, useRef, useState } from 'react'
import { View, Image, ScrollView, Dimensions } from 'react-native'
import { tokens } from '../theme/tokens'

const { width } = Dimensions.get('window')

export function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0)
  const ref = useRef<ScrollView>(null)

  useEffect(() => {
    const id = setInterval(() => {
      const next = (index + 1) % images.length
      setIndex(next)
      ref.current?.scrollTo({ x: next * width, animated: true })
    }, 3000)
    return () => clearInterval(id)
  }, [index, images.length])

  return (
    <View>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
        {images.map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width, height: 180, resizeMode: 'cover' }} />
        ))}
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 8, width: '100%', flexDirection: 'row', justifyContent: 'center' }}>
        {images.map((_, i) => (
          <View key={i} style={{ width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: i === index ? tokens.colors.primary : tokens.colors.border }} />
        ))}
      </View>
    </View>
  )
}
