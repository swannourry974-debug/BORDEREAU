import React, { useMemo, useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import LangSwitcher from '@/components/shared/LangSwitcher';
import { CATALOGUE_COUNTRIES } from '@/lib/catalogueDestinations';

const MODES = [
  { id: 'express', title: 'Express', desc: 'Le plus rapide, remis par un voyageur.' },
  { id: 'collecte', title: 'Collectif malle', desc: 'Plus économique, groupé par destination.' },
];

export default function CatalogueWelcomeStep({ deliveryMode, onSelectMode, selectedCity, selectedRelay, onNext }) {
  const initialCountry = CATALOGUE_COUNTRIES.find(c => c.cities.some(v => v.label === selectedCity?.label)) || CATALOGUE_COUNTRIES[0];
  const [countryCode, setCountryCode] = useState(initialCountry.code);
  const country = CATALOGUE_COUNTRIES.find(c => c.code === countryCode) || CATALOGUE_COUNTRIES[0];
  const initialCity = country.cities.find(v => v.label === selectedCity?.label) || country.cities[0];
  const [cityLabel, setCityLabel] = useState(initialCity.label);
  const city = useMemo(() => country.cities.find(v => v.label === cityLabel) || country.cities[0], [country, cityLabel]);
  const [relayName, setRelayName] = useState(selectedRelay?.name || city.relays[0]);

  const changeCountry = (code) => {
    const nextCountry = CATALOGUE_COUNTRIES.find(c => c.code === code) || CATALOGUE_COUNTRIES[0];
    setCountryCode(code);
    setCityLabel(nextCountry.cities[0].label);
    setRelayName(nextCountry.cities[0].relays[0]);
  };

  const changeCity = (label) => {
    const nextCity = country.cities.find(v => v.label === label) || country.cities[0];
    setCityLabel(label);
    setRelayName(nextCity.relays[0]);
  };

  const submit = () => onNext({ city: { ...city, zone_id: country.zone_id }, relay: { name: relayName, city: city.label } });

  return (
    <div className="bg-papier border-[1.5px] border-encre p-5 shadow-[3px_3px_0_rgba(26,16,8,0.18)] space-y-5">
      <div>
        <div className="font-typewriter text-[9px] tracking-[3px] uppercase text-bordeaux mb-3">Bonjour lecteur</div>
        <h1 className="font-serif text-[26px] leading-tight font-bold text-encre">
          Bonjour lecteur, quel livre vous manque ce soir ?
        </h1>
      </div>

      <LangSwitcher />

      <div>
        <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Pays</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {CATALOGUE_COUNTRIES.map(c => (
            <button key={c.code} onClick={() => changeCountry(c.code)} className={`p-3 border text-left ${countryCode === c.code ? 'border-bordeaux bg-bordeaux/5' : 'border-encre/20 bg-creme'}`}>
              <span className="text-lg mr-2">{c.emoji}</span><span className="font-typewriter text-[11px] uppercase">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Destination</label>
        <div className="space-y-2 mt-2">
          {country.cities.map(v => (
            <button key={v.label} onClick={() => changeCity(v.label)} className={`w-full p-3 border text-left font-typewriter text-[11px] uppercase ${cityLabel === v.label ? 'border-bordeaux bg-bordeaux/5 text-bordeaux' : 'border-encre/20 bg-creme'}`}>
              {v.emoji} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="font-typewriter text-[9px] tracking-[2px] uppercase text-foreground/50">Point relais</label>
        <div className="space-y-2 mt-2">
          {city.relays.map(relay => (
            <button key={relay} onClick={() => setRelayName(relay)} className={`w-full p-3 border text-left ${relayName === relay ? 'border-[#2d6a2d] bg-[#2d6a2d]/5 text-[#2d6a2d]' : 'border-encre/20 bg-creme'}`}>
              <div className="font-typewriter text-[11px] uppercase">{relayName === relay ? '✓ ' : ''}{relay}</div>
              <div className="font-fell italic text-[11px] text-foreground/45 mt-1">Retrait sécurisé en boutique partenaire</div>
            </button>
          ))}
        </div>
      </div>

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

      <CouponButton onClick={submit} className="w-full py-4">Continuer vers la recherche</CouponButton>
    </div>
  );
}