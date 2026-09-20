import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SectionTitle from '@/components/shared/SectionTitle';
import CouponButton from '@/components/shared/CouponButton';
import JaugeBlock from './JaugeBlock';
import { useCart } from '@/lib/CartContext';
import { base44 } from '@/api/base44Client';
import { getComparativeSavings } from '@/lib/comparativeRates';
import { formatEuro, getBookPriceInfo } from '@/lib/bookPricing';
import { getPrixClient, getZoneById } from '@/lib/tarifsConfig';
import { toast } from 'sonner';

const FORMATS = [
  { id: 'S', name: 'S · Léger', desc: '< 300g · Manga, Poche' },
  { id: 'M', name: 'M · Standard', desc: '300–700g · Roman, BD' },
  { id: 'L', name: 'L · Lourd', desc: '> 700g · Manuel, Beau livre' },
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

export default function AddToCartForm({ book, initialTransit = 'express', onItemAdded, onClose }) {
  const { addItem, items } = useCart();
  const [countries, setCountries] = useState([]);
  const [loadingRelays, setLoadingRelays] = useState(false);
  const [countryCode, setCountryCode] = useState('');
  const [cityLabel, setCityLabel] = useState('');
  const [relayName, setRelayName] = useState('');
  const [forfait, setForfait] = useState('S');
  const [transit, setTransit] = useState(initialTransit);

  useEffect(() => {
    if (!book) return;
    setTransit(initialTransit);
    setForfait(book?.type === 'BD' || book?.type === 'Relié' ? 'L' : book?.type === 'Broché' ? 'M' : 'S');
    setLoadingRelays(true);
    base44.entities.PointRelais
      .filter({ actif: true, validation_admin: 'valide' }, 'nom', 100)
      .then((relays) => {
        const nextCountries = buildCountries(relays || []);
        setCountries(nextCountries);
        const firstCountry = nextCountries[0];
        const firstCity = firstCountry?.cities[0];
        const firstRelay = firstCity?.relays[0];
        setCountryCode(firstCountry?.code || '');
        setCityLabel(firstCity?.label || '');
        setRelayName(firstRelay?.name || '');
      })
      .finally(() => setLoadingRelays(false));
  }, [book?.id, initialTransit]);

  const country = countries.find(c => c.code === countryCode) || countries[0];
  const city = useMemo(() => country?.cities.find(v => v.label === cityLabel) || country?.cities[0], [country, cityLabel]);
  const relay = city?.relays.find(r => r.name === relayName) || city?.relays[0];
  const zone = getZoneById(city?.zone_id || country?.zone_id || 'international');
  const prixLivraison = getPrixClient(zone, transit);
  const prixLivreInfo = getBookPriceInfo(book);
  const prixLivre = prixLivreInfo.value;
  const prixLivreARembourser = !prixLivreInfo.available;
  const prixVal = prixLivre + prixLivraison;
  const destinationLabel = city ? `${city.label}${relay?.name ? ` · ${relay.name}` : ''}` : 'Destination à choisir';
  const comparative = getComparativeSavings(destinationLabel, prixLivraison);

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

  const handleAddToCart = async () => {
    if (!city || !relay) {
      toast.error('Choisissez une destination et un point relais.');
      return;
    }

    const selectedCity = { ...city, zone_id: city.zone_id || country?.zone_id };
    const selectedRelay = { id: relay.id, name: relay.name, city: city.label };
    await addItem({ book, forfait, transit, adresse: destinationLabel, selectedCity, selectedRelay, prixLivre, prixLivraison, prixLivreARembourser, prixVal, comparative });
    toast.success(`"${book.title}" ajouté au panier !`, {
      description: `${prixLivreARembourser ? 'Livraison seule' : `Livre ${formatEuro(prixLivre)}`} + livraison ${formatEuro(prixLivraison)}`,
    });
    onClose();
    onItemAdded?.();
  };

  return (
    <AnimatePresence>
      {book && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className="bg-papier border-2 border-encre p-5 shadow-[5px_5px_0_rgba(26,16,8,0.2)] mb-5 relative">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <div className="text-[12px] tracking-[2px] text-foreground/50 uppercase font-typewriter">Choisir la livraison</div>
                <div className="font-serif text-[18px] font-bold text-encre leading-tight">{book.title}</div>
                {book.author && <div className="font-fell italic text-[12px] text-foreground/55">{book.author}</div>}
              </div>
              <button onClick={onClose} className="text-bordeaux text-[18px] leading-none cursor-pointer bg-transparent border-none p-0 hover:opacity-70">✕</button>
            </div>

            {loadingRelays ? (
              <div className="font-fell italic text-[13px] text-foreground/50 text-center py-8">Chargement des destinations Bordero…</div>
            ) : countries.length === 0 ? (
              <div className="border border-dashed border-encre/20 bg-creme p-4 text-center mb-4">
                <div className="font-typewriter text-[10px] uppercase tracking-[2px] text-bordeaux mb-2">Aucun point relais actif</div>
                <div className="font-fell italic text-[12px] text-foreground/55">Ajoutez et validez un point relais pour ouvrir la commande.</div>
              </div>
            ) : (
              <>
                <SectionTitle>1. Destination</SectionTitle>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {countries.map(c => (
                    <button key={c.code} onClick={() => changeCountry(c.code)} className={`p-3 border text-left transition-all ${countryCode === c.code ? 'border-bordeaux bg-bordeaux/5 text-bordeaux' : 'border-encre/20 bg-creme text-encre'}`}>
                      <span className="text-lg mr-2">{c.emoji}</span><span className="font-typewriter text-[11px] uppercase tracking-[1px]">{c.name}</span>
                    </button>
                  ))}
                </div>
                <div className="space-y-2 mb-5">
                  {country?.cities.map(v => (
                    <button key={v.label} onClick={() => changeCity(v.label)} className={`w-full p-3 border text-left font-typewriter text-[11px] uppercase tracking-[1px] transition-all ${cityLabel === v.label ? 'border-bordeaux bg-bordeaux/5 text-bordeaux' : 'border-encre/20 bg-creme text-encre'}`}>
                      {cityLabel === v.label ? '✓ ' : ''}{v.emoji} {v.label}
                    </button>
                  ))}
                </div>

                <SectionTitle>2. Mode de livraison</SectionTitle>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { id: 'express', title: 'Express', desc: 'Voyageur individuel', delay: 'le plus rapide' },
                    { id: 'collecte', title: 'Collectif', desc: 'Malle groupée Bordero', delay: 'plus économique' },
                  ].map(mode => {
                    const active = transit === mode.id;
                    const price = getPrixClient(zone, mode.id);
                    return (
                      <button key={mode.id} onClick={() => setTransit(mode.id)} className={`text-left border-[1.5px] p-4 transition-all ${active ? 'border-bordeaux bg-bordeaux/5 shadow-[3px_3px_0_rgba(110,30,46,0.22)]' : 'border-encre/20 bg-creme'}`}>
                        <div className="font-typewriter text-[12px] tracking-[1.5px] uppercase text-encre">{active ? '✓ ' : ''}{mode.title}</div>
                        <div className="font-serif text-[22px] font-bold text-bordeaux my-1">{formatEuro(price)}</div>
                        <div className="font-fell italic text-[12px] text-foreground/55 leading-tight">{mode.desc} · {mode.delay}</div>
                      </button>
                    );
                  })}
                </div>

                <SectionTitle>3. Point relais</SectionTitle>
                <div className="space-y-2 mb-5">
                  {city?.relays.map(r => (
                    <button key={r.id || r.name} onClick={() => setRelayName(r.name)} className={`w-full p-3 border text-left transition-all ${relayName === r.name ? 'border-[#2d6a2d] bg-[#2d6a2d]/5 text-[#2d6a2d]' : 'border-encre/20 bg-creme text-encre'}`}>
                      <div className="font-typewriter text-[11px] uppercase tracking-[1px]">{relayName === r.name ? '✓ ' : ''}{r.name}</div>
                      <div className="font-fell italic text-[11px] text-foreground/45 mt-1">Retrait sécurisé en boutique partenaire</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <SectionTitle>Format du livre</SectionTitle>
            <div className="grid grid-cols-3 gap-[10px] mb-4">
              {FORMATS.map(f => (
                <button key={f.id} onClick={() => setForfait(f.id)} className={`bg-papier border-[1.5px] p-[12px] px-2 cursor-pointer transition-all text-center relative ${forfait === f.id ? 'border-bordeaux bg-bordeaux/[0.04] shadow-[3px_3px_0_rgba(110,30,46,0.25)]' : 'border-foreground/25 hover:border-foreground/40'}`}>
                  {forfait === f.id && <span className="absolute top-[5px] right-[6px] text-bordeaux text-[11px]">✓</span>}
                  <div className="text-[10px] tracking-[1.5px] uppercase text-encre mb-1 font-typewriter">{f.name}</div>
                  <div className="text-[9px] text-encre/70 tracking-[0.5px] leading-tight">{f.desc}</div>
                </button>
              ))}
            </div>

            <JaugeBlock />

            <div className="border-t-[1.5px] border-dashed border-foreground/30 pt-[14px] mt-[14px]">
              <div className="space-y-2 font-typewriter text-[11px] tracking-[1.2px]">
                <div className="flex justify-between gap-4"><span>Destination</span><strong className="text-right">{destinationLabel}</strong></div>
                <div className="flex justify-between"><span>Prix du livre Google</span><strong>{prixLivreARembourser ? 'Indisponible' : formatEuro(prixLivre)}</strong></div>
                <div className="flex justify-between"><span>Livraison Bordero <span className="text-[#2d6a2d]">(gain estimé {comparative.savings.toFixed(0)} €)</span></span><strong>{formatEuro(prixLivraison)}</strong></div>
                {prixLivreARembourser && <div className="font-fell italic text-[11px] tracking-normal text-foreground/55">Prix Google indisponible : le livre sera régularisé sur justificatif.</div>}
              </div>
              <div className="flex justify-between items-center mt-[14px]">
                <div>
                  <div className="text-[11px] tracking-[1.5px] uppercase font-typewriter">Total séquestre</div>
                  <div className="text-[9px] text-foreground/40 mt-[2px] italic font-fell">Livre + livraison, libéré selon validation</div>
                </div>
                <div className="font-serif text-[28px] font-bold text-bordeaux">{formatEuro(prixVal)}</div>
              </div>
            </div>

            <div className="mt-3 bg-[#fff7ed] border border-[#C2410C]/40 px-3 py-2 text-[11px] text-encre">
              <div className="font-typewriter uppercase tracking-[1.5px] text-[#C2410C] mb-1">Gain comparatif</div>
              <div className="font-fell italic leading-relaxed">
                Économie estimée de <strong>{comparative.savings.toFixed(0)} €</strong> sur la livraison vs la solution classique la moins chère pour {comparative.destination}.
              </div>
            </div>

            <div className="mt-4 flex gap-[10px]">
              <CouponButton onClick={handleAddToCart} disabled={!city || !relay || loadingRelays} className="flex-1 py-3">
                🛒 Ajouter au panier {items.length > 0 && `(${items.length + 1} articles)`}
              </CouponButton>
              <CouponButton secondary onClick={onClose}>Retour</CouponButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}