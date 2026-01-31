import React, { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLists } from '../hooks/useLists'
import { FavoritesService } from '../services/FavoritesService'
import { List } from '../types'
import { SimpleToast } from './SimpleToast'

interface AddToListModalProps {
  visible: boolean
  onClose: () => void
  gameId: string
  gameTitle: string
  userId: string
}

export function AddToListModal({ visible, onClose, gameId, gameTitle, userId }: AddToListModalProps) {
  const { lists, createList, addGameToList } = useLists(userId)
  const [newListName, setNewListName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [desiredPrice, setDesiredPrice] = useState('')
  const [pctThreshold, setPctThreshold] = useState<string>('')
  const [storesSelected, setStoresSelected] = useState<{ steam: boolean }>({ steam: true })

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Erro', 'Digite um nome para a lista')
      return
    }

    try {
      setLoading(true)
      const newList = await createList(newListName.trim())
      await addGameToList(newList._id, gameId)
      // create/update favorite on server with desired price / pctThreshold
        // Fire-and-forget favorite creation but show a spinner + toast while it runs
        ;(async () => {
          // Validate userId looks like a Mongo ObjectId before calling server
          const isValidObjectId = (id: any) => typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id)
          if (!isValidObjectId(userId)) {
            // Not authenticated / mock user - skip server call and inform user
            setToastMessage('Favorito salvo localmente')
            return
          }

          try {
            setFavLoading(true)
            const desiredCents = desiredPrice ? Math.round(parseFloat(desiredPrice.replace(',', '.')) * 100) : undefined
            const pct = pctThreshold ? Number(pctThreshold) : undefined
            const stores: string[] = []
            if (storesSelected.steam) stores.push('steam')
            await FavoritesService.addFavorite(userId, gameId, { desiredPriceCents: desiredCents, pctThreshold: pct, listId: newList._id, stores })
            setToastMessage('Favorito criado com sucesso')
          } catch (err) {
            console.warn('Falha ao criar favorito apÃ³s criar lista', err)
            setToastMessage('Falha ao criar favorito')
          } finally {
            setFavLoading(false)
          }
        })()
      Alert.alert('Sucesso', `Jogo adicionado Ã  lista "${newList.name}"`)
      setNewListName('')
      setShowCreateForm(false)
      onClose()
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao criar lista'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleAddToExistingList = async (list: List) => {
    try {
      setLoading(true)
      await addGameToList(list._id, gameId)
      // create/update favorite on server with desired price / pctThreshold
      ;(async () => {
        try {
          setFavLoading(true)
          const desiredCents = desiredPrice ? Math.round(parseFloat(desiredPrice.replace(',', '.')) * 100) : undefined
          const pct = pctThreshold ? Number(pctThreshold) : undefined
          const stores: string[] = []
          if (storesSelected.steam) stores.push('steam')
          await FavoritesService.addFavorite(userId, gameId, { desiredPriceCents: desiredCents, pctThreshold: pct, listId: list._id, stores })
          setToastMessage('Favorito criado com sucesso')
        } catch (err) {
          console.warn('Falha ao criar favorito ao adicionar Ã  lista', err)
          setToastMessage('Falha ao criar favorito')
        } finally {
          setFavLoading(false)
        }
      })()

      Alert.alert('Sucesso', `Jogo adicionado Ã  lista "${list.name}"`)
      onClose()
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao adicionar Ã  lista'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#eee'
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: '#333',
              flex: 1
            }}>
              Adicionar Ã  Lista
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Game Title */}
          <View style={{ padding: 16, backgroundColor: '#f8f8f8' }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: '#333',
              textAlign: 'center'
            }}>
              {gameTitle}
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1 }}>
            {/* Create New List Section */}
            <View style={{ padding: 16 }}>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>PreÃ§o desejado (opcional)</Text>
                <TextInput
                  value={desiredPrice}
                  onChangeText={setDesiredPrice}
                  placeholder="Ex: 29,99"
                  keyboardType="numeric"
                  style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginBottom: 8 }}
                />
                <Text style={{ fontSize: 14, color: '#333', marginBottom: 6 }}>Margem (%) para notificar (opcional)</Text>
                <TextInput
                  value={pctThreshold}
                  onChangeText={setPctThreshold}
                  placeholder="Ex: 20"
                  keyboardType="numeric"
                  style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8 }}
                />
                <View style={{ flexDirection: 'row', marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#333', marginRight: 12 }}>Lojas:</Text>
                  <TouchableOpacity onPress={() => setStoresSelected(s => ({ ...s, steam: !s.steam }))} style={{ padding: 8, backgroundColor: storesSelected.steam ? '#3B82F6' : '#F0F0F0', borderRadius: 8, marginRight: 8 }}>
                    <Text style={{ color: storesSelected.steam ? '#032617' : '#333' }}>Steam</Text>
                  </TouchableOpacity>

                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateForm(!showCreateForm)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 8,
                  marginBottom: 16
                }}
              >
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                <Text style={{
                  marginLeft: 12,
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#007AFF'
                }}>
                  Criar Nova Lista
                </Text>
              </TouchableOpacity>

              {showCreateForm && (
                <View style={{
                  backgroundColor: '#fff',
                  padding: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#eee',
                  marginBottom: 16
                }}>
                  <TextInput
                    value={newListName}
                    onChangeText={setNewListName}
                    placeholder="Nome da nova lista"
                    style={{
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 16,
                      marginBottom: 12
                    }}
                    maxLength={100}
                    autoFocus
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowCreateForm(false)
                        setNewListName('')
                      }}
                      style={{
                        flex: 1,
                        padding: 12,
                        backgroundColor: '#f0f0f0',
                        borderRadius: 8,
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#666', fontWeight: '600' }}>
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateList}
                      disabled={loading || !newListName.trim()}
                      style={{
                        flex: 1,
                        padding: 12,
                        backgroundColor: loading || !newListName.trim() ? '#ccc' : '#007AFF',
                        borderRadius: 8,
                        alignItems: 'center'
                      }}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={{
                          color: '#fff',
                          fontWeight: '600'
                        }}>
                          Criar e Adicionar
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Existing Lists */}
            <View style={{ padding: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#333',
                marginBottom: 16
              }}>
                Minhas Listas
              </Text>

              {lists.length === 0 ? (
                <Text style={{
                  fontSize: 16,
                  color: '#666',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  marginTop: 32
                }}>
                  VocÃª ainda nÃ£o tem listas.{'\n'}
                  Crie sua primeira lista acima!
                </Text>
              ) : (
                lists.map((list) => (
                  <TouchableOpacity
                    key={list._id}
                    onPress={() => handleAddToExistingList(list)}
                    disabled={loading}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 16,
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#eee',
                      marginBottom: 8
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {list.name}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: '#666',
                        marginTop: 2
                      }}>
                        {list.itemCount || 0} {(list.itemCount || 0) === 1 ? 'jogo' : 'jogos'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        </View>
        {favLoading && (
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        <SimpleToast message={toastMessage} visible={!!toastMessage} onHidden={() => setToastMessage(null)} />
      </SafeAreaView>
    </Modal>
  )
}

import { StyleSheet } from 'react-native'
