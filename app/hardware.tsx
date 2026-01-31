import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, SafeAreaView, TextInput, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { tokens } from '../src/theme/tokens'
import { fetchPcDeals, PcOffer } from '../src/services/HardwareService'
import { PcDealCard } from '../src/components/PcDealCard'
import { CurrencyProvider } from '../src/contexts/CurrencyContext'
import { SmartHardwareSearch } from '../src/services/SmartHardwareSearch'
import { LocalHardwareCacheService } from '../src/services/LocalHardwareCacheService'
import { LinearGradient } from 'expo-linear-gradient'

// Old inline card removed in favor of PcDealCard

export function HardwareInner() {
  const [items, setItems] = useState<PcOffer[]>([])
  const [allItems, setAllItems] = useState<PcOffer[]>([]) // Base para busca client-side
  const [aliexpressItems, setAliexpressItems] = useState<PcOffer[]>([]) // Promoções do AliExpress
  const [loadingAliexpress, setLoadingAliexpress] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 60
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce the search query
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query.trim())
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  // Carregar promoções do AliExpress especificamente
  const loadAliexpressDeals = useCallback(async () => {
    console.log('🛒 Carregando promoções do AliExpress...')
    setLoadingAliexpress(true)
    try {
      // Buscar apenas produtos do AliExpress
      const res = await fetchPcDeals({ limit: 20, full: true, store: ['aliexpress'] })
      const aliItems = (res.items || [])
        .filter(item => item.store.toLowerCase() === 'aliexpress')
        .sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0)) // Ordenar por maior desconto
        .slice(0, 10) // Top 10 promoções

      setAliexpressItems(aliItems)
      console.log('✅ Carregou', aliItems.length, 'promoções do AliExpress')
    } catch (e) {
      console.error('❌ Erro ao carregar promoções do AliExpress:', e)
    } finally {
      setLoadingAliexpress(false)
    }
  }, [])

  // Tentar carregar dados do cache local primeiro
  const loadFromCache = useCallback(async () => {
    try {
      const cachedItems = await LocalHardwareCacheService.getFromCache();
      if (cachedItems && cachedItems.length > 0) {
        setAllItems(cachedItems);
        setItems(cachedItems.slice(0, 30));

        // Também extrair itens do AliExpress do cache
        const aliItems = cachedItems
          .filter(item => item.store.toLowerCase() === 'aliexpress')
          .sort((a, b) => (b.discountPct || 0) - (a.discountPct || 0))
          .slice(0, 10)
        if (aliItems.length > 0) {
          setAliexpressItems(aliItems)
          setLoadingAliexpress(false)
        }

        return true;
      }
    } catch (error) {
      console.error('Erro ao carregar do cache:', error);
    }
    return false;
  }, []);

  // Carregar todos os itens do backend (para busca client-side ultra-rápida)
  const loadCurated = useCallback(async () => {
    console.log('🔄 Iniciando carregamento de produtos de hardware...')
    setError(null)
    setLoading(true)
    
    // Primeiro, tentar carregar do cache para mostrar algo imediatamente
    const hasCache = await loadFromCache();
    if (hasCache) {
      setLoading(false);
    }

    try {
      // Carregar MUITOS itens do backend para ter base grande de busca inteligente
      const res = await fetchPcDeals({ limit: 500, full: true })
      console.log('✅ Carregou', res.items?.length || 0, 'produtos para busca inteligente')
      setAllItems(res.items || [])
      setItems(res.items?.slice(0, 30) || []) // Mostrar primeiros 30
      
      // Salvar no cache local para uso futuro
      if (res.items && res.items.length > 0) {
        await LocalHardwareCacheService.saveToCache(res.items);
      }
    } catch (e: any) {
      console.error('❌ Erro ao carregar produtos do backend:', e)
      setError(e.message || 'Erro ao carregar produtos')
      
      // Se o backend falhar, tentar usar dados do cache mesmo que antigos
      const cachedItems = await LocalHardwareCacheService.getFromCache();
      if (cachedItems && cachedItems.length > 0) {
        setAllItems(cachedItems);
        setItems(cachedItems.slice(0, 30));
        setError(null); // Limpar erro se tivermos fallback
        console.log('✅ Usando dados de fallback do cache local');
      } else {
        // Fallback final com dados mínimos
        try {
          const res = await fetchPcDeals({ limit: 100, full: false })
          setAllItems(res.items || [])
          setItems(res.items?.slice(0, 30) || [])
          
          // Salvar no cache se for bem-sucedido
          if (res.items && res.items.length > 0) {
            await LocalHardwareCacheService.saveToCache(res.items);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback falhou:', fallbackError)
        }
      }
    } finally {
      setLoading(false)
      console.log('✅ Carregamento de hardware finalizado')
    }
  }, [loadFromCache])

  // Phase 2: paginate search results and append (only when searching)
  const loadMore = useCallback(async () => {
    try {
      if (!debounced) return // do not load more unless searching
      const baseParams = { full: true as const, limit: pageSize, offset: page * pageSize }
      const res = await fetchPcDeals({ ...baseParams, q: debounced })
      const next = res.items || []
      if (next.length) {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.ean || p.sku || p.url))
          const merged = [...prev]
          for (const it of next) {
            const k = it.ean || it.sku || it.url
            if (!seen.has(k)) { seen.add(k); merged.push(it) }
          }
          return merged
        })
        setPage((p) => p + 1)
      }
    } catch {}
    finally {
      setRefreshing(false)
    }
  }, [debounced, page, pageSize])

  // Initial load: curated only
  useEffect(() => {
    // Primeiro tentar carregar do cache para mostrar algo imediatamente
    loadFromCache().then(() => {
      // Depois carregar do backend para atualizar os dados
      loadCurated();
      loadAliexpressDeals(); // Carregar promoções do AliExpress
    });
    setPage(1)
  }, []) // Remove loadCurated dependency to ensure it runs only once on mount

  // Aplicar busca inteligente client-side quando query mudar
  useEffect(() => {
    if (!debounced) {
      // Sem busca, mostrar primeiros itens do allItems
      setItems(allItems.slice(0, 30))
      return
    }

    console.log('🔍 Buscando:', debounced)
    
    // Aplicar busca inteligente com scoring
    const results = SmartHardwareSearch.searchAndScore(allItems, debounced)
    
    console.log(`✨ ${results.length} resultados encontrados${results.length > 0 ? `. Top 3: ${results.slice(0, 3).map(r => `${r.title.substring(0, 30)}... (${r.searchScore.toFixed(1)})`).join(', ')}` : ''}`)
    
    setItems(results)
  }, [debounced, allItems])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '800' }}>Hardware</Text>
        <View style={{ marginTop: 10, marginBottom: 6 }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tokens.colors.chip,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 10
          }}>
            <Ionicons name="search-outline" size={18} color={tokens.colors.textDim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar hardware (GPU, CPU, RTX, Ryzen, SSD...)"
              placeholderTextColor={tokens.colors.textDim}
              style={{
                flex: 1,
                color: tokens.colors.text,
                paddingHorizontal: 8,
                paddingVertical: 0
              }}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        </View>
        <Text style={{ color: tokens.colors.textDim, marginTop: 4, fontSize: 12 }}>
          {loading
            ? 'Carregando produtos...'
            : debounced
              ? `🎯 ${items.length} produto${items.length !== 1 ? 's' : ''} encontrado${items.length !== 1 ? 's' : ''} para "${debounced}"`
              : `${allItems.length} produtos disponíveis • Busca inteligente ativa`
          }
        </Text>
      </View>

      {/* Seção de Promoções do AliExpress - DESTAQUE */}
      {!debounced && aliexpressItems.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <LinearGradient
            colors={['#FF6B00', '#FF8F00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              marginHorizontal: 16,
              borderRadius: 12,
              padding: 12,
              marginBottom: 8
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="flame" size={20} color="#FFFFFF" />
                <Text style={{
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: '800',
                  marginLeft: 8
                }}>
                  Promoções AliExpress
                </Text>
              </View>
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.3)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                  ATÉ {Math.max(...aliexpressItems.map(i => i.discountPct || 0))}% OFF
                </Text>
              </View>
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 4, opacity: 0.95 }}>
              Os melhores preços internacionais • Frete grátis
            </Text>
          </LinearGradient>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 12 }}
          >
            {aliexpressItems.map((item, index) => (
              <View key={`aliexpress-${index}-${item.sku || item.url}`} style={{ width: 180 }}>
                <PcDealCard item={item} variant="grid" />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {error && <Text style={{ color: 'tomato', paddingHorizontal: 16 }}>{error}</Text>}
      <FlatList
        data={items}
        keyExtractor={(it, idx) => `${it.store}-${it.ean || it.sku || it.url}-${idx}`}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 24, gap: 12 }}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <PcDealCard item={item} variant="grid" />
          </View>
        )}
        onEndReachedThreshold={0.4}
        onEndReached={() => { if (debounced && !refreshing) { setRefreshing(true); loadMore() } }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              setPage(0)
              setItems([])
              if (debounced) {
                // refresh first page of search
                ;(async () => {
                  try {
                    const res = await fetchPcDeals({ full: true, q: debounced, limit: pageSize, offset: 0 })
                    setItems(res.items || [])
                    setPage(1)
                  } catch (error) {
                    console.error('Erro ao atualizar busca:', error)
                  } finally {
                    setRefreshing(false)
                  }
                })()
              } else {
                // refresh curated minimal
                loadCurated()
                loadAliexpressDeals() // Atualizar também as promoções do AliExpress
                setRefreshing(false)
                setPage(1)
              }
            }}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: tokens.colors.text, fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              {debounced ? 'Nenhum produto encontrado' : 'Nenhuma oferta disponível'}
            </Text>
            <Text style={{ color: tokens.colors.textDim, textAlign: 'center', lineHeight: 20, marginBottom: 12 }}>
              {debounced 
                ? `Nenhum produto encontrado para "${debounced}". Tente termos como:\n• GPUs: "GPU", "4060", "RTX", "RX 6600", "placa de video"\n• CPUs: "CPU", "i5", "Ryzen 5", "processador"\n• Outros: "SSD", "memória", "fonte"`
                : 'As ofertas de hardware são atualizadas a cada 30 minutos. Puxe para baixo para tentar novamente ou use a busca acima.'
              }
            </Text>
            {!debounced && (
              <Pressable style={{ 
                backgroundColor: tokens.colors.chip,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8
              }} onPress={() => {
                setRefreshing(true)
                loadCurated()
                setRefreshing(false)
              }}>
                <Text style={{ 
                  color: tokens.colors.primary, 
                  fontSize: 14, 
                  textAlign: 'center'
                }}>
                  🔄 Atualizar Agora
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={{ padding: 50, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <Text style={{ color: tokens.colors.textDim, marginTop: 16, fontSize: 14 }}>
              Carregando produtos...
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default function HardwareScreen() {
  // ensure CurrencyProvider context exists like in Home
  return (
    <CurrencyProvider>
      <HardwareInner />
    </CurrencyProvider>
  )
}
