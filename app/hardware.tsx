import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, RefreshControl, SafeAreaView, TextInput } from 'react-native'
import { tokens } from '../src/theme/tokens'
import { fetchPcDeals, PcOffer } from '../src/services/HardwareService'
import { PcDealCard } from '../src/components/PcDealCard'
import { CurrencyProvider } from '../src/contexts/CurrencyContext'

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

  // Debounce the search query
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 350)
    return () => clearTimeout(id)
  }, [query])

  // Phase 1: fast curated snapshot (minimal showcase)
  const loadCurated = useCallback(async () => {
    setError(null)
    try {
      const res = await fetchPcDeals({ limit: 12, store: ['terabyte'] })
      setItems(res.items || [])
    } catch (e: any) {
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
      const baseParams = { full: true as const, store: ['terabyte'] as string[], limit: pageSize, offset: page * pageSize }
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
  }, [])

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
        const res = await fetchPcDeals({ full: true, store: ['terabyte'], q: debounced, limit: pageSize, offset: 0 })
        setItems(res.items || [])
        setPage(1)
      } catch (e: any) {
        setError(e.message || 'Erro na busca')
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [debounced, loadCurated])

  // Minimal list: only Terabyte, no category chips
  const listItems = items.filter((it) => (it.store || '').toLowerCase() === 'terabyte')

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
        <Text style={{ color: tokens.colors.text, fontSize: 22, fontWeight: '800' }}>Hardware (Terabyte)</Text>
        <View style={{ marginTop: 10, marginBottom: 6 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar produto (ex: RTX 4060)"
            placeholderTextColor={tokens.colors.textDim}
            style={{ backgroundColor: tokens.colors.chip, color: tokens.colors.text, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 }}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
        </View>
        <Text style={{ color: tokens.colors.textDim, marginTop: 4 }}>Resultados atualizam conforme a busca</Text>
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
                    const res = await fetchPcDeals({ full: true, store: ['terabyte'], q: debounced, limit: pageSize, offset: 0 })
                    setItems(res.items || [])
                    setPage(1)
                  } catch {}
                  finally { setRefreshing(false) }
                })()
              } else {
                // refresh curated minimal
                loadCurated()
                setRefreshing(false)
                setPage(1)
              }
            }}
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: tokens.colors.textDim }}>Vitrine vazia. Use a busca acima para encontrar produtos específicos.</Text>
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
