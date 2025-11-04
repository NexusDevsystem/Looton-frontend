import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { tokens } from '../theme/tokens'

export function StoreBadge({ name }: { name: string }) {
  // Determine the icon source based on the store name
  const getIconSource = () => {
    switch (name.toLowerCase()) {
      case 'steam':
        return require('../../assets/images/steam.png')
      default:
        return null
    }
  }

  const iconSource = getIconSource()

  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: tokens.colors.chip, borderRadius: 999 }}>
      {iconSource ? (
        <Image 
          source={iconSource} 
          style={{ width: 24, height: 24 }} 
          resizeMode="contain"
        />
      ) : (
        <Text style={{ color: tokens.colors.textDim, fontSize: 12 }}>{name}</Text>
      )}
    </View>
  )
}
