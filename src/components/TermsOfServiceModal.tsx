import React from 'react'
import { Modal, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface TermsOfServiceModalProps {
  visible: boolean
  onAccept: () => void
}

export function TermsOfServiceModal({ visible, onAccept }: TermsOfServiceModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1F2937' }}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#374151',
            alignItems: 'center'
          }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center'
            }}>
              Termos de Serviço
            </Text>
            <Text style={{
              color: '#9CA3AF',
              fontSize: 16,
              marginTop: 4,
              textAlign: 'center'
            }}>
              Looton - by Nexus DevSystem
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={{
              color: '#FFFFFF',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              TERMO DE USO – LOOTON
            </Text>
            
            <Text style={{
              color: '#9CA3AF',
              fontSize: 14,
              marginBottom: 20,
              textAlign: 'center'
            }}>
              Última atualização: 03/10/2025
            </Text>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                1. Quem somos
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Este Termo regula o uso do aplicativo Looton ("App"), desenvolvido e mantido, em caráter experimental (beta), pela startup NexusDevsystem ("Nós").{'\n'}
                Site oficial: https://www.nexusdevsystem.com{'\n'}
                Suporte: nexusdevsystem@gmail.com{'\n'}
                Foro eleito: Belém/PA, Brasil.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                2. Objeto e serviço
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O Looton agrega e exibe promoções/ofertas de jogos e itens relacionados, podendo redirecionar o usuário apenas para lojas e plataformas de terceiros onde as compras são realizadas. Não vendemos produtos dentro do App.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                3. Aceitação
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Ao instalar e/ou utilizar o App, você declara que leu, entendeu e concorda com este Termo e com a Política de Privacidade. Se não concordar, não utilize o App.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                4. Elegibilidade
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O uso é recomendado para maiores de 13 anos. Menores de idade devem utilizar o App com supervisão e consentimento de seus responsáveis legais.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                5. Conta e login
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Atualmente, o Looton não exige criação de conta nem login para usar suas funcionalidades principais. Se, futuramente, contas forem necessárias, as regras serão informadas e este Termo será atualizado.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                6. Notificações
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O App pode enviar notificações sobre ofertas e menor preço histórico. Você pode gerenciar essas notificações nas configurações do dispositivo a qualquer momento.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                7. Fontes, links e afiliados
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Informações de preço, prazos, estoque, frete, garantias e políticas de devolução são de responsabilidade exclusiva das lojas de terceiros para as quais o App redireciona.{'\n\n'}
                Valores e disponibilidade podem mudar a qualquer momento, sem aviso.{'\n\n'}
                O App pode utilizar links de afiliados; poderemos receber comissão sem custo adicional para o usuário.{'\n\n'}
                Confira sempre as informações na página do vendedor antes de concluir a compra.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                8. Planos pagos e assinaturas
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O Looton não oferece planos pagos nem assinaturas neste momento.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                9. Regras de uso (proibições)
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                É vedado:{'\n'}
                a) utilizar o App para fins ilícitos;{'\n'}
                b) tentar burlar, explorar vulnerabilidades, realizar raspagem de dados (scraping), engenharia reversa ou automações maliciosas;{'\n'}
                c) interferir no funcionamento do App (ex.: distribuição de malware, sobrecarga de serviços);{'\n'}
                d) violar direitos de propriedade intelectual, privacidade, ou os termos e políticas de terceiros.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                10. Propriedade intelectual
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O nome, marca, logotipos, interfaces, layout e conteúdos do Looton pertencem à NexusDevsystem, salvo indicação em contrário. Marcas, nomes e conteúdos de terceiros citados pertencem aos seus respectivos titulares.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                11. Disponibilidade, versão de testes e alterações
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                O App está em fase de testes (beta) e pode apresentar falhas, instabilidades, indisponibilidades e perdas de funcionalidade. Podemos alterar, suspender ou encerrar partes do App a qualquer momento, com ou sem aviso prévio.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                12. Isenções e limitações de responsabilidade
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Na máxima extensão permitida pela legislação aplicável:{'\n'}
                a) não garantimos a exatidão, atualização contínua ou disponibilidade de todas as ofertas exibidas;{'\n'}
                b) não somos parte das transações realizadas entre você e as lojas de terceiros;{'\n'}
                c) não nos responsabilizamos por danos indiretos, lucros cessantes, perda de dados ou quaisquer prejuízos decorrentes do uso do App ou de sites/aplicativos de terceiros;{'\n'}
                d) o App é fornecido "no estado em que se encontra", sem garantias de qualquer natureza.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                13. Privacidade e proteção de dados
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Tratamos dados pessoais conforme a LGPD (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014). Detalhes constam na Política de Privacidade do Looton, que faz parte integrante deste Termo.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                14. Suporte e contato
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Para dúvidas, solicitações relacionadas à LGPD ou reclamações, contate: nexusdevsystem@gmail.com
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                15. Atualizações deste Termo
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Este Termo pode ser modificado a qualquer momento. A versão vigente é sempre a mais recente publicada no App. Mudanças relevantes poderão ser comunicadas dentro do App.
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
                marginBottom: 8
              }}>
                16. Lei aplicável e foro
              </Text>
              <Text style={{
                color: '#E5E7EB',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 12
              }}>
                Aplica-se a legislação brasileira. Fica eleito o Foro da Comarca de Belém/PA para dirimir eventuais controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.
              </Text>
            </View>

            <View style={{
              backgroundColor: '#374151',
              padding: 16,
              borderRadius: 12,
              marginBottom: 30
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="information-circle" size={20} color="#3B82F6" />
                <Text style={{
                  color: '#3B82F6',
                  fontSize: 16,
                  fontWeight: '600',
                  marginLeft: 8
                }}>
                  NexusDevsystem
                </Text>
              </View>
              <Text style={{
                color: '#9CA3AF',
                fontSize: 14,
                lineHeight: 18
              }}>
                Looton v1.0.0 Beta - Todos os direitos reservados{'\n'}
                nexusdevsystem@gmail.com{'\n'}
                https://www.nexusdevsystem.com
              </Text>
            </View>
          </ScrollView>

          {/* Accept Button */}
          <View style={{
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#374151'
          }}>
            <TouchableOpacity
              onPress={onAccept}
              style={{
                backgroundColor: '#3B82F6',
                padding: 16,
                borderRadius: 12,
                alignItems: 'center'
              }}
            >
              <Text style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '700'
              }}>
                Aceitar e Continuar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  )
}