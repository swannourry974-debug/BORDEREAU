// Fichier généré par scripts/gen-server.mjs — ne pas éditer à la main.
export const ENTITY_SCHEMAS = {
  "BookOffers": {
    "properties": {
      "book_id": {
        "type": "string",
        "description": "Référence vers Books.id"
      },
      "retailer_name": {
        "type": "string"
      },
      "retailer_product_id": {
        "type": "string"
      },
      "price": {
        "type": "number"
      },
      "original_price": {
        "type": "number"
      },
      "currency": {
        "type": "string"
      },
      "availability": {
        "type": "string",
        "enum": [
          "in_stock",
          "out_of_stock",
          "unknown"
        ],
        "default": "unknown"
      },
      "availability_raw": {
        "type": "string",
        "description": "Valeur brute de disponibilité reçue du flux marchand"
      },
      "stock_quantity": {
        "type": "number"
      },
      "merchant_url": {
        "type": "string"
      },
      "affiliate_url": {
        "type": "string"
      },
      "last_updated": {
        "type": "string"
      },
      "last_seen_in_feed": {
        "type": "string",
        "description": "Dernière date ISO à laquelle l'offre a été revue dans le flux marchand"
      },
      "missing_since": {
        "type": "string",
        "description": "Date ISO depuis laquelle l'offre n'a plus été observée dans le flux source"
      },
      "merged": {
        "type": "boolean",
        "default": false,
        "description": "Offre fusionnée vers une offre canonique sans suppression"
      },
      "merged_into": {
        "type": "string",
        "description": "ID de l’offre canonique conservée"
      },
      "merged_at": {
        "type": "string",
        "description": "Date ISO de marquage de fusion"
      }
    },
    "required": [
      "book_id",
      "retailer_name",
      "price",
      "currency"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "Books": {
    "properties": {
      "product_identifier": {
        "type": "string",
        "description": "Identifiant unique de déduplication: ISBN-13 valide ou EAN/merchant préfixé"
      },
      "identifier_type": {
        "type": "string",
        "enum": [
          "isbn13",
          "ean",
          "merchant_id"
        ],
        "default": "isbn13"
      },
      "isbn_valid": {
        "type": "boolean",
        "default": false
      },
      "product_type": {
        "type": "string",
        "enum": [
          "livre",
          "produit_editorial"
        ],
        "default": "livre"
      },
      "classification": {
        "type": "string",
        "enum": [
          "livre",
          "revue",
          "produit_editorial",
          "non_eligible"
        ],
        "default": "livre"
      },
      "classification_previous": {
        "type": "string",
        "description": "Ancienne valeur de product_type avant reclassement"
      },
      "classification_updated_at": {
        "type": "string",
        "description": "Date ISO de dernière classification"
      },
      "classification_source": {
        "type": "string",
        "description": "Règle ou opération ayant produit la classification"
      },
      "last_seen_in_feed": {
        "type": "string",
        "description": "Dernière date ISO à laquelle la fiche a été revue dans un flux marchand"
      },
      "missing_since": {
        "type": "string",
        "description": "Date ISO depuis laquelle la fiche n'a plus été observée dans le flux source"
      },
      "source_feed_id": {
        "type": "string",
        "description": "Flux Awin d'origine utilisé lors du dernier import"
      },
      "source_feed_name": {
        "type": "string"
      },
      "isbn13": {
        "type": "string",
        "description": "ISBN-13 uniquement quand il est valide; vide pour un EAN non-ISBN"
      },
      "ean": {
        "type": "string",
        "description": "EAN source du flux marchand"
      },
      "title": {
        "type": "string"
      },
      "title_norm": {
        "type": "string",
        "description": "Titre normalisé minuscules sans accents et ponctuation remplacée par des espaces"
      },
      "title_tokens": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "Mots normalisés du titre, sans mots vides, pour recherche par contenu"
      },
      "author": {
        "type": "string"
      },
      "author_norm": {
        "type": "string",
        "description": "Auteur normalisé minuscules sans accents"
      },
      "author_source": {
        "type": "string",
        "enum": [
          "feed",
          "openlibrary",
          "none"
        ],
        "default": "none"
      },
      "author_enriched_at": {
        "type": "string"
      },
      "description": {
        "type": "string"
      },
      "image_url": {
        "type": "string"
      },
      "category": {
        "type": "string"
      },
      "category_source": {
        "type": "string",
        "enum": [
          "feed_field",
          "feed_rayon"
        ]
      },
      "category_norm": {
        "type": "string",
        "description": "Catégorie normalisée pour suggestions same_author puis same_category"
      },
      "language": {
        "type": "string"
      },
      "publisher": {
        "type": "string"
      },
      "merged": {
        "type": "boolean",
        "default": false,
        "description": "Fiche fusionnée vers une fiche canonique sans suppression"
      },
      "merged_into": {
        "type": "string",
        "description": "ID de la fiche Books canonique"
      },
      "merged_at": {
        "type": "string",
        "description": "Date ISO de marquage de fusion"
      }
    },
    "required": [
      "title"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "CampagnePromoCollecte": {
    "properties": {
      "point_relais_id": {
        "type": "string",
        "description": "Point relais concerné par la relance Collecte"
      },
      "point_relais_nom": {
        "type": "string",
        "description": "Nom lisible du point relais"
      },
      "code": {
        "type": "string",
        "description": "Code promotionnel commun à partager"
      },
      "montant_reduction": {
        "type": "number",
        "default": 5,
        "description": "Réduction en euros appliquée côté serveur au paiement Collecte"
      },
      "devise": {
        "type": "string",
        "default": "EUR"
      },
      "statut": {
        "type": "string",
        "enum": [
          "active",
          "terminee",
          "expiree"
        ],
        "default": "active"
      },
      "seuil_stagnation_jours": {
        "type": "number",
        "default": 7,
        "description": "Durée sans nouvelle commande avant relance"
      },
      "objectif_commandes": {
        "type": "number",
        "default": 40
      },
      "nombre_commandes_attente": {
        "type": "number",
        "default": 0
      },
      "nombre_utilisations": {
        "type": "number",
        "default": 0
      },
      "active_le": {
        "type": "string",
        "description": "Date ISO d'activation du code"
      },
      "valide_jusquau": {
        "type": "string",
        "description": "Date ISO d'expiration du code"
      },
      "derniere_commande_le": {
        "type": "string",
        "description": "Dernière progression observée du groupe Collecte"
      },
      "desactivee_le": {
        "type": "string"
      },
      "message_partage": {
        "type": "string",
        "description": "Message affiché aux lecteurs pour encourager le partage"
      }
    },
    "required": [
      "point_relais_id",
      "code",
      "statut"
    ],
    "rls": {
      "read": {},
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "CartItem": {
    "properties": {
      "user_email": {
        "type": "string",
        "description": "Email du propriétaire du panier"
      },
      "cart_id": {
        "type": "string",
        "description": "Identifiant stable de l'article dans le panier"
      },
      "book": {
        "type": "object",
        "description": "Livre ajouté au panier"
      },
      "forfait": {
        "type": "string"
      },
      "transit": {
        "type": "string"
      },
      "adresse": {
        "type": "string"
      },
      "selectedCity": {
        "type": "object"
      },
      "selectedRelay": {
        "type": "object"
      },
      "prixVal": {
        "type": "number"
      },
      "comparative": {
        "type": "object"
      }
    },
    "required": [
      "user_email",
      "cart_id"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "update": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "delete": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      }
    }
  },
  "Commande": {
    "properties": {
      "lecteur_email": {
        "type": "string",
        "description": "Email du lecteur"
      },
      "livre_titre": {
        "type": "string",
        "description": "Titre du livre commandé"
      },
      "livre_auteur": {
        "type": "string"
      },
      "livre_type": {
        "type": "string",
        "enum": [
          "Poche",
          "Broché",
          "BD",
          "Relié"
        ],
        "default": "Poche"
      },
      "zone_id": {
        "type": "string",
        "enum": [
          "europe",
          "international",
          "grand_export",
          "maghreb"
        ]
      },
      "zone_nom": {
        "type": "string"
      },
      "point_relais_id": {
        "type": "string"
      },
      "point_relais_nom": {
        "type": "string",
        "description": "Nom du point relais choisi pour la commande"
      },
      "malle_id": {
        "type": "string",
        "description": "ID de la malle Collecte Bordero rattachée à cette commande"
      },
      "collecte_batch_statut": {
        "type": "string",
        "enum": [
          "en_attente_40",
          "malle_creee"
        ],
        "default": "en_attente_40",
        "description": "Progression de regroupement Collecte par carton de 40 livres"
      },
      "collecte_regroupee_le": {
        "type": "string",
        "description": "Date ISO d'affectation à une malle Collecte"
      },
      "collecte_position_malle": {
        "type": "number",
        "description": "Position de la commande dans le carton de 40"
      },
      "campagne_promo_id": {
        "type": "string",
        "description": "Campagne Partenaria utilisée pour cette commande"
      },
      "code_promo_collecte": {
        "type": "string",
        "description": "Code promotionnel Collecte appliqué"
      },
      "montant_reduction_collecte": {
        "type": "number",
        "default": 0,
        "description": "Réduction Collecte validée côté serveur"
      },
      "transporteur_assigne": {
        "type": "string",
        "description": "Transporteur assigné à la malle Collecte"
      },
      "reference_suivi_collecte": {
        "type": "string",
        "description": "Référence de suivi de la malle Collecte"
      },
      "mode_livraison": {
        "type": "string",
        "enum": [
          "express",
          "collectif"
        ],
        "default": "express"
      },
      "montant_paye": {
        "type": "number"
      },
      "stripe_session_id": {
        "type": "string"
      },
      "suivi_facturation_mode": {
        "type": "string",
        "enum": [
          "email",
          "application"
        ],
        "default": "application",
        "description": "Choix utilisateur pour recevoir le suivi et la facture"
      },
      "suivi_active": {
        "type": "boolean",
        "default": true,
        "description": "Indique si le suivi de commande est activé"
      },
      "facture_reference": {
        "type": "string",
        "description": "Référence de facture affichée au lecteur"
      },
      "facture_emise_le": {
        "type": "string",
        "description": "Date ISO de génération de la facture"
      },
      "facture_url": {
        "type": "string",
        "description": "URL de facture si une facture externe est générée"
      },
      "statut": {
        "type": "string",
        "enum": [
          "en_attente_paiement",
          "payee",
          "en_preparation",
          "en_transit",
          "au_relais",
          "livree",
          "litige",
          "annulee"
        ],
        "default": "en_attente_paiement"
      },
      "voyageur_email": {
        "type": "string"
      },
      "mission_id": {
        "type": "string"
      },
      "ticket_url": {
        "type": "string"
      },
      "qr_code_depot": {
        "type": "string"
      },
      "visuel_bordero_id": {
        "type": "string",
        "description": "Référence du visuel officiel Bordero assigné"
      },
      "visuel_bordero_url": {
        "type": "string",
        "description": "URL du visuel officiel Bordero assigné"
      },
      "visuel_bordero_serie": {
        "type": "string",
        "description": "Numéro de série du visuel Bordero assigné"
      },
      "format_livre_bordero": {
        "type": "string",
        "enum": [
          "S",
          "M",
          "L"
        ],
        "description": "Format physique strict du livre pour le protocole Bordero"
      },
      "qr_code_token": {
        "type": "string",
        "description": "Jeton QR statique sécurisé Bordero"
      },
      "hash_securite": {
        "type": "string",
        "description": "Hash de sécurité calculé à partir de la commande, du lecteur et du format"
      },
      "recu_horodate": {
        "type": "string",
        "description": "Reçu numérique horodaté généré après validation"
      },
      "date_retrait": {
        "type": "string",
        "description": "Date ISO du retrait par le lecteur"
      },
      "alerte_securite_bordero": {
        "type": "string",
        "description": "Dernière alerte de sécurité Bordero"
      },
      "derniere_alerte_securite": {
        "type": "string",
        "description": "Date ISO de la dernière alerte de sécurité"
      },
      "date_limite_collecte": {
        "type": "string",
        "description": "Date limite sans pénalité (J+7 après arrivée relais)"
      },
      "date_arrivee_relais": {
        "type": "string",
        "description": "Date ISO de flashage à l'arrivée au relais — déclenche le compte à rebours"
      },
      "penalite_retard": {
        "type": "number",
        "default": 0,
        "description": "Pénalité cumulée en € (0,50€/jour après 7j) reversée au relais"
      },
      "jours_retard": {
        "type": "number",
        "default": 0,
        "description": "Nombre de jours de retard au-delà du délai de grâce de 7 jours"
      },
      "notes": {
        "type": "string"
      },
      "code_barre_isbn": {
        "type": "string"
      },
      "ticket_caisse_url": {
        "type": "string"
      },
      "ticket_montant": {
        "type": "number",
        "description": "Montant payé par le voyageur sur le ticket de caisse"
      },
      "ecart_prix_ticket": {
        "type": "number",
        "description": "Écart entre le prix Google séquestré et le montant du ticket"
      },
      "alerte_prix_livre": {
        "type": "string",
        "description": "Alerte admin si le prix du ticket diffère du prix séquestré ou si le prix Google est absent"
      },
      "scan_valide_par_voyageur": {
        "type": "boolean",
        "default": false
      },
      "validation_admin": {
        "type": "string",
        "enum": [
          "en_attente",
          "validee",
          "rejetee"
        ],
        "default": "en_attente"
      },
      "admin_notes": {
        "type": "string"
      },
      "notification_lecteur_envoyee": {
        "type": "boolean",
        "default": false
      },
      "prix_livre_neuf": {
        "type": "number",
        "default": 0,
        "description": "Prix du livre neuf facturé au lecteur depuis Google Books, hors livraison"
      },
      "prix_livre_a_rembourser": {
        "type": "boolean",
        "default": false,
        "description": "Prix Google absent : achat du livre à régulariser sur justificatif"
      },
      "remboursement_livre_libere": {
        "type": "boolean",
        "default": false,
        "description": "Indique si le prix du livre en séquestre a été libéré au voyageur"
      },
      "remboursement_livre_libere_le": {
        "type": "string",
        "description": "Date ISO de libération du remboursement livre au voyageur"
      },
      "montant_rembourse_voyageur": {
        "type": "number",
        "default": 0,
        "description": "Montant crédité au wallet voyageur lors du dépôt relais"
      },
      "frais_port_ref": {
        "type": "number",
        "description": "Montant de livraison facturé au lecteur, hors prix du livre"
      },
      "frais_bordereau": {
        "type": "number"
      },
      "economie_realisee": {
        "type": "number"
      },
      "code_secret": {
        "type": "string",
        "description": "Code secret 3 chiffres pour valider la remise physique"
      },
      "part_voyageur": {
        "type": "number"
      },
      "part_relais": {
        "type": "number"
      },
      "part_admin": {
        "type": "number"
      }
    },
    "required": [
      "lecteur_email",
      "livre_titre",
      "zone_nom",
      "mode_livraison"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "created_by_id": "{{user.id}}"
          },
          {
            "data.lecteur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "created_by_id": "{{user.id}}"
          },
          {
            "created_by": "{{user.email}}"
          },
          {
            "data.lecteur_email": "{{user.email}}"
          },
          {
            "$and": [
              {
                "data.voyageur_email": "{{user.email}}"
              },
              {
                "data.mode_livraison": "express"
              }
            ]
          },
          {
            "$and": [
              {
                "data.point_relais_id": "{{user.data.point_relais_id}}"
              },
              {
                "data.point_relais_id": {
                  "$exists": true
                }
              },
              {
                "data.point_relais_id": {
                  "$ne": ""
                }
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "update": {
        "$or": [
          {
            "$and": [
              {
                "created_by_id": "{{user.id}}"
              },
              {
                "data.statut": "en_attente_paiement"
              }
            ]
          },
          {
            "$and": [
              {
                "data.voyageur_email": "{{user.email}}"
              },
              {
                "data.mode_livraison": "express"
              }
            ]
          },
          {
            "$and": [
              {
                "data.point_relais_id": "{{user.data.point_relais_id}}"
              },
              {
                "data.point_relais_id": {
                  "$ne": ""
                }
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "delete": {
        "$or": [
          {
            "$and": [
              {
                "created_by_id": "{{user.id}}"
              },
              {
                "data.statut": "en_attente_paiement"
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      }
    }
  },
  "ImportIncident": {
    "properties": {
      "feed_id": {
        "type": "string"
      },
      "feed_name": {
        "type": "string"
      },
      "checkpoint_line": {
        "type": "number"
      },
      "product_identifier": {
        "type": "string"
      },
      "isbn13": {
        "type": "string"
      },
      "ean": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "cause": {
        "type": "string",
        "enum": [
          "non_book",
          "ean_invalide",
          "prix_absent",
          "titre_absent",
          "erreur_ecriture",
          "offre_refusee",
          "autre"
        ],
        "default": "autre"
      },
      "message_technique": {
        "type": "string"
      },
      "attempts": {
        "type": "number",
        "default": 0
      },
      "status": {
        "type": "string",
        "enum": [
          "parked",
          "retried",
          "resolved"
        ],
        "default": "parked"
      },
      "first_seen_at": {
        "type": "string"
      },
      "last_attempt_at": {
        "type": "string"
      },
      "batch_id": {
        "type": "string"
      }
    },
    "required": [
      "feed_id",
      "cause",
      "status",
      "first_seen_at"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "ImportLog": {
    "properties": {
      "started_at": {
        "type": "string"
      },
      "finished_at": {
        "type": "string"
      },
      "import_mode": {
        "type": "string",
        "enum": [
          "test",
          "full",
          "feed",
          "execution"
        ],
        "default": "full"
      },
      "feed_id": {
        "type": "string"
      },
      "feed_name": {
        "type": "string"
      },
      "current_feed_id": {
        "type": "string"
      },
      "products_processed": {
        "type": "number",
        "default": 0
      },
      "rows_rejected": {
        "type": "number",
        "default": 0
      },
      "books_created": {
        "type": "number",
        "default": 0
      },
      "books_updated": {
        "type": "number",
        "default": 0
      },
      "offers_created": {
        "type": "number",
        "default": 0
      },
      "offers_updated": {
        "type": "number",
        "default": 0
      },
      "duplicates": {
        "type": "number",
        "default": 0
      },
      "duplicates_in_feed": {
        "type": "number",
        "default": 0
      },
      "duplicates_cross_feed": {
        "type": "number",
        "default": 0
      },
      "errors": {
        "type": "number",
        "default": 0
      },
      "status": {
        "type": "string",
        "enum": [
          "running",
          "success",
          "failed",
          "partial"
        ],
        "default": "running"
      },
      "error_message": {
        "type": "string"
      },
      "source_retailer": {
        "type": "string"
      },
      "feed_size_bytes": {
        "type": "number"
      },
      "line_checkpoint": {
        "type": "number",
        "default": 0
      },
      "resume_from_line": {
        "type": "number",
        "default": 0
      },
      "test_limit": {
        "type": "number"
      },
      "control_report": {
        "type": "object",
        "description": "Rapport de contrôle du test import : doublons, rejets, offres et exemples"
      }
    },
    "required": [
      "started_at",
      "source_retailer",
      "status"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "ImportRejection": {
    "properties": {
      "ean_raw": {
        "type": "string"
      },
      "title": {
        "type": "string"
      },
      "category": {
        "type": "string"
      },
      "reason": {
        "type": "string",
        "enum": [
          "non_book",
          "ean_not_isbn",
          "invalid_isbn",
          "invalid_price",
          "missing_title"
        ]
      },
      "feed_id": {
        "type": "string"
      },
      "product_identifier": {
        "type": "string"
      },
      "identifier_type": {
        "type": "string",
        "enum": [
          "isbn13",
          "ean",
          "merchant_id"
        ]
      },
      "isbn_valid": {
        "type": "boolean"
      },
      "product_type": {
        "type": "string",
        "enum": [
          "livre",
          "produit_editorial"
        ]
      },
      "classification": {
        "type": "string",
        "enum": [
          "livre",
          "revue",
          "produit_editorial",
          "non_eligible"
        ]
      },
      "classification_previous": {
        "type": "string",
        "description": "Ancienne valeur de product_type avant reclassement"
      },
      "classification_updated_at": {
        "type": "string"
      },
      "classification_source": {
        "type": "string"
      },
      "import_date": {
        "type": "string"
      },
      "reviewed": {
        "type": "boolean",
        "default": false
      }
    },
    "required": [
      "reason",
      "feed_id",
      "import_date"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "ImportRun": {
    "properties": {
      "feed_id": {
        "type": "string",
        "description": "Identifiant du flux Cultura autorisé"
      },
      "feed_name": {
        "type": "string"
      },
      "feed_order": {
        "type": "number",
        "description": "Ordre strict de traitement de 1 à 5"
      },
      "checkpoint_line": {
        "type": "number",
        "default": 0,
        "description": "Dernière ligne CSV traitée pour reprise durable"
      },
      "status": {
        "type": "string",
        "enum": [
          "pending",
          "running",
          "paused",
          "completed",
          "failed"
        ],
        "default": "pending"
      },
      "stop_requested": {
        "type": "boolean",
        "default": false,
        "description": "Arrêt volontaire explicite demandé par Swanny; seul motif autorisé pour ne pas relancer automatiquement"
      },
      "stop_requested_at": {
        "type": "string"
      },
      "stop_requested_reason": {
        "type": "string"
      },
      "auto_recovery_attempts": {
        "type": "number",
        "default": 0,
        "description": "Nombre de tentatives de relance automatique depuis le dernier lot réussi"
      },
      "next_retry_at": {
        "type": "string",
        "description": "Date ISO de prochaine tentative automatique après échec technique"
      },
      "last_auto_recovery_at": {
        "type": "string"
      },
      "last_blockage_detected_at": {
        "type": "string"
      },
      "last_automation_beat": {
        "type": "string",
        "description": "Dernier déclenchement constaté de l'automatisation planifiée"
      },
      "last_automation_beat_result": {
        "type": "object",
        "description": "Résultat du dernier déclenchement: statut, durée, erreur, lots traités"
      },
      "last_global_check_at": {
        "type": "string",
        "description": "Dernier contrôle global complet volontaire ou horaire"
      },
      "lines_processed": {
        "type": "number",
        "default": 0
      },
      "books_created": {
        "type": "number",
        "default": 0
      },
      "books_updated": {
        "type": "number",
        "default": 0
      },
      "offers_created": {
        "type": "number",
        "default": 0
      },
      "offers_updated": {
        "type": "number",
        "default": 0
      },
      "rows_rejected": {
        "type": "number",
        "default": 0
      },
      "errors": {
        "type": "number",
        "default": 0
      },
      "checks_json": {
        "type": "object",
        "description": "Dernier rapport de contrôles automatiques"
      },
      "paused_reason": {
        "type": "string"
      },
      "started_at": {
        "type": "string"
      },
      "last_batch_at": {
        "type": "string"
      },
      "finished_at": {
        "type": "string"
      }
    },
    "required": [
      "feed_id",
      "feed_name",
      "feed_order",
      "status"
    ],
    "rls": {
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "MalleCollecte": {
    "properties": {
      "point_relais_id": {
        "type": "string",
        "description": "Point relais de destination de la malle Collecte"
      },
      "point_relais_nom": {
        "type": "string",
        "description": "Nom lisible du point relais de destination"
      },
      "gerant_email": {
        "type": "string",
        "description": "Email du gérant du point relais destinataire"
      },
      "descriptif_commandes": {
        "type": "string",
        "description": "Liste détaillée des livres du carton : lecteur, taille, titre et coût total de chaque commande"
      },
      "statut": {
        "type": "string",
        "enum": [
          "en_preparation",
          "en_transit",
          "arrivee_relais"
        ],
        "default": "en_preparation",
        "description": "Statut logistique de la malle Collecte gérée par Bordero"
      },
      "transporteur_assigne": {
        "type": "string",
        "description": "Transporteur ou prestataire assigné manuellement par l'admin Bordero"
      },
      "reference_suivi": {
        "type": "string",
        "description": "Référence de suivi du transporteur si disponible"
      },
      "poids_actuel_kg": {
        "type": "number",
        "default": 0,
        "description": "Poids cumulé de la malle Collecte"
      },
      "nombre_commandes": {
        "type": "number",
        "default": 0,
        "description": "Nombre de commandes Collecte rattachées à cette malle"
      },
      "capacite_commandes": {
        "type": "number",
        "default": 40,
        "description": "Capacité stricte du carton Collecte"
      },
      "numero_carton": {
        "type": "string",
        "description": "Référence opérationnelle du carton de 40 livres"
      },
      "seuil_atteint_le": {
        "type": "string",
        "description": "Date ISO à laquelle les 40 livres ont été réunis"
      },
      "date_fermeture": {
        "type": "string",
        "description": "Date ISO de fermeture de la malle"
      },
      "date_depart": {
        "type": "string",
        "description": "Date ISO de départ de la malle"
      },
      "date_arrivee_relais": {
        "type": "string",
        "description": "Date ISO d'arrivée au point relais"
      },
      "notes_admin": {
        "type": "string"
      }
    },
    "required": [
      "point_relais_id",
      "statut"
    ],
    "rls": {
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "read": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          },
          {
            "$and": [
              {
                "data.point_relais_id": "{{user.data.point_relais_id}}"
              },
              {
                "data.point_relais_id": {
                  "$ne": ""
                }
              }
            ]
          }
        ]
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "MissionVoyageur": {
    "properties": {
      "voyageur_email": {
        "type": "string",
        "description": "Email du voyageur"
      },
      "commande_id": {
        "type": "string",
        "description": "ID de la commande associée"
      },
      "commande_livre_ref": {
        "type": "string",
        "description": "Clé idempotente commande + livre pour empêcher les doublons"
      },
      "mode_livraison": {
        "type": "string",
        "enum": [
          "express",
          "collectif"
        ],
        "default": "express",
        "description": "Les voyageurs ne voient et n'acceptent que les missions express"
      },
      "livre": {
        "type": "string",
        "description": "Titre du livre"
      },
      "auteur": {
        "type": "string"
      },
      "type": {
        "type": "string",
        "enum": [
          "Poche",
          "Broché",
          "BD",
          "Relié"
        ],
        "default": "Poche"
      },
      "poids": {
        "type": "string"
      },
      "ville_destination": {
        "type": "string"
      },
      "zone_id": {
        "type": "string"
      },
      "point_relais_id": {
        "type": "string"
      },
      "point_relais_nom": {
        "type": "string"
      },
      "depart_ville": {
        "type": "string"
      },
      "trajet_label": {
        "type": "string"
      },
      "date_limite": {
        "type": "string"
      },
      "annonce_expire_at": {
        "type": "string",
        "description": "Date ISO d'expiration après 7 jours sans prise en charge"
      },
      "expiree_at": {
        "type": "string"
      },
      "acceptee_at": {
        "type": "string"
      },
      "deposee_relais_at": {
        "type": "string"
      },
      "retiree_at": {
        "type": "string"
      },
      "annulee_at": {
        "type": "string"
      },
      "annulation_source": {
        "type": "string"
      },
      "annonce_anonyme": {
        "type": "boolean",
        "default": true
      },
      "annonce_source": {
        "type": "string"
      },
      "statut": {
        "type": "string",
        "enum": [
          "disponible",
          "acceptee",
          "engagee",
          "en_transit",
          "deposee_relais",
          "livree",
          "retiree",
          "expiree",
          "annulee"
        ],
        "default": "disponible"
      },
      "numero_ordre": {
        "type": "number",
        "description": "Position dans la valise du voyageur (1-10)"
      },
      "commission": {
        "type": "number",
        "description": "Montant de la commission pour ce livre"
      },
      "ticket_url": {
        "type": "string",
        "description": "URL du ticket de caisse scanné"
      },
      "justificatif_photo_uri": {
        "type": "string",
        "description": "Fichier privé du justificatif photo associé à la mission"
      },
      "justificatif_photo_nom": {
        "type": "string",
        "description": "Nom du fichier justificatif photo"
      },
      "justificatif_photo_date": {
        "type": "string",
        "description": "Date ISO d'envoi du justificatif photo"
      }
    },
    "required": [
      "livre",
      "ville_destination"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "data.voyageur_email": "{{user.email}}"
          },
          {
            "$and": [
              {
                "data.mode_livraison": "express"
              },
              {
                "data.statut": {
                  "$in": [
                    "disponible",
                    "expiree"
                  ]
                }
              },
              {
                "$or": [
                  {
                    "user_condition": {
                      "role": "voyageur"
                    }
                  },
                  {
                    "user_condition": {
                      "role": "admin"
                    }
                  },
                  {
                    "user_condition": {
                      "role": "admin_secondaire"
                    }
                  }
                ]
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "update": {
        "$or": [
          {
            "data.voyageur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "delete": {
        "$or": [
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      }
    }
  },
  "NotationVoyageur": {
    "properties": {
      "mission_id": {
        "type": "string",
        "description": "ID de la MissionVoyageur notée"
      },
      "commande_id": {
        "type": "string",
        "description": "ID de la Commande associée"
      },
      "voyageur_email": {
        "type": "string",
        "description": "Email du voyageur noté"
      },
      "lecteur_email": {
        "type": "string",
        "description": "Email du lecteur qui note"
      },
      "note_ponctualite": {
        "type": "number",
        "description": "Note de 1 à 5 étoiles pour la ponctualité"
      },
      "note_soin": {
        "type": "number",
        "description": "Note de 1 à 5 étoiles pour le soin apporté au livre"
      },
      "commentaire": {
        "type": "string",
        "description": "Commentaire libre du lecteur"
      },
      "livre_titre": {
        "type": "string"
      }
    },
    "required": [
      "voyageur_email",
      "lecteur_email",
      "note_ponctualite"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "data.lecteur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "data.lecteur_email": "{{user.email}}"
          },
          {
            "data.voyageur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "PointRelais": {
    "properties": {
      "nom": {
        "type": "string",
        "description": "Nom du commerce partenaire"
      },
      "identifiant_connexion": {
        "type": "string",
        "description": "Identifiant relais souhaité pour repérer le compte commerce"
      },
      "adresse": {
        "type": "string"
      },
      "ville": {
        "type": "string"
      },
      "pays_code": {
        "type": "string",
        "description": "Code ISO pays"
      },
      "pays_nom": {
        "type": "string",
        "description": "Pays du commerce partenaire"
      },
      "type_commerce": {
        "type": "string",
        "enum": [
          "Boulangerie",
          "Café",
          "Restaurant"
        ],
        "description": "Type de commerce candidat Point Relais"
      },
      "zone_id": {
        "type": "string",
        "description": "Référence vers ZonesTarifs"
      },
      "gerant_email": {
        "type": "string",
        "description": "Email du gérant (compte relais)"
      },
      "validation_admin": {
        "type": "string",
        "enum": [
          "en_attente",
          "valide",
          "rejete"
        ],
        "default": "en_attente",
        "description": "Validation administrateur obligatoire avant accès relais"
      },
      "telephone": {
        "type": "string"
      },
      "horaires": {
        "type": "string",
        "description": "Ex: Lun-Sam 9h-19h"
      },
      "stock_actuel": {
        "type": "number",
        "default": 0,
        "description": "Nombre de colis actuellement en stock"
      },
      "actif": {
        "type": "boolean",
        "default": false
      },
      "note_moyenne": {
        "type": "number",
        "description": "Note de satisfaction (1-5)"
      }
    },
    "required": [
      "nom",
      "adresse",
      "ville",
      "pays_code",
      "type_commerce",
      "gerant_email",
      "telephone",
      "horaires"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "data.gerant_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "$and": [
              {
                "data.actif": true
              },
              {
                "data.validation_admin": "valide"
              }
            ]
          },
          {
            "data.gerant_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "update": {
        "$or": [
          {
            "$and": [
              {
                "data.gerant_email": "{{user.email}}"
              },
              {
                "data.validation_admin": {
                  "$in": [
                    "en_attente",
                    "rejete"
                  ]
                }
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "ShippingRates": {
    "properties": {
      "zone_id": {
        "type": "string",
        "description": "Référence vers ZonesTarifs (zone_nom ou ID)"
      },
      "zone_nom": {
        "type": "string",
        "description": "Nom de la zone (ex: Miami, Abidjan)"
      },
      "poids_max_kg": {
        "type": "number",
        "description": "Poids maximum pour ce tarif (ex: 0.5, 1, 2)"
      },
      "prix_ups_express": {
        "type": "number",
        "description": "Tarif UPS/FedEx Express de référence en EUR"
      },
      "prix_amazon_fnac": {
        "type": "number",
        "description": "Frais de port moyens Amazon/Fnac international de référence en EUR"
      },
      "actif": {
        "type": "boolean",
        "default": true
      },
      "notes": {
        "type": "string",
        "description": "Notes (ex: mise à jour Q1 2026)"
      }
    },
    "required": [
      "zone_nom",
      "poids_max_kg",
      "prix_ups_express"
    ],
    "rls": {
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "read": null,
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "User": {
    "properties": {
      "role": {
        "type": "string",
        "enum": [
          "lecteur",
          "voyageur",
          "relais",
          "admin",
          "admin_secondaire"
        ],
        "default": "lecteur",
        "description": "Rôle de l'utilisateur dans l'application"
      },
      "preferred_language": {
        "type": "string",
        "enum": [
          "fr",
          "en",
          "es"
        ],
        "default": "fr",
        "description": "Langue préférée de l'utilisateur"
      },
      "role_prompt_seen": {
        "type": "boolean",
        "default": false,
        "description": "Indique si l'utilisateur a déjà vu le choix de rôle"
      },
      "nom": {
        "type": "string",
        "description": "Nom de famille de l'utilisateur"
      },
      "prenom": {
        "type": "string",
        "description": "Prénom de l'utilisateur"
      },
      "telephone": {
        "type": "string",
        "description": "Numéro de téléphone de contact"
      },
      "identifiant_connexion": {
        "type": "string",
        "description": "Identifiant choisi pour retrouver facilement son compte"
      },
      "position_gps": {
        "type": "string",
        "description": "Position GPS déclarée par le lecteur"
      },
      "lecteur_profile_complete": {
        "type": "boolean",
        "default": false,
        "description": "Indique si la fiche d'accès lecteur est complétée"
      },
      "voyageur_destination": {
        "type": "string",
        "description": "Destination principale choisie par le voyageur"
      },
      "adresse_mail_contact": {
        "type": "string",
        "description": "Adresse mail de contact confirmée pour le profil"
      },
      "voyageur_profile_complete": {
        "type": "boolean",
        "default": false,
        "description": "Indique si la fiche d'accès voyageur est complétée"
      },
      "relais_valide": {
        "type": "boolean",
        "default": false,
        "description": "Indique si l'administrateur a validé l'accès Point Relais"
      },
      "relais_validation_status": {
        "type": "string",
        "enum": [
          "aucune",
          "en_attente",
          "valide",
          "rejete"
        ],
        "default": "aucune",
        "description": "Statut de validation administrateur pour le rôle Point Relais"
      },
      "relais_validation_notes": {
        "type": "string",
        "description": "Notes administrateur liées à la validation relais"
      },
      "relais_valide_le": {
        "type": "string",
        "description": "Date ISO de validation du rôle Point Relais"
      },
      "relais_nom_boutique": {
        "type": "string",
        "description": "Nom de la boutique candidate Point Relais"
      },
      "relais_adresse": {
        "type": "string",
        "description": "Adresse complète de la boutique candidate Point Relais"
      },
      "relais_ville": {
        "type": "string",
        "description": "Ville de la boutique candidate Point Relais"
      },
      "relais_pays": {
        "type": "string",
        "description": "Pays de la boutique candidate Point Relais"
      },
      "relais_type_commerce": {
        "type": "string",
        "enum": [
          "Boulangerie",
          "Café",
          "Restaurant"
        ],
        "description": "Type de commerce candidat Point Relais"
      },
      "relais_telephone": {
        "type": "string",
        "description": "Téléphone de la boutique candidate Point Relais"
      },
      "relais_horaires": {
        "type": "string",
        "description": "Horaires d'ouverture de la boutique candidate Point Relais"
      },
      "voyageur_valide": {
        "type": "boolean",
        "default": false,
        "description": "Indique si l'administrateur a validé le profil voyageur"
      },
      "voyageur_validation_status": {
        "type": "string",
        "enum": [
          "aucune",
          "en_attente",
          "valide",
          "suspendu",
          "bloque"
        ],
        "default": "aucune",
        "description": "Statut de validation administrateur pour le rôle Voyageur"
      },
      "voyageur_validation_notes": {
        "type": "string",
        "description": "Notes administrateur liées à la validation voyageur"
      },
      "voyageur_valide_le": {
        "type": "string",
        "description": "Date ISO de validation du voyageur"
      },
      "voyageur_tentatives_validation": {
        "type": "number",
        "default": 0,
        "description": "Nombre de justificatifs de vol soumis pour validation"
      },
      "voyageur_bloque": {
        "type": "boolean",
        "default": false,
        "description": "Indique si le voyageur est bloqué après fraude ou trop de tentatives"
      },
      "voyageur_fraude_signalee": {
        "type": "boolean",
        "default": false,
        "description": "Indique une tentative frauduleuse signalée par l'administrateur"
      },
      "ville_destination": {
        "type": "string",
        "description": "Ville de destination préférée (pour lecteurs)"
      },
      "point_relais_id": {
        "type": "string",
        "description": "Point relais associé (pour gérants de relais validés)"
      },
      "iban": {
        "type": "string",
        "description": "IBAN pour les virements (voyageurs et relais)"
      },
      "stripe_account_id": {
        "type": "string",
        "description": "ID compte Stripe Connect"
      },
      "documents_valides": {
        "type": "boolean",
        "default": false,
        "description": "KYC validé"
      },
      "virement_suspendu": {
        "type": "boolean",
        "default": false
      }
    },
    "required": [],
    "rls": "__absent__"
  },
  "VisuelBordero": {
    "properties": {
      "serie": {
        "type": "string",
        "description": "Numéro de série officiel du visuel Bordero, ex: S25"
      },
      "taille": {
        "type": "string",
        "enum": [
          "S",
          "M",
          "L"
        ],
        "description": "Format physique strict du livre: S=Poche, M=Broché, L=BD/Relié"
      },
      "image_url": {
        "type": "string",
        "description": "URL du visuel officiel Bordero"
      },
      "animal": {
        "type": "string"
      },
      "citation": {
        "type": "string"
      },
      "actif": {
        "type": "boolean",
        "default": true
      }
    },
    "required": [
      "serie",
      "taille",
      "image_url"
    ],
    "rls": {
      "read": {},
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "Voyage": {
    "properties": {
      "voyageur_email": {
        "type": "string",
        "description": "Email du voyageur ayant déclaré le vol"
      },
      "depart_ville": {
        "type": "string",
        "description": "Ville de départ du vol"
      },
      "arrivee_ville": {
        "type": "string",
        "description": "Ville d'arrivée du vol"
      },
      "date_vol": {
        "type": "string",
        "format": "date",
        "description": "Date du vol"
      },
      "confirmation_vol_url": {
        "type": "string",
        "description": "Justificatif transmis par le voyageur : email, PDF ou capture de confirmation du vol futur"
      },
      "confirmation_vol_nom": {
        "type": "string",
        "description": "Nom du fichier justificatif transmis"
      },
      "validation_admin": {
        "type": "string",
        "enum": [
          "en_attente",
          "valide",
          "suspendu",
          "bloque"
        ],
        "default": "en_attente",
        "description": "Statut de validation administrateur du voyageur pour ce vol"
      },
      "tentative_validation": {
        "type": "number",
        "default": 1,
        "description": "Numéro de tentative de validation du voyageur"
      },
      "admin_notes": {
        "type": "string",
        "description": "Notes administrateur sur la validation ou la suspension"
      },
      "fraude_signalee": {
        "type": "boolean",
        "default": false,
        "description": "Indique une tentative considérée comme frauduleuse"
      },
      "validation_date": {
        "type": "string",
        "description": "Date ISO de décision administrateur"
      },
      "actif": {
        "type": "boolean",
        "default": false,
        "description": "Indique si le vol est validé et utilisable pour accepter des missions"
      }
    },
    "required": [
      "voyageur_email",
      "depart_ville",
      "arrivee_ville",
      "date_vol"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "$and": [
              {
                "data.voyageur_email": "{{user.email}}"
              },
              {
                "data.validation_admin": "en_attente"
              },
              {
                "data.actif": false
              }
            ]
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "data.voyageur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          },
          {
            "user_condition": {
              "role": "admin_secondaire"
            }
          }
        ]
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "$or": [
          {
            "data.voyageur_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      }
    }
  },
  "VoyageurBadge": {
    "properties": {
      "user_email": {
        "type": "string",
        "description": "Email du voyageur"
      },
      "badge_id": {
        "type": "string",
        "description": "Identifiant unique du badge (ex: premier_livre, grand_lecteur)"
      },
      "badge_nom": {
        "type": "string",
        "description": "Nom affiché du badge"
      },
      "badge_emoji": {
        "type": "string",
        "description": "Emoji représentant le badge"
      },
      "debloque_le": {
        "type": "string",
        "description": "Date de déverrouillage"
      }
    },
    "required": [
      "user_email",
      "badge_id",
      "badge_nom"
    ],
    "rls": {
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "read": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "VoyageurWallet": {
    "properties": {
      "user_email": {
        "type": "string",
        "description": "Email du voyageur"
      },
      "solde_disponible": {
        "type": "number",
        "default": 0,
        "description": "Gains confirmés disponibles pour virement"
      },
      "gains_previsionnels": {
        "type": "number",
        "default": 0,
        "description": "Gains en attente de confirmation relais"
      },
      "livres_actifs": {
        "type": "number",
        "default": 0,
        "description": "Nombre de livres en cours de transport (max 10)"
      },
      "virement_suspendu": {
        "type": "boolean",
        "default": false,
        "description": "Suspendu suite à un signalement relais"
      },
      "trajet_actif": {
        "type": "string",
        "description": "Ex: Paris → Miami · 28 Avril 2026"
      },
      "demande_virement_methode": {
        "type": "string",
        "enum": [
          "paypal",
          "stripe"
        ],
        "description": "Méthode demandée pour réclamer les gains"
      },
      "demande_virement_statut": {
        "type": "string",
        "enum": [
          "aucune",
          "en_attente",
          "traitee",
          "rejetee"
        ],
        "default": "aucune",
        "description": "Statut de la demande de paiement voyageur"
      },
      "demande_virement_montant": {
        "type": "number",
        "description": "Montant réclamé par le voyageur"
      },
      "demande_virement_le": {
        "type": "string",
        "description": "Date ISO de la demande de paiement"
      }
    },
    "required": [
      "user_email"
    ],
    "rls": {
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "read": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  },
  "WishlistItem": {
    "properties": {
      "user_email": {
        "type": "string",
        "description": "Email du lecteur propriétaire de cette envie"
      },
      "title": {
        "type": "string",
        "description": "Titre du livre souhaité"
      },
      "author": {
        "type": "string",
        "description": "Auteur du livre"
      },
      "price": {
        "type": "number",
        "default": 0,
        "description": "Prix estimé ou constaté"
      },
      "popularity": {
        "type": "number",
        "default": 0,
        "description": "Score de popularité pour le tri"
      },
      "cover_url": {
        "type": "string",
        "description": "URL de couverture du livre"
      }
    },
    "required": [
      "user_email",
      "title"
    ],
    "rls": {
      "create": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "read": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "update": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      },
      "delete": {
        "$or": [
          {
            "data.user_email": "{{user.email}}"
          },
          {
            "user_condition": {
              "role": "admin"
            }
          }
        ]
      }
    }
  },
  "ZonesTarifs": {
    "properties": {
      "zone_nom": {
        "type": "string",
        "description": "Nom de la destination (ex: Miami, Abidjan)"
      },
      "pays_code": {
        "type": "string",
        "description": "Code ISO pays (US, CA, CI, FR...)"
      },
      "pays_nom": {
        "type": "string",
        "description": "Nom complet du pays"
      },
      "frais_lecteur_express": {
        "type": "number",
        "description": "Prix total payé par le lecteur en mode Express"
      },
      "frais_lecteur_collectif": {
        "type": "number",
        "description": "Prix réduit payé par le lecteur en mode Collectif"
      },
      "part_voyageur_express": {
        "type": "number",
        "description": "Rémunération fixe versée au voyageur"
      },
      "part_relais": {
        "type": "number",
        "description": "Rémunération fixe versée au point relais partenaire"
      },
      "cout_fret_estime_kg": {
        "type": "number",
        "description": "Coût de transport moyen par kg pour le mode Collectif"
      },
      "taxe_assurance": {
        "type": "number",
        "description": "Provision pour risque pays (ex: 0.50 pour USA, 1.50 pour CI)"
      },
      "devise": {
        "type": "string",
        "description": "Devise locale d'affichage (USD, CAD, XOF, EUR)"
      },
      "actif": {
        "type": "boolean",
        "default": true,
        "description": "Zone active ou désactivée"
      },
      "emoji_drapeau": {
        "type": "string",
        "description": "Emoji drapeau pour l'affichage (ex: 🇺🇸)"
      }
    },
    "required": [
      "zone_nom",
      "pays_code",
      "frais_lecteur_express",
      "frais_lecteur_collectif"
    ],
    "rls": {
      "create": {
        "user_condition": {
          "role": "admin"
        }
      },
      "read": null,
      "update": {
        "user_condition": {
          "role": "admin"
        }
      },
      "delete": {
        "user_condition": {
          "role": "admin"
        }
      }
    }
  }
} as const;

export type EntityName = keyof typeof ENTITY_SCHEMAS;
export const ENTITY_NAMES = Object.keys(ENTITY_SCHEMAS) as EntityName[];
