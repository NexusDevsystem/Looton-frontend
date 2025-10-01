import { useEffect } from 'react';
import { Image as ExpoImage } from 'expo-image';

interface Deal {
  _id: string;
  game: {
    title: string;
    coverUrl?: string;
  };
}

interface GameWithCoverUrl {
  coverUrl?: string | null;
}

/**
 * Hook para fazer prefetch das imagens de uma lista de jogos
 * Melhora a performance do scroll evitando carregamentos desnecessários
 */
export function useImagePrefetch<T extends GameWithCoverUrl>(items: T[] | null) {
  useEffect(() => {
    if (!items || items.length === 0) return;
    
    // Faz prefetch das imagens válidas
    const urls = items
      .map(item => item.coverUrl?.trim())
      .filter((url): url is string => !!url && url.length > 0);
    
    if (urls.length === 0) return;
    
    console.log(`🖼️ Prefetch iniciado para ${urls.length} imagens`);
    
    // Prefetch em lotes para não sobrecarregar
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize));
    }
    
    // Executa prefetch dos lotes com delay
    batches.forEach((batch, index) => {
      setTimeout(() => {
        batch.forEach(url => {
          if (url) {
            ExpoImage.prefetch(url);
          }
        });
      }, index * 100); // 100ms de delay entre lotes
    });
    
  }, [items]);
}