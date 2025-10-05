import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, SafeAreaView, TextInput, Pressable } from 'react-native'
import { tokens } from '../src/theme/tokens'
import { fetchPcDeals, PcOffer } from '../src/services/HardwareService'
import { PcDealCard } from '../src/components/PcDealCard'
import { CurrencyProvider } from '../src/contexts/CurrencyContext'
import { API_URL } from '../src/api/client'

// Old inline card removed in favor of PcDealCard

export function HardwareInner() {
  const [items, setItems] = useState<PcOffer[]>([])
  const [page, setPage] = useState(0)
  const pageSize = 60
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce the search query with improved timing and normalization
  useEffect(() => {
    const id = setTimeout(() => {
      const trimmed = query.trim()
      // Normalizar a consulta para melhorar a busca
      const normalized = trimmed
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remover acentos
        .toLowerCase()
      setDebounced(normalized)
    }, 300)
    return () => clearTimeout(id)
  }, [query])

  // Carregar ofertas curadas com mais itens
  const loadCurated = useCallback(async () => {
    setError(null)
    try {
      // Carregar mais itens iniciais para ter um feed melhor
      const res = await fetchPcDeals({ limit: 30, full: true })
      console.log('Carregou ofertas curadas:', res.items?.length || 0)
      setItems(res.items || [])
    } catch (e: any) {
      console.error('Erro ao carregar ofertas curadas:', e)
      setError(e.message || 'Erro ao carregar ofertas')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Initial load: curated only; don't auto-fetch the full catalog
  useEffect(() => {
    loadCurated()
    setPage(1)
  }, [loadCurated])

  // When search changes, reset and fetch first page of results; clearing search restores curated
  useEffect(() => {
    setItems([])
    setPage(0)
    if (!debounced) {
      setLoading(true)
      loadCurated()
      setPage(1)
      return
    }
    ;(async () => {
      setLoading(true)
      try {
        console.log('Fazendo busca com:', debounced, 'URL:', `${API_URL}/pc-deals`)
        // Melhorar a busca usando parâmetros mais flexíveis
        const res = await fetchPcDeals({ full: true, q: debounced, limit: pageSize, offset: 0 })
        console.log('Resposta da busca:', res)
        setItems(res.items || [])
        setPage(1)
      } catch (e: any) {
        console.error('Erro na busca de hardware:', e)
        setError(e.message || 'Erro na busca')
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [debounced, loadCurated])

  // Debug: log items and search to see what's being returned
  console.log('Hardware search:', debounced, 'items:', items.length, 'first item:', items[0]?.title)
  console.log('API_URL being used:', API_URL)
  
  // Mostrar todos os itens - remover filtro restritivo de loja
  let listItems = items

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '800' }}>Hardware</Text>
        <View style={{ marginTop: 10, marginBottom: 6 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar hardware (ex: RTX 4060, i5, SSD, fonte, memoria)"
            placeholderTextColor={tokens.colors.textDim}
            style={{ backgroundColor: tokens.colors.chip, color: tokens.colors.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        <Text style={{ color: tokens.colors.textDim, marginTop: 4, fontSize: 12 }}>
          {debounced 
            ? `Buscando por "${debounced}"... Encontrados ${listItems.length} produtos`
            : 'Digite para buscar produtos específicos como "RTX 4060", "i5", "SSD", "fonte", etc.'
          }
        </Text>
      </View>
      {error && <Text style={{ color: 'tomato', paddingHorizontal: 16 }}>{error}</Text>}
      <FlatList
        data={listItems}
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
                loadCurated().finally(() => {
                  setRefreshing(false)
                  setPage(1)
                })
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
                ? `Nenhum produto encontrado para "${debounced}". Tente termos como:\n• GPUs: "4060", "RTX", "RX 6600"\n• CPUs: "i5", "Ryzen 5", "processador"\n• Outros: "SSD", "memória", "fonte"`
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
        ) : null}
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
