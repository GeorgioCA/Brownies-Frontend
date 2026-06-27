import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { colors, radius } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PhotoCarouselProps {
  photos: Array<{ id: number; photo_url: string; is_primary: boolean }>;
  height?: number;
  width?: number;
}

export function PhotoCarousel({ photos, height = 400, width = SCREEN_WIDTH }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <View style={[styles.placeholder, { height, width }]}>
        <View style={styles.placeholderInner}>
          <Text style={styles.placeholderText}>📷</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height, width }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={(e) => {
          const touchX = e.nativeEvent.locationX;
          if (touchX < width / 2) {
            setCurrentIndex(Math.max(0, currentIndex - 1));
          } else {
            setCurrentIndex(Math.min(photos.length - 1, currentIndex + 1));
          }
        }}
      >
        <Image
          source={{
            uri: photos[currentIndex].photo_url.startsWith('http')
              ? photos[currentIndex].photo_url
              : `http://localhost:8000${photos[currentIndex].photo_url}`,
          }}
          style={[styles.image, { height, width }]}
          resizeMode="cover"
        />
      </TouchableOpacity>
      {photos.length > 1 && (
        <View style={styles.dotsContainer}>
          {photos.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  image: { borderRadius: 0 },
  placeholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 40 },
  dotsContainer: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  dot: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: { backgroundColor: colors.white },
});
