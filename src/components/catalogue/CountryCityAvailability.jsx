import React, { useEffect, useMemo, useState } from 'react';

const COUNTRY_DATA = {
  France: { emoji: '🇫🇷', zone_id: 'europe', cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Albi'] },
  Belgique: { emoji: '🇧🇪', zone_id: 'europe', cities: ['Bruxelles', 'Liège', 'Namur', 'Anvers', 'Charleroi'] },
  Suisse: { emoji: '🇨🇭', zone_id: 'europe', cities: ['Genève', 'Lausanne', 'Zurich', 'Berne', 'Bâle'] },
  Canada: { emoji: '🇨🇦', zone_id: 'international', cities: ['Montréal', 'Québec', 'Toronto', 'Ottawa', 'Vancouver'] },
  'États-Unis': { emoji: '🇺🇸', zone_id: 'international', cities: ['Miami', 'New York', 'Boston', 'Los Angeles', 'Chicago'] },
  Maroc: { emoji: '🇲🇦', zone_id: 'maghreb', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger'] },
  Algérie: { emoji: '🇩🇿', zone_id: 'maghreb', cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Tlemcen'] },
  Tunisie: { emoji: '🇹🇳', zone_id: 'maghreb', cities: ['Tunis', 'Sousse', 'Sfax', 'Bizerte', 'Djerba'] },
  Sénégal: { emoji: '🇸🇳', zone_id: 'grand_export', cities: ['Dakar', 'Saint-Louis', 'Thiès', 'Touba', 'Ziguinchor'] },
  'Côte d’Ivoire': { emoji: '🇨🇮', zone_id: 'grand_export', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San Pedro', 'Daloa'] },
};

const normalize = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export default function CountryCityAvailability({ onLocationChange }) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const countryNames = Object.keys(COUNTRY_DATA);
  const matchedCountry = countryNames.find(name => normalize(name) === normalize(country));
  const countryInfo = COUNTRY_DATA[matchedCountry] || { emoji: '🌍', zone_id: 'international', cities: [] };

  const isAvailable = useMemo(() => {
    if (!country.trim() || !city.trim()) return null;
    const score = normalize(`${country}-${city}`).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return score % 2 === 0;
  }, [country, city]);

  useEffect(() => {
    if (country.trim() && city.trim()) {
      onLocationChange?.({ label: `${city.trim()}, ${country.trim()}`, emoji: countryInfo.emoji, zone_id: countryInfo.zone_id });
    }
  }, [country, city, countryInfo.emoji, countryInfo.zone_id, onLocationChange]);

  return (
    <div className="mb-4 rounded-[10px] border border-border bg-papier/90 p-4 shadow-[2px_2px_0_rgba(26,16,8,0.12)]">
      <label className="block text-[10px] uppercase tracking-[2px] text-foreground/55 mb-2">Choisir mon pays</label>
      <input className="w-full rounded-[10px] border border-border bg-creme px-3 py-2 text-sm outline-none focus:border-bordeaux" list="country-options" value={country} onChange={(e) => { setCountry(e.target.value); setCity(''); }} placeholder="Ex : France" />
      <datalist id="country-options">{countryNames.map(name => <option key={name} value={name} />)}</datalist>

      <label className="block text-[10px] uppercase tracking-[2px] text-foreground/55 mt-3 mb-2">Ma ville</label>
      <input className="w-full rounded-[10px] border border-border bg-creme px-3 py-2 text-sm outline-none focus:border-bordeaux" list="city-options" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Albi" />
      <datalist id="city-options">{countryInfo.cities.map(name => <option key={name} value={name} />)}</datalist>

      {isAvailable !== null && (
        <div className={`mt-3 text-sm font-semibold ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
          {isAvailable ? 'Disponible chez vous' : 'Indisponible chez vous'}
        </div>
      )}
    </div>
  );
}