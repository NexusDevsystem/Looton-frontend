import { GameItem } from '../hooks/useGameFeed';

// Interface para a resposta da API da Epic Games
interface EpicGamesResponse {
  data: {
    Catalog: {
      searchStore: {
        elements: EpicGameElement[];
        paging: {
          count: number;
          total: number;
        };
      };
    };
  };
  errors?: Array<{
    message: string;
    status?: number;
  }>;
}

interface EpicGameElement {
  title: string;
  id: string;
  namespace: string;
  description: string;
  effectiveDate?: string;
  keyImages: Array<{
    type: string;
    url: string;
  }>;
  seller: {
    id: string;
    name: string;
  };
  price: {
    totalPrice: {
      discountPrice: number;
      originalPrice: number;
      discount: number;
      currencyCode: string;
      fmtPrice: {
        originalPrice: string;
        discountPrice: string;
        intermediatePrice: string;
      };
    };
  };
  promotions?: {
    promotionalOffers?: Array<{
      promotionalOffers: Array<{
        startDate: string;
        endDate: string;
        discountSetting: {
          discountType: string;
          discountPercentage: number;
        };
      }>;
    }>;
  };
  categories: Array<{
    path: string;
  }>;
}

// Função para buscar jogos da Epic Games
export async function fetchEpicGames(): Promise<GameItem[]> {
  try {
    const response = await fetch(
      'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=pt-BR&country=BR&allowCountries=BR',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; LootonApp)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: EpicGamesResponse = await response.json();

    if (data.errors && data.errors.length > 0) {
      console.log('Erros na resposta da Epic Games:', data.errors);
      // Continuar com os dados disponíveis mesmo que haja alguns erros
    }

    if (!data.data?.Catalog?.searchStore?.elements) {
      return [];
    }

    const epicGames = data.data.Catalog.searchStore.elements
      .filter(element => {
        // Filtrar por categorias relevantes (excluir addons, bundles se necessário)
        const categoryPaths = element.categories?.map(cat => cat.path) || [];
        const isRelevantCategory = categoryPaths.some(path => 
          path.includes('games') || path.includes('freegames')
        );
        
        // Excluir addons e bundles se desejado
        const isAddon = categoryPaths.some(path => 
          path.includes('addons') || path.includes('bundles')
        );
        
        return isRelevantCategory && !isAddon;
      })
      .map(element => {
        // Encontrar a imagem principal
        const offerImage = element.keyImages.find(img => 
          img.type === 'OfferImageWide' || img.type === 'Thumbnail'
        );
        
        // Calcular desconto percentual
        const originalPrice = element.price.totalPrice.originalPrice;
        const discountPrice = element.price.totalPrice.discountPrice;
        const discountPct = originalPrice > 0 
          ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) 
          : 0;

        return {
          id: element.id,
          title: element.title,
          coverUrl: offerImage?.url,
          genres: [], // A API da Epic não fornece gêneros diretamente
          tags: [], // A API da Epic não fornece tags diretamente
          priceFinalCents: discountPrice,
          discountPct: discountPct,
          store: 'Epic Games',
          url: `https://store.epicgames.com/p/${element.id}`,
          releaseDate: element.effectiveDate ? new Date(element.effectiveDate).toISOString() : undefined,
          // Campos adicionais para compatibilidade com ranking
          _id: element.id,
          game: {
            title: element.title,
            coverUrl: offerImage?.url,
            genres: [],
            tags: []
          },
          steamGenres: [],
          priceFinal: discountPrice / 100,
          priceBase: originalPrice / 100,
          score: 0,
          popularity: 0,
          trending: false,
        };
      });

    return epicGames;
  } catch (error) {
    console.error('Erro ao buscar jogos da Epic Games:', error);
    return [];
  }
}

// Função para converter preço da Epic Games (em centavos) para o formato esperado
export function convertEpicPrice(priceInCents: number): number {
  return Math.round(priceInCents);
}