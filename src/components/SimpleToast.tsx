import React, { useEffect, useRef } from 'react'
import { Animated, Text, View, StyleSheet } from 'react-native'

interface SimpleToastProps {
  message?: string | null
  visible: boolean
  duration?: number
  onHidden?: () => void
}

export function SimpleToast({ message, visible, duration = 3000, onHidden }: SimpleToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | undefined
    if (visible && message) {
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start()
      hideTimer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
          onHidden && onHidden()
        })
      }, duration)
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start()
    }
    return () => {
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [visible, message, duration, opacity, onHidden])

  if (!message) return null

  return (
    <Animated.View pointerEvents="none" style={[styles.container, { opacity }]}> 
      <View style={styles.toast}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    backgroundColor: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '90%'
  },
  text: {
    color: '#fff',
    fontSize: 14,
  }
})
