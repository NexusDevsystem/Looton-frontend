/**
 * Formata um preço numérico usando Intl.NumberFormat
 * @param price - Preço na unidade da moeda (não centavos)
 * @param currency - Código da moeda (ex: 'BRL', 'USD')
 * @param locale - Locale para formatação (ex: 'pt-BR', 'en-US')
 * @returns String formatada, por exemplo "R$ 12,34" or "$12.34"
 */
export const formatPrice = (price: number, currency = 'BRL', locale = 'pt-BR'): string => {
  if (price === 0) return 'Grátis';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(price);
  } catch (e) {
    return `${price.toFixed(2)} ${currency}`
  }
};

/**
 * Formata um preço em centavos usando o padrão brasileiro
 * @param priceInCents - Preço em centavos
 * @returns String formatada como "R$ 12,34"
 */
export const formatPriceFromCents = (priceInCents: number, currency = 'BRL', locale = 'pt-BR'): string => {
  if (priceInCents === 0) return 'Grátis';

  const priceInReais = priceInCents / 100;
  return formatPrice(priceInReais, currency, locale);
};