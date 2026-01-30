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
    console.log(`🕒 Data/hora atual: ${now.toISOString()}`);

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

        // CRITÉRIO 1: Verificar se o preço atual é 0 (realmente grátis)
        const isFree = element.price.totalPrice.discountPrice === 0;

        // CRITÉRIO 2: Verificar se tem promoção ATIVA no momento (não futura)
        let hasActivePromotion = false;
        let promotionEndDate = null;

        if (element.promotions?.promotionalOffers && element.promotions.promotionalOffers.length > 0) {
          element.promotions.promotionalOffers.forEach(offer => {
            offer.promotionalOffers.forEach(promo => {
              const startDate = new Date(promo.startDate);
              const endDate = new Date(promo.endDate);

              // Verificar se a promoção está ativa AGORA
              if (now >= startDate && now < endDate) {
                hasActivePromotion = true;
                promotionEndDate = endDate;
              }
            });
          });
        }

        // Um jogo é válido se:
        // 1. É da categoria relevante (games/freegames)
        // 2. NÃO é addon ou bundle
        // 3. Está GRÁTIS (preço = 0)
        // 4. Tem promoção ATIVA no momento
        const isValid = isRelevantCategory && !isAddon && isFree && hasActivePromotion;

        // Log detalhado para debugging
        if (!isValid) {
          console.log(`🚫 Filtrando "${element.title}":`);
          console.log(`   - Categoria relevante: ${isRelevantCategory}`);
          console.log(`   - É addon/bundle: ${isAddon}`);
          console.log(`   - Preço: ${element.price.totalPrice.discountPrice}`);
          console.log(`   - É grátis (preço=0): ${isFree}`);
          console.log(`   - Tem promoção ativa: ${hasActivePromotion}`);
          if (promotionEndDate) {
            console.log(`   - Promoção termina em: ${promotionEndDate.toISOString()}`);
          }
        } else {
          console.log(`✅ Incluindo "${element.title}" - Grátis até ${promotionEndDate?.toISOString()}`);
        }

        return isValid;
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

        // Extrair categorias como gêneros
        const genres = element.categories?.map(cat => {
          const parts = cat.path.split('/');
          return parts[parts.length - 1].replace(/-/g, ' ');
        }).filter(g => g && g !== 'games' && g !== 'freegames') || [];

        // Log dos slugs disponíveis para debugging
        console.log(`🔍 Slugs para "${element.title}":`, {
          productSlug: element.productSlug,
          urlSlug: element.urlSlug,
          catalogNs: element.catalogNs,
          offerMappings: element.offerMappings,
        });

        const gameUrl = 'https://store.epicgames.com/pt-BR/free-games';

        return {
          id: element.id,
          title: element.title,
          coverUrl: offerImage?.url,
          genres: genres,
          tags: genres,
          priceFinalCents: discountPrice,
          discountPct: discountPct,
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
            description: element.description, // ✅ Adicionar descrição
            developer: element.seller?.name, // ✅ Adicionar desenvolvedor
            publisher: element.seller?.name, // ✅ Adicionar publisher
            keyImages: element.keyImages, // ✅ Adicionar todas as imagens
          },
          steamGenres: [],
          priceFinal: discountPrice / 100,
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