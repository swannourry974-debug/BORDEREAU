// Fichier généré par scripts/gen-server.mjs — ne pas éditer à la main.
import '../runtime';
import type { FunctionHandler } from '../types';
import fn0 from '../../base44/functions/accepterMissionAnnonce/entry.ts';
import '../../base44/functions/alerterLecteurArrivee/entry.ts';
import fn2 from '../../base44/functions/analyserComportementGoogleAnalytics/entry.ts';
import '../../base44/functions/calculateCommission/entry.ts';
import '../../base44/functions/calculerMarge/entry.ts';
import '../../base44/functions/calculerPenalitesRetard/entry.ts';
import fn6 from '../../base44/functions/catalogDuplicates/entry.ts';
import fn7 from '../../base44/functions/catalogIntegrity/entry.ts';
import fn8 from '../../base44/functions/catalogMergedAudit/entry.ts';
import fn9 from '../../base44/functions/catalogMergedReferenceAudit/entry.ts';
import fn10 from '../../base44/functions/catalogQuarantineClassify/entry.ts';
import fn11 from '../../base44/functions/catalogRepairLinks/entry.ts';
import fn12 from '../../base44/functions/catalogStats/entry.ts';
import fn13 from '../../base44/functions/catalogSuggestionsDebug/entry.ts';
import fn14 from '../../base44/functions/createCheckout/entry.ts';
import fn15 from '../../base44/functions/demanderVirement/entry.ts';
import fn16 from '../../base44/functions/envoyerAlerteAdmin/entry.ts';
import fn17 from '../../base44/functions/envoyerFinalisationRelais/entry.ts';
import fn18 from '../../base44/functions/expirerMissionAnnonces/entry.ts';
import fn19 from '../../base44/functions/fermerMalleCollecte/entry.ts';
import fn20 from '../../base44/functions/genererQrCommande/entry.ts';
import fn21 from '../../base44/functions/getCatalogBook/entry.ts';
import fn22 from '../../base44/functions/grouperCollectePayee/entry.ts';
import fn23 from '../../base44/functions/importAwinCultura/entry.ts';
import fn24 from '../../base44/functions/notifierDemandeRelais/entry.ts';
import fn25 from '../../base44/functions/notifierLivraisonLecteur/entry.ts';
import '../../base44/functions/notifierRelais/entry.ts';
import fn27 from '../../base44/functions/notifierSuiviCommande/entry.ts';
import fn28 from '../../base44/functions/notifierValidationLivraison/entry.ts';
import fn29 from '../../base44/functions/publierMissionAnnonces/entry.ts';
import fn30 from '../../base44/functions/rappelVoyageurs/entry.ts';
import fn31 from '../../base44/functions/rapportHebdoAdmin/entry.ts';
import fn32 from '../../base44/functions/rapportLitigesQuotidien/entry.ts';
import fn33 from '../../base44/functions/relancerCollecteStagnee/entry.ts';
import '../../base44/functions/resumeHebdoVoyageur/entry.ts';
import fn35 from '../../base44/functions/runCatalogImport/entry.ts';
import fn36 from '../../base44/functions/runCatalogImportTest/entry.ts';
import fn37 from '../../base44/functions/searchCatalog/entry.ts';
import fn38 from '../../base44/functions/stripeWebhook/entry.ts';
import fn39 from '../../base44/functions/testAwinFeed/entry.ts';
import fn40 from '../../base44/functions/updateRelayInventory/entry.ts';
import fn41 from '../../base44/functions/validateCatalogCart/entry.ts';
import fn42 from '../../base44/functions/validerLivraison/entry.ts';
import fn43 from '../../base44/functions/validerRetraitBordero/entry.ts';

const __served = ((globalThis as any).__denoServeHandlers ?? []) as FunctionHandler[];

export const FUNCTIONS: Record<string, FunctionHandler> = {
  "accepterMissionAnnonce": fn0 as FunctionHandler,
  "alerterLecteurArrivee": (__served[0] ?? fn1) as FunctionHandler,
  "analyserComportementGoogleAnalytics": fn2 as FunctionHandler,
  "calculateCommission": (__served[1] ?? fn3) as FunctionHandler,
  "calculerMarge": (__served[2] ?? fn4) as FunctionHandler,
  "calculerPenalitesRetard": (__served[3] ?? fn5) as FunctionHandler,
  "catalogDuplicates": fn6 as FunctionHandler,
  "catalogIntegrity": fn7 as FunctionHandler,
  "catalogMergedAudit": fn8 as FunctionHandler,
  "catalogMergedReferenceAudit": fn9 as FunctionHandler,
  "catalogQuarantineClassify": fn10 as FunctionHandler,
  "catalogRepairLinks": fn11 as FunctionHandler,
  "catalogStats": fn12 as FunctionHandler,
  "catalogSuggestionsDebug": fn13 as FunctionHandler,
  "createCheckout": fn14 as FunctionHandler,
  "demanderVirement": fn15 as FunctionHandler,
  "envoyerAlerteAdmin": fn16 as FunctionHandler,
  "envoyerFinalisationRelais": fn17 as FunctionHandler,
  "expirerMissionAnnonces": fn18 as FunctionHandler,
  "fermerMalleCollecte": fn19 as FunctionHandler,
  "genererQrCommande": fn20 as FunctionHandler,
  "getCatalogBook": fn21 as FunctionHandler,
  "grouperCollectePayee": fn22 as FunctionHandler,
  "importAwinCultura": fn23 as FunctionHandler,
  "notifierDemandeRelais": fn24 as FunctionHandler,
  "notifierLivraisonLecteur": fn25 as FunctionHandler,
  "notifierRelais": (__served[4] ?? fn26) as FunctionHandler,
  "notifierSuiviCommande": fn27 as FunctionHandler,
  "notifierValidationLivraison": fn28 as FunctionHandler,
  "publierMissionAnnonces": fn29 as FunctionHandler,
  "rappelVoyageurs": fn30 as FunctionHandler,
  "rapportHebdoAdmin": fn31 as FunctionHandler,
  "rapportLitigesQuotidien": fn32 as FunctionHandler,
  "relancerCollecteStagnee": fn33 as FunctionHandler,
  "resumeHebdoVoyageur": (__served[5] ?? fn34) as FunctionHandler,
  "runCatalogImport": fn35 as FunctionHandler,
  "runCatalogImportTest": fn36 as FunctionHandler,
  "searchCatalog": fn37 as FunctionHandler,
  "stripeWebhook": fn38 as FunctionHandler,
  "testAwinFeed": fn39 as FunctionHandler,
  "updateRelayInventory": fn40 as FunctionHandler,
  "validateCatalogCart": fn41 as FunctionHandler,
  "validerLivraison": fn42 as FunctionHandler,
  "validerRetraitBordero": fn43 as FunctionHandler,
};
