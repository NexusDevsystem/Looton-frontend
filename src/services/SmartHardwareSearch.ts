/**
 * Sistema de Busca Inteligente para Hardware
 * 
 * Implementa múltiplas estratégias de busca para garantir 100% de acertos:
 * 1. Normalização de texto (acentos, espaços, case)
 * 2. Sinônimos e variações comuns
 * 3. Busca fuzzy (tolerância a erros de digitação)
 * 4. Busca por partes (tokenização)
 * 5. Busca por padrões (modelos, códigos)
 */

export class SmartHardwareSearch {
  // Mapa de sinônimos e variações comuns
  private static synonyms: Record<string, string[]> = {
    // GPUs NVIDIA
    'rtx': ['geforce rtx', 'nvidia rtx', 'rtx'],
    'gtx': ['geforce gtx', 'nvidia gtx', 'gtx'],
    '4090': ['rtx 4090', '4090', 'rtx4090'],
    '4080': ['rtx 4080', '4080', 'rtx4080'],
    '4070': ['rtx 4070', '4070', 'rtx4070', '4070 ti', '4070ti'],
    '4060': ['rtx 4060', '4060', 'rtx4060', '4060 ti', '4060ti'],
    '3090': ['rtx 3090', '3090', 'rtx3090', '3090 ti', '3090ti'],
    '3080': ['rtx 3080', '3080', 'rtx3080', '3080 ti', '3080ti'],
    '3070': ['rtx 3070', '3070', 'rtx3070', '3070 ti', '3070ti'],
    '3060': ['rtx 3060', '3060', 'rtx3060', '3060 ti', '3060ti'],
    '1660': ['gtx 1660', '1660', 'gtx1660', '1660 super', '1660 ti'],
    
    // GPUs AMD
    'rx': ['radeon rx', 'amd rx', 'rx'],
    '7900': ['rx 7900', '7900', '7900 xt', '7900 xtx'],
    '7800': ['rx 7800', '7800', '7800 xt'],
    '7700': ['rx 7700', '7700', '7700 xt'],
    '7600': ['rx 7600', '7600', '7600 xt'],
    '6900': ['rx 6900', '6900', '6900 xt'],
    '6800': ['rx 6800', '6800', '6800 xt'],
    '6700': ['rx 6700', '6700', '6700 xt'],
    '6600': ['rx 6600', '6600', '6600 xt'],
    
    // CPUs Intel
    'i9': ['intel i9', 'core i9', 'i9'],
    'i7': ['intel i7', 'core i7', 'i7'],
    'i5': ['intel i5', 'core i5', 'i5'],
    'i3': ['intel i3', 'core i3', 'i3'],
    '14900': ['i9 14900', '14900k', '14900kf'],
    '14700': ['i7 14700', '14700k', '14700kf'],
    '14600': ['i5 14600', '14600k', '14600kf'],
    '13900': ['i9 13900', '13900k', '13900kf'],
    '13700': ['i7 13700', '13700k', '13700kf'],
    '13600': ['i5 13600', '13600k', '13600kf'],
    '12900': ['i9 12900', '12900k', '12900kf'],
    '12700': ['i7 12700', '12700k', '12700kf'],
    '12600': ['i5 12600', '12600k', '12600kf'],
    
    // CPUs AMD
    'ryzen': ['amd ryzen', 'ryzen'],
    'r9 7950': ['ryzen 9 7950', '7950x', '7950x3d'],
    'r9 7900': ['ryzen 9 7900', '7900x', '7900x3d'],
    'r7 7700': ['ryzen 7 7700', '7700x'],
    'r5 7600': ['ryzen 5 7600', '7600x'],
    '5950': ['ryzen 9 5950', '5950x'],
    '5900': ['ryzen 9 5900', '5900x'],
    '5800': ['ryzen 7 5800', '5800x', '5800x3d'],
    '5600': ['ryzen 5 5600', '5600x'],
    
    // Armazenamento
    'ssd': ['ssd', 'solid state', 'nvme', 'm.2'],
    'hdd': ['hdd', 'hard disk', 'disco rigido'],
    'nvme': ['nvme', 'ssd nvme', 'm.2 nvme'],
    'm2': ['m.2', 'm2', 'ssd m.2'],
    
    // Memória RAM
    'ram': ['memoria ram', 'memoria', 'ddr4', 'ddr5'],
    'ddr4': ['ddr4', 'memoria ddr4'],
    'ddr5': ['ddr5', 'memoria ddr5'],
    
    // Outros componentes
    'placa': ['placa mae', 'motherboard', 'mobo'],
    'fonte': ['fonte de alimentacao', 'power supply', 'psu'],
    'gabinete': ['gabinete', 'case', 'caixa'],
    'cooler': ['cooler', 'resfriamento', 'ventilador'],
    'water': ['watercooler', 'water cooler', 'refrigeracao liquida'],
    'monitor': ['monitor', 'display', 'tela'],
    'teclado': ['teclado', 'keyboard'],
    'mouse': ['mouse', 'rato'],
    'headset': ['headset', 'fone', 'fone de ouvido'],
  };

  // Normalizar texto removendo acentos, convertendo para minúsculas, etc.
  static normalize(text: string): string {
    if (!text) return '';
    
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Normaliza espaços múltiplos
      .trim();
  }

  // Expandir query com sinônimos
  static expandWithSynonyms(query: string): string[] {
    const normalized = this.normalize(query);
    const tokens = normalized.split(' ');
    const expansions = new Set<string>([normalized]);

    // Adicionar a query original também
    expansions.add(query.toLowerCase().trim());

    // Para cada token, adicionar sinônimos
    tokens.forEach(token => {
      if (this.synonyms[token]) {
        this.synonyms[token].forEach(synonym => {
          expansions.add(this.normalize(synonym));
          // Também adicionar combinações com outros tokens
          const otherTokens = tokens.filter(t => t !== token);
          if (otherTokens.length > 0) {
            expansions.add(this.normalize(`${synonym} ${otherTokens.join(' ')}`));
            expansions.add(this.normalize(`${otherTokens.join(' ')} ${synonym}`));
          }
        });
      }
    });

    // Adicionar variações sem espaços
    if (tokens.length > 1) {
      expansions.add(tokens.join(''));
      // Variações com hífen
      expansions.add(tokens.join('-'));
    }

    return Array.from(expansions);
  }

  // Calcular similaridade fuzzy (Levenshtein simplificado)
  static fuzzyMatch(str1: string, str2: string): number {
    const s1 = this.normalize(str1);
    const s2 = this.normalize(str2);

    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;

    // Se um contém o outro, alta pontuação
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;

    // Verificar tokens individuais
    const tokens1 = s1.split(' ');
    const tokens2 = s2.split(' ');
    
    let matches = 0;
    tokens1.forEach(t1 => {
      if (tokens2.some(t2 => t2.includes(t1) || t1.includes(t2))) {
        matches++;
      }
    });

    return matches / Math.max(tokens1.length, tokens2.length);
  }

  // Extrair informações importantes (números de modelo, marcas, etc.)
  static extractKeyInfo(text: string): string[] {
    const normalized = this.normalize(text);
    const keyInfo: string[] = [];

    // Extrair números de modelo (ex: 4090, 13900, 7950)
    const modelNumbers = normalized.match(/\b\d{3,5}\b/g);
    if (modelNumbers) {
      keyInfo.push(...modelNumbers);
    }

    // Extrair marcas
    const brands = ['nvidia', 'amd', 'intel', 'asus', 'msi', 'gigabyte', 'corsair', 'kingston', 'samsung', 'western', 'seagate'];
    brands.forEach(brand => {
      if (normalized.includes(brand)) {
        keyInfo.push(brand);
      }
    });

    // Extrair séries (RTX, GTX, RX, Ryzen, Core)
    const series = ['rtx', 'gtx', 'rx', 'ryzen', 'core', 'i9', 'i7', 'i5', 'i3'];
    series.forEach(s => {
      if (normalized.includes(s)) {
        keyInfo.push(s);
      }
    });

    return keyInfo;
  }

  // Função principal de busca com score
  static searchAndScore<T extends { title: string }>(
    items: T[],
    query: string
  ): Array<T & { searchScore: number }> {
    if (!query || !query.trim()) {
      return items.map(item => ({ ...item, searchScore: 1 }));
    }

    const expansions = this.expandWithSynonyms(query);
    const queryKeyInfo = this.extractKeyInfo(query);

    return items
      .map(item => {
        let score = 0;
        const itemNormalized = this.normalize(item.title);
        const itemKeyInfo = this.extractKeyInfo(item.title);

        // 1. Match exato = score máximo
        if (itemNormalized === this.normalize(query)) {
          score = 100;
        }
        // 2. Contém a query completa = alto score
        else if (itemNormalized.includes(this.normalize(query))) {
          score = 90;
        }
        // 3. Match com expansões (sinônimos)
        else {
          let maxExpansionScore = 0;
          expansions.forEach(expansion => {
            if (itemNormalized.includes(expansion)) {
              maxExpansionScore = Math.max(maxExpansionScore, 80);
            } else {
              const fuzzy = this.fuzzyMatch(itemNormalized, expansion);
              maxExpansionScore = Math.max(maxExpansionScore, fuzzy * 70);
            }
          });
          score = maxExpansionScore;
        }

        // 4. Bonus por key info matching
        let keyInfoMatches = 0;
        queryKeyInfo.forEach(keyQuery => {
          if (itemKeyInfo.some(keyItem => 
            keyItem === keyQuery || 
            keyItem.includes(keyQuery) || 
            keyQuery.includes(keyItem)
          )) {
            keyInfoMatches++;
          }
        });

        if (keyInfoMatches > 0 && queryKeyInfo.length > 0) {
          score += (keyInfoMatches / queryKeyInfo.length) * 20;
        }

        // 5. Bonus se todos os tokens da query aparecem no item
        const queryTokens = this.normalize(query).split(' ');
        const allTokensPresent = queryTokens.every(token => 
          itemNormalized.includes(token)
        );
        if (allTokensPresent) {
          score += 10;
        }

        return {
          ...item,
          searchScore: Math.min(score, 100) // Máximo de 100
        };
      })
      .filter(item => item.searchScore > 15) // Filtrar resultados com score muito baixo
      .sort((a, b) => b.searchScore - a.searchScore); // Ordenar por score (maior primeiro)
  }
}
