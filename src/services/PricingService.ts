export interface DealPricing {
  isAvailable: boolean;
  unavailableReason?: string;
  basePrice?: number;
  finalPrice?: number;
  discountPercent?: number;
  currency?: string;
}

export interface Deal {
  priceBase?: number;
  priceFinal?: number;
  discountPct?: number;
  currency?: string;
}

// Enhanced pricing validation service
export function processDealPricing(deal: Deal): DealPricing | null {
  try {
    // Check if the deal has basic pricing data
    if (deal.priceBase === undefined || deal.priceFinal === undefined) {
      return {
        isAvailable: false,
        unavailableReason: 'Missing price data'
      };
    }

    // Validate that prices are valid numbers
    if (typeof deal.priceBase !== 'number' || typeof deal.priceFinal !== 'number' ||
        isNaN(deal.priceBase) || isNaN(deal.priceFinal)) {
      return {
        isAvailable: false,
        unavailableReason: 'Invalid price values'
      };
    }

    // Ensure prices are positive
    if (deal.priceBase < 0 || deal.priceFinal < 0) {
      return {
        isAvailable: false,
        unavailableReason: 'Negative prices not allowed'
      };
    }

    // Calculate discount percentage if not provided
    let discountPercent = deal.discountPct;
    if (discountPercent === undefined && deal.priceBase > 0) {
      discountPercent = Math.round(((deal.priceBase - deal.priceFinal) / deal.priceBase) * 100);
    }

    // Validate discount percentage
    if (discountPercent !== undefined && (discountPercent < 0 || discountPercent > 100)) {
      return {
        isAvailable: false,
        unavailableReason: 'Invalid discount percentage'
      };
    }

    // Check for consistency between calculated and provided discount
    if (deal.discountPct !== undefined && discountPercent !== undefined) {
      const calculatedDiscount = deal.priceBase > 0 ? 
        Math.round(((deal.priceBase - deal.priceFinal) / deal.priceBase) * 100) : 0;
      
      // Allow up to 5% tolerance for rounding differences
      if (Math.abs(calculatedDiscount - deal.discountPct) > 5) {
        console.warn(`Discount percentage mismatch: provided ${deal.discountPct}%, calculated ${calculatedDiscount}%`);
      }
    }

    return {
      isAvailable: true,
      basePrice: Number(deal.priceBase.toFixed(2)),
      finalPrice: Number(deal.priceFinal.toFixed(2)),
      discountPercent: discountPercent,
      currency: deal.currency || 'BRL'
    };
  } catch (error) {
    console.error('Error processing deal pricing:', error);
    return null;
  }
}

export function formatDisplayPrice(priceInReais: number, currency: string = 'BRL', locale: string = 'pt-BR'): string {
  try {
    if (priceInReais === null || priceInReais === undefined || isNaN(priceInReais)) {
      return 'Preço indisponível';
    }

    if (priceInReais === 0) {
      return 'Grátis';
    }

    // Use Intl.NumberFormat for proper currency formatting
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(priceInReais);
  } catch (error) {
    console.error('Error formatting price:', error);
    // Fallback formatting
    return `${currency} ${priceInReais.toFixed(2)}`;
  }
}

export function shouldDisplayDeal(deal: Deal): boolean {
  try {
    const pricing = processDealPricing(deal);
    
    if (!pricing || !pricing.isAvailable) {
      return false;
    }

    // Don't display deals with invalid prices
    if (pricing.basePrice === undefined || pricing.finalPrice === undefined) {
      return false;
    }

    // Don't display deals where final price is higher than base price
    if (pricing.finalPrice > pricing.basePrice) {
      return false;
    }

    // Don't display deals with 0% discount where both prices are the same
    if (pricing.discountPercent === 0 && pricing.basePrice === pricing.finalPrice) {
      return false;
    }

    // For free games, ensure both prices are 0
    if (pricing.finalPrice === 0 && pricing.basePrice !== 0) {
      console.warn(`Inconsistent free game pricing: base ${pricing.basePrice}, final ${pricing.finalPrice}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking if deal should be displayed:', error);
    return false;
  }
}