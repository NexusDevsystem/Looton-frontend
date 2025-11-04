# Sistema Adaptativo de Bottom Navigation Bar

## 📱 Problema Resolvido

A bottom navigation bar (navbar) do app agora se adapta automaticamente ao tipo de navegação do dispositivo Android:

- **Navegação por BOTÕES (3 botões)**: A navbar sobe para não ficar atrás dos botões do sistema
- **Navegação por GESTOS**: A navbar pode ficar mais baixa para melhor aproveitamento da tela

## 🏗️ Implementação

### 1. Hook Personalizado (`useBottomInset`)

Criado em: `src/hooks/useBottomInset.ts`

```typescript
export const useBottomInset = () => {
  const insets = useSafeAreaInsets();
  
  // Detecta tipo de navegação baseado no tamanho do safe area bottom
  const isGestureNavigation = insets.bottom <= 20;
  
  const paddingBottom = isGestureNavigation 
    ? 8  // Gestos: padding mínimo
    : Math.max(insets.bottom, 16); // Botões: usa safe area
    
  return { paddingBottom, isGestureNavigation, bottomInset: insets.bottom };
};
```

#### Como Funciona:

1. **Usa `react-native-safe-area-context`** para obter os insets do dispositivo
2. **Detecta o tipo de navegação** baseado no tamanho do `insets.bottom`:
   - `insets.bottom <= 20px` = Navegação por gestos
   - `insets.bottom > 20px` = Navegação por botões (3 botões)
3. **Retorna padding dinâmico** apropriado para cada tipo

### 2. Integração no App

#### Imports Adicionados:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useBottomInset } from '../src/hooks/useBottomInset';
```

#### Uso no Componente:

```typescript
function HomeContent() {
  const { paddingBottom: bottomNavPadding, isGestureNavigation } = useBottomInset();
  // ... resto do código
}
```

#### Bottom Navigation Atualizada:

```typescript
const renderBottomNav = () => (
  <View style={{ 
    backgroundColor: 'transparent', 
    paddingBottom: bottomNavPadding, // ✨ Padding dinâmico!
    paddingTop: 7
  }}>
    {/* ... resto da navbar */}
  </View>
)
```

#### Wrapper do App:

```typescript
export default function Home() {
  return (
    <SafeAreaProvider>  {/* ✨ Necessário para safe area funcionar */}
      <LanguageProvider>
        <HomeContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
```

## 🎯 Comportamento

### Navegação por Gestos (Android 10+)
- `insets.bottom` ≈ 0-20px
- `paddingBottom` = 8px
- Navbar fica mais baixa, aproveitando melhor a tela

### Navegação por Botões (3 botões)
- `insets.bottom` ≈ 48-96px (varia por dispositivo)
- `paddingBottom` = `insets.bottom` ou mínimo 16px
- Navbar sobe o suficiente para não ficar atrás dos botões

### iOS
- Sempre usa o safe area padrão
- Respeita o notch/island/home indicator

## 📊 Comparação Visual

### ANTES:
```
┌─────────────────────┐
│                     │
│   Conteúdo do App   │
│                     │
├─────────────────────┤
│  Tabs (fixo 25px)   │ ← Ficava atrás dos botões!
├─────────────────────┤
│  ⬅️  ⚪  ⬜  (Android)│
└─────────────────────┘
```

### DEPOIS (Botões):
```
┌─────────────────────┐
│                     │
│   Conteúdo do App   │
│                     │
│                     │
├─────────────────────┤
│  Tabs (adaptativo)  │ ← Sobe automaticamente!
├─────────────────────┤
│  ⬅️  ⚪  ⬜  (Android)│
└─────────────────────┘
```

### DEPOIS (Gestos):
```
┌─────────────────────┐
│                     │
│   Conteúdo do App   │
│                     │
│                     │
│                     │
├─────────────────────┤
│  Tabs (8px pad)     │ ← Mais baixo, tela maior!
└─────────────────────┘
```

## 🔧 Customização

### Ajustar Threshold de Detecção

No arquivo `useBottomInset.ts`:

```typescript
// Valor atual: 20px
const isGestureNavigation = insets.bottom <= 20;

// Para ser mais ou menos sensível:
const isGestureNavigation = insets.bottom <= 30; // Menos sensível
const isGestureNavigation = insets.bottom <= 10; // Mais sensível
```

### Ajustar Padding para Gestos

```typescript
const paddingBottom = isGestureNavigation 
  ? 12  // Aumentar para mais espaço
  : Math.max(insets.bottom, 16);
```

### Ajustar Padding para Botões

```typescript
const paddingBottom = isGestureNavigation 
  ? 8
  : Math.max(insets.bottom, 20); // Padding mínimo maior
```

## ✅ Testes Recomendados

### Android:

1. **Dispositivo com Navegação por Gestos**:
   - Configurações > Sistema > Gestos > Navegação do sistema > Navegação por gestos
   - Verifique se a navbar fica próxima ao fundo da tela

2. **Dispositivo com 3 Botões**:
   - Configurações > Sistema > Gestos > Navegação do sistema > Navegação com 3 botões
   - Verifique se a navbar sobe e não fica atrás dos botões

3. **Dispositivo com 2 Botões** (alguns fabricantes):
   - Deve funcionar similar aos 3 botões

### iOS:

- Deve respeitar o safe area inferior (home indicator)
- Notch/Dynamic Island não afeta a parte inferior

## 🐛 Troubleshooting

### Navbar ainda fica atrás dos botões

**Solução**: Aumentar o threshold de detecção ou padding mínimo:

```typescript
const paddingBottom = isGestureNavigation 
  ? 8
  : Math.max(insets.bottom + 8, 24); // Adiciona 8px extra
```

### Muito espaço em branco com navegação por gestos

**Solução**: Reduzir o padding para gestos:

```typescript
const paddingBottom = isGestureNavigation 
  ? 4  // Menos espaço
  : Math.max(insets.bottom, 16);
```

### Safe area não funciona

**Verificar**:
1. SafeAreaProvider está envolvendo o app? ✅
2. react-native-safe-area-context está instalado? ✅
3. App foi reiniciado após mudanças? 

## 📦 Dependências

- ✅ `react-native-safe-area-context` (já instalado)
- ✅ Expo SDK 54+ (compatível)

## 🚀 Vantagens

- ✅ **Automático**: Detecta e se adapta sem configuração manual
- ✅ **Cross-platform**: Funciona no Android e iOS
- ✅ **Performance**: Cálculo leve, sem impacto
- ✅ **Responsivo**: Atualiza se usuário mudar tipo de navegação
- ✅ **Acessível**: Melhor UX em todos os dispositivos

## 📝 Notas Importantes

1. **O hook só funciona dentro de SafeAreaProvider** - por isso envolvemos o app
2. **O valor de insets.bottom varia** por dispositivo e fabricante
3. **Android 9 e inferior** podem ter comportamentos diferentes
4. **Sempre teste em dispositivos reais** quando possível
