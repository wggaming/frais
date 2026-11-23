/* Réglages communs à toutes les pages de « Ce que me coûtent mes frais ».
   C'est le seul endroit où changer le prix affiché, le lien de paiement ou l'adresse de contact
   (sauf legal.html, qui garde sa propre copie de l'adresse et du prix dans son bloc « Identité du vendeur »). */
var PAYMENT_URL = 'https://payment-links.mollie.com/payment/tV4G8T85wTPEpCfNRntAN';  // lien de paiement Mollie à 1 € (réutilisable, redirige vers merci.html?t=…)
var PRICE_LABEL = '1 €';                                                              // prix affiché
var CONTACT_EMAIL = 'matthieu@wagramconseil.fr';                                     // adresse de contact
var FORM_KEY = '77a148e4-eed9-4a7d-8f58-e513b927e632';                               // clé publique Web3Forms (formulaire d'achat)

/* Remplit les liens de contact (class="js-mail") et les prix (class="js-price") de la page. */
Array.prototype.forEach.call(document.querySelectorAll('.js-mail'), function (a) { a.href = 'mailto:' + CONTACT_EMAIL; a.textContent = CONTACT_EMAIL; });
Array.prototype.forEach.call(document.querySelectorAll('.js-price'), function (e) { e.textContent = PRICE_LABEL; });
