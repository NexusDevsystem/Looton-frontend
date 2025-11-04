/**
 * PreferencesOnboarding
 * Onboarding de seleção de preferências de gêneros
 * - Seleção de gêneros favoritos (chips)
 * - Busca
 * - Subpreferências opcionais
 * - i18n e acessibilidade
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { GENRES, GenreSlug, SubPreferences } from '../types/preferences';
import * as PreferencesService from '../services/PreferencesService';
import { showToast } from '../utils/SimpleToast';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface PreferencesOnboardingProps {
  visible: boolean;
  onComplete: () => void;
  userId?: string;
}

export const PreferencesOnboarding: React.FC<PreferencesOnboardingProps> = ({
  visible,
  onComplete,
  userId,
}) => {
  const { t, language } = useLanguage();
  const [selectedGenres, setSelectedGenres] = useState<GenreSlug[]>([]);
  const [saving, setSaving] = useState(false);
  
  // Telemetria
  const logEvent = (event: string, data?: any) => {
    console.log(`[Telemetry] ${event}`, data);
    // TODO: Integrar com sistema de analytics real
  };
  
  // Toggle gênero
  const toggleGenre = (slug: GenreSlug) => {
    setSelectedGenres((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };
  
  // Validação
  const canContinue = selectedGenres.length >= 1;
  
  // Pular agora
  const handleSkip = async () => {
    logEvent('onboarding_skipped');
    
    // Marcar como completado mesmo pulando
    try {
      await PreferencesService.completeOnboarding([], {}, userId);
    } catch (error) {
      console.error('Erro ao pular onboarding:', error);
    }
    
    onComplete();
  };
  
  // Salvar preferências
  const handleSave = async () => {
    if (!canContinue) return;
    
    try {
      setSaving(true);
      logEvent('onboarding_saving', {
        genresCount: selectedGenres.length,
      });
      
      // Salvar
      await PreferencesService.completeOnboarding(
        selectedGenres,
        {},
        userId
      );
      
      logEvent('onboarding_completed', {
        genresCount: selectedGenres.length,
      });
      
      showToast(t('onboarding.saved'));
      onComplete();
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      showToast('Erro ao salvar preferências');
    } finally {
      setSaving(false);
    }
  };
  
  // Renderizar label do gênero
  const getGenreLabel = (genre: typeof GENRES[0]) => {
    switch (language) {
      case 'pt':
        return genre.labelPt;
      case 'es':
        return genre.labelEs;
      default:
        return genre.labelEn;
    }
  };
  
  React.useEffect(() => {
    if (visible) {
      logEvent('onboarding_started');
    }
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleSkip}
      statusBarTranslucent
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#374151',
          }}
        >
          <Text style={{ color: '#F9FAFB', fontSize: 18, fontWeight: '700' }}>
            Looton
          </Text>
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityLabel={t('onboarding.skipNow')}
            style={{ padding: 8 }}
          >
            <Text style={{ color: '#9CA3AF', fontSize: 14 }}>
              {t('onboarding.skipNow')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: isTablet ? 40 : 20,
            paddingVertical: 24,
            maxWidth: isTablet ? 800 : '100%',
            alignSelf: 'center',
            width: '100%',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Seleção de Gêneros */}
          <Text
            style={{
              color: '#F9FAFB',
              fontSize: isTablet ? 32 : 28,
              fontWeight: '800',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {t('onboarding.title')}
          </Text>
          
          <Text
            style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            {t('onboarding.subtitle')}
          </Text>
          
          {/* Chips de Gêneros */}
          <Text
            style={{
              color: '#E5E7EB',
              fontSize: 14,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            {t('onboarding.selectGenres')}
          </Text>
          
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 24,
            }}
          >
            {GENRES.map((genre) => {
              const isSelected = selectedGenres.includes(genre.slug);
              return (
                <TouchableOpacity
                  key={genre.slug}
                  onPress={() => toggleGenre(genre.slug)}
                  accessibilityLabel={`${getGenreLabel(genre)}${isSelected ? ' selecionado' : ''}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    backgroundColor: isSelected ? '#3B82F6' : '#374151',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? '#2563EB' : '#4B5563',
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : '#9CA3AF',
                      fontSize: 14,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {getGenreLabel(genre)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Indicador de seleção */}
          {selectedGenres.length > 0 && (
            <Text
              style={{
                color: '#10B981',
                fontSize: 14,
                marginBottom: 20,
                textAlign: 'center',
              }}
            >
              {selectedGenres.length} {selectedGenres.length === 1 ? 'gênero selecionado' : 'gêneros selecionados'}
            </Text>
          )}
          
          {/* Botão Salvar */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canContinue || saving}
            style={{
              backgroundColor: canContinue && !saving ? '#3B82F6' : '#4B5563',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: canContinue ? '#FFFFFF' : '#6B7280',
                  fontSize: 16,
                  fontWeight: '700',
                }}
              >
                {t('onboarding.continue')}
              </Text>
            )}
          </TouchableOpacity>
          
          {!canContinue && (
            <Text
              style={{
                color: '#9CA3AF',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              {t('onboarding.selectAtLeastOne')}
            </Text>
          )}
          
          <Text
            style={{
              color: '#6B7280',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            {t('onboarding.skipMessage')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
