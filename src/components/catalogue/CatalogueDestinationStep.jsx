import React, { useMemo, useState } from 'react';
import CouponButton from '@/components/shared/CouponButton';
import { CATALOGUE_COUNTRIES } from '@/lib/catalogueDestinations';

export default function CatalogueDestinationStep({ selectedCity, selectedRelay, onConfirm, onBack }) {
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

  return (
    <div className="bg-papier border-[1.5px] border-encre p-4 shadow-[3px_3px_0_rgba(26,16,8,0.18)]">
      <div className="font-typewriter text-[9px] tracking-[3px] uppercase text-bordeaux mb-3">Destination</div>
      <h2 className="font-serif text-[22px] font-bold text-encre mb-4">Choisissez le pays, la ville et le point relais.</h2>
      <div className="space-y-4">
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
      </div>
      <div className="flex gap-2 mt-5">
        <CouponButton secondary onClick={onBack} className="flex-1">Retour</CouponButton>
        <CouponButton onClick={() => onConfirm({ city: { ...city, zone_id: country.zone_id }, relay: { name: relayName, city: city.label } })} className="flex-1">Voir les livres</CouponButton>
      </div>
    </div>
  );
}