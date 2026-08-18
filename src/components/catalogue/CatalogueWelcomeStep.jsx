import React, { useEffect, useMemo, useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import LangSwitcher from '@/components/shared/LangSwitcher';
import { base44 } from '@/api/base44Client';

const MODES = [
  { id: 'express', title: 'Express', desc: 'Le plus rapide, remis par un voyageur.' },
  { id: 'collecte', title: 'Collectif malle', desc: 'Plus économique, groupé par destination.' },
];

function buildCountries(relays) {
  const countries = new Map();

  relays.forEach((relay) => {
    const countryCode = relay.pays_code || 'XX';
    const countryName = relay.pays_nom || relay.pays_code || 'Pays';
    const cityName = relay.ville || 'Ville';

    if (!countries.has(countryCode)) {
      countries.set(countryCode, {
        code: countryCode,
        name: countryName,
        emoji: relay.emoji_drapeau || '📍',
        zone_id: relay.zone_id || 'international',
        cities: new Map(),
      });
    }

    const country = countries.get(countryCode);
    if (!country.cities.has(cityName)) {
      country.cities.set(cityName, {
        label: `${cityName}${countryName ? `, ${countryName}` : ''}`,
        rawCity: cityName,
        emoji: country.emoji,
        zone_id: relay.zone_id || country.zone_id,
        relays: [],
      });
    }

    country.cities.get(cityName).relays.push({ id: relay.id, name: relay.nom, city: cityName });
  });

  return Array.from(countries.values()).map(country => ({
    ...country,
    cities: Array.from(country.cities.values()),
  }));
}

export default function CatalogueWelcomeStep({ deliveryMode, onSelectMode, selectedCity, selectedRelay, onNext }) {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countryCode, setCountryCode] = useState('');
  const [cityLabel, setCityLabel] = useState('');
  const [relayName, setRelayName] = useState('');

  useEffect(() => {
    base44.entities.PointRelais
      .filter({ actif: true, validation_admin: 'valide' }, 'nom', 100)
      .then((relays) => {
        const nextCountries = buildCountries(relays || []);
        setCountries(nextCountries);
        const initialCountry = nextCountries.find(c => c.cities.some(v => v.label === selectedCity?.label)) || nextCountries[0];
        const initialCity = initialCountry?.cities.find(v => v.label === selectedCity?.label) || initialCountry?.cities[0];
        const initialRelay = initialCity?.relays.find(r => r.name === selectedRelay?.name) || initialCity?.relays[0];
        setCountryCode(initialCountry?.code || '');
        setCityLabel(initialCity?.label || '');
        setRelayName(initialRelay?.name || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const country = countries.find(c => c.code === countryCode) || countries[0];
  const city = useMemo(() => country?.cities.find(v => v.label === cityLabel) || country?.cities[0], [country, cityLabel]);

  const changeCountry = (code) => {
    const nextCountry = countries.find(c => c.code === code) || countries[0];
    const nextCity = nextCountry?.cities[0];
    const nextRelay = nextCity?.relays[0];
    setCountryCode(nextCountry?.code || '');
    setCityLabel(nextCity?.label || '');
    setRelayName(nextRelay?.name || '');
  };

  const changeCity = (label) => {
    const nextCity = country?.cities.find(v => v.label === label) || country?.cities[0];
    const nextRelay = nextCity?.relays[0];
    setCityLabel(nextCity?.label || '');
    setRelayName(nextRelay?.name || '');
  };

  const relay = city?.relays.find(r => r.name === relayName) || city?.relays[0];
  const submit = () => {
    if (!city || !relay) return;
    onNext({ city: { ...city, zone_id: city.zone_id || country?.zone_id }, relay: { id: relay.id, name: relay.name, city: city.label } });
  };

  return (
    <div className="bg-papier border-[1.5px] border-encre p-5 shadow-[3px_3px_0_rgba(26,16,8,0.18)] space-y-5">
      <div>
        <div className="font-typewriter text-[9px] tracking-[3px] uppercase text-bordeaux mb-3">Bonjour lecteur</div>
        <h1 className="font-serif text-[26px] leading-tight font-bold text-encre">
          Bonjour lecteur, quel livre vous manque ce soir ?
        </h1>
      </div>

      <LangSwitcher />

      {loading ? (
        <div className="font-fell italic text-[13px] text-foreground/50 text-center py-8">Chargement des points relais…</div>
      ) : countries.length === 0 ? (
        <div className="border border-dashed border-encre/20 bg-creme p-4 text-center">
          <div className="font-typewriter text-[10px] uppercase tracking-[2px] text-bordeaux mb-2">Aucun point relais actif</div>
          <div className="font-fell italic text-[12px] text-foreground/55">Ajoutez et validez un point relais pour ouvrir la commande.</div>
        </div>
      ) : (
        <>
          <div>
            <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Pays</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {countries.map(c => (
                <button key={c.code} onClick={() => changeCountry(c.code)} className={`p-3 border text-left ${countryCode === c.code ? 'border-bordeaux bg-bordeaux/5' : 'border-encre/20 bg-creme'}`}>
                  <span className="text-lg mr-2">{c.emoji}</span><span className="font-typewriter text-[11px] uppercase">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Destination</label>
            <div className="space-y-2 mt-2">
              {country?.cities.map(v => (
                <button key={v.label} onClick={() => changeCity(v.label)} className={`w-full p-3 border text-left font-typewriter text-[11px] uppercase ${cityLabel === v.label ? 'border-bordeaux bg-bordeaux/5 text-bordeaux' : 'border-encre/20 bg-creme'}`}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Point relais</label>
            <div className="space-y-2 mt-2">
              {city?.relays.map(relay => (
                <button key={relay.id || relay.name} onClick={() => setRelayName(relay.name)} className={`w-full p-3 border text-left ${relayName === relay.name ? 'border-[#2d6a2d] bg-[#2d6a2d]/5 text-[#2d6a2d]' : 'border-encre/20 bg-creme'}`}>
                  <div className="font-typewriter text-[11px] uppercase">{relayName === relay.name ? '✓ ' : ''}{relay.name}</div>
                  <div className="font-fell italic text-[11px] text-foreground/45 mt-1">Retrait sécurisé en boutique partenaire</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Mode de livraison</label>
        <div className="space-y-3 mt-2">
          {MODES.map(mode => {
            const active = deliveryMode === mode.id;
            return (
              <button key={mode.id} onClick={() => onSelectMode(mode.id)} className={`w-full text-left border-[1.5px] p-4 transition-all ${active ? 'border-bordeaux bg-bordeaux/5' : 'border-encre/20 bg-creme'}`}>
                <div className="font-typewriter text-[12px] tracking-[1.5px] uppercase text-encre">{active ? '✓ ' : ''}{mode.title}</div>
                <div className="font-fell italic text-[12px] text-foreground/55 mt-1">{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <CouponButton onClick={submit} disabled={!city || !relay} className="w-full py-4">Continuer vers la recherche</CouponButton>
    </div>
  );
}