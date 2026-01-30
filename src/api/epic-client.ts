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
  productSlug?: string;
  urlSlug?: string;
  catalogItemId?: string;
  offerMappings?: Array<{
    pageSlug?: string;
    pageType?: string;
  }>;
  catalogNs?: {
    mappings?: Array<{
      pageSlug?: string;
      pageType?: string;
    }>;
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
    upcomingPromotionalOffers?: Array<{
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

    console.log(`📦 Total de elementos recebidos da Epic API: ${data.data.Catalog.searchStore.elements.length}`);

    const now = new Date();
    if (__DEV__) console.log(`🕒 Data/hora atual: ${now.toISOString()}`);

    // Processar todos os elementos e classificar como "grátis agora" ou "em breve"
    const processedGames: Array<{element: EpicGameElement, isUpcoming: boolean, startDate?: Date, endDate?: Date}> = [];

    data.data.Catalog.searchStore.elements.forEach(element => {
      // Filtrar apenas addons e bundles (manter todos os outros jogos)
      const categoryPaths = element.categories?.map(cat => cat.path) || [];

      // Excluir apenas addons e bundles explícitos
      const isAddon = categoryPaths.some(path =>
        path.includes('addons') || path.includes('bundles')
      );

      if (isAddon) return;

      // Verificar promoções ATIVAS (grátis agora)
      if (element.promotions?.promotionalOffers && element.promotions.promotionalOffers.length > 0) {
        element.promotions.promotionalOffers.forEach(offer => {
          offer.promotionalOffers.forEach(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);

            // Promoção ativa agora
            if (now >= startDate && now < endDate && element.price.totalPrice.discountPrice === 0) {
              processedGames.push({ element, isUpcoming: false, startDate, endDate });
              if (__DEV__) console.log(`✅ Grátis AGORA: "${element.title}" - até ${endDate.toISOString()}`);
            }
          });
        });
      }

      // Verificar promoções FUTURAS (em breve)
      if (element.promotions?.upcomingPromotionalOffers && element.promotions.upcomingPromotionalOffers.length > 0) {
        element.promotions.upcomingPromotionalOffers.forEach(offer => {
          offer.promotionalOffers.forEach(promo => {
            const startDate = new Date(promo.startDate);
            const endDate = new Date(promo.endDate);

            // Promoção futura
            if (now < startDate) {
              processedGames.push({ element, isUpcoming: true, startDate, endDate });
              if (__DEV__) console.log(`🔜 Em breve: "${element.title}" - a partir de ${startDate.toISOString()}`);
            }
          });
        });
      }
    });

    // Remover duplicatas (mesmo jogo pode aparecer em múltiplas promoções)
    const seenIds = new Set<string>();
    const uniqueGames = processedGames.filter(game => {
      if (seenIds.has(game.element.id)) return false;
      seenIds.add(game.element.id);
      return true;
    });

    const epicGames = uniqueGames
      .map(({ element, isUpcoming, startDate, endDate }) => {
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

        // Extrair categorias como gêneros
        const genres = element.categories?.map(cat => {
          const parts = cat.path.split('/');
          return parts[parts.length - 1].replace(/-/g, ' ');
        }).filter(g => g && g !== 'games' && g !== 'freegames') || [];

        const gameUrl = 'https://store.epicgames.com/pt-BR/free-games';

        return {
          id: element.id,
          title: element.title,
          coverUrl: offerImage?.url,
          genres: genres,
          tags: genres,
          priceFinalCents: isUpcoming ? originalPrice : discountPrice, // Em breve mostra preço original
          discountPct: isUpcoming ? 0 : discountPct,
          store: 'Epic Games',
          url: gameUrl,
          releaseDate: element.effectiveDate ? new Date(element.effectiveDate).toISOString() : undefined,
          // Campos adicionais para compatibilidade com ranking
          _id: element.id,
          game: {
            title: element.title,
            coverUrl: offerImage?.url,
            genres: genres,
            tags: genres,
            description: element.description,
            developer: element.seller?.name,
            publisher: element.seller?.name,
            keyImages: element.keyImages,
          },
          steamGenres: [],
          priceFinal: isUpcoming ? originalPrice / 100 : discountPrice / 100,
          priceBase: originalPrice / 100,
          score: 0,
          popularity: 0,
          trending: false,
          // Dados completos do elemento da Epic para uso no modal de detalhes
          description: element.description,
          developer: element.seller?.name,
          publisher: element.seller?.name,
          keyImages: element.keyImages,
          // Slugs para construir URL correta
          productSlug: element.productSlug,
          urlSlug: element.urlSlug,
          catalogNs: element.catalogNs,
          offerMappings: element.offerMappings,
          // Informação de "em breve"
          isUpcoming: isUpcoming,
          promotionStartDate: startDate?.toISOString(),
          promotionEndDate: endDate?.toISOString(),
        };
      });

    console.log(`🎮 Total de jogos grátis da Epic retornados: ${epicGames.length}`);
    epicGames.forEach((game, index) => {
      console.log(`  ${index + 1}. ${game.title} - R$ ${game.priceFinal}`);
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