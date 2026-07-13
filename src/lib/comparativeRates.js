export const COMPARATIVE_RATES = {
  conakry: {
    destination: 'Conakry',
    country: 'Guinée',
    borderoMin: 50,
    borderoMax: 70,
    colissimo: 256.89,
    dhlMin: 380,
    dhlMax: 450,
    fretMin: 250,
    fretMax: 350,
  },
  new_york: {
    destination: 'New York',
    country: 'USA',
    borderoMin: 50,
    borderoMax: 70,
    colissimo: 256.89,
    dhlMin: 220,
    dhlMax: 280,
    fretMin: 300,
    fretMax: 400,
  },
  quebec: {
    destination: 'Québec',
    country: 'Canada',
    borderoMin: 50,
    borderoMax: 70,
    colissimo: 256.89,
    dhlMin: 240,
    dhlMax: 290,
    fretMin: 320,
    fretMax: 420,
  },
  miami: {
    destination: 'Miami',
    country: 'USA',
    borderoMin: 50,
    borderoMax: 70,
    colissimo: 256.89,
    dhlMin: 220,
    dhlMax: 280,
    fretMin: 300,
    fretMax: 400,
  },
  cape_town: {
    destination: 'Cape Town',
    country: 'Afrique du Sud',
    borderoMin: 50,
    borderoMax: 70,
    colissimo: 256.89,
    dhlMin: 390,
    dhlMax: 460,
    fretMin: 350,
    fretMax: 450,
  },
};

const normalize = (value = '') => value
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

export function getComparativeRate(destination = '') {
  const value = normalize(destination);

  if (value.includes('conakry') || value.includes('guinee') || value.includes('guinea')) return COMPARATIVE_RATES.conakry;
  if (value.includes('new york') || value.includes('nyc')) return COMPARATIVE_RATES.new_york;
  if (value.includes('quebec') || value.includes('canada')) return COMPARATIVE_RATES.quebec;
  if (value.includes('cape town') || value.includes('capetown') || value.includes('afrique du sud') || value.includes('south africa')) return COMPARATIVE_RATES.cape_town;
  if (value.includes('miami') || value.includes('usa') || value.includes('fl')) return COMPARATIVE_RATES.miami;

  return COMPARATIVE_RATES.miami;
}

export function getComparativeSavings(destination, borderoPrice = 0) {
  const rate = getComparativeRate(destination);
  const bestAlternative = Math.min(rate.colissimo, rate.dhlMin, rate.fretMin);
  const savings = Math.max(0, bestAlternative - Number(borderoPrice || 0));

  return {
    ...rate,
    bestAlternative,
    savings,
    multiplier: borderoPrice > 0 ? bestAlternative / borderoPrice : 0,
  };
}