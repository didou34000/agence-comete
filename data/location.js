// Catalogue unique : données utilisées par les pages, le formulaire et l’API.
// Accessoires : enabled=false masque l’option ; price=null affiche « sur demande ».
export const rentalContact = { email: 'contact@southconciergerie.fr', phone: '07 67 37 70 14', phoneHref: '+33767377014' };
export const durations = { 'demi-journee': 'Demi-journée', journee: 'Journée', plusieurs: 'Plusieurs jours' };
const accessory = (id, name) => ({ id, name, enabled: true, price: null, availability: 'sur-demande' });
export const products = [
  {
    id: 'insta360-x5', slug: 'location-insta360-x5-montpellier', name: 'Insta360 X5', brand: 'Insta360', category: 'Caméra 360° · 8K', number: '01',
    tagline: 'Filmez tout. Choisissez votre cadrage après.', halfDayPrice: 25, dayPrice: 39, deposit: 650,
    description: 'La X5 filme tout autour de vous en une seule prise. Après, choisissez ce qui entre dans le cadre : vous, la route ou le paysage. Une même séquence peut devenir une vidéo verticale pour Instagram ou un plan large pour YouTube.',
    highlights: ['Vidéo 360° en 8K', 'Recadrage après la prise', 'Stabilisation en mouvement'],
    uses: ['Voiture & road trip', 'Moto & vélo', 'Sport', 'Voyage', 'Immobilier', 'Événement', 'TikTok, Reels & YouTube'],
    choice: 'Pour l’action, la voiture, le sport et les points de vue qui sortent du cadre.',
    specifications: [['Vidéo 360°', '8K à 30 i/s · 5,7K jusqu’à 60 i/s'], ['Photo 360°', 'Jusqu’à 72 MP'], ['Capteurs', 'Deux capteurs 1/1,28 pouce'], ['Stabilisation', 'FlowState et maintien de l’horizon'], ['Création', 'Recadrage après enregistrement · effet perche invisible'], ['Écran', 'Tactile, 2,5 pouces'], ['Poids', 'Environ 200 g']],
    includedAccessories: ['Insta360 X5', 'Batterie', 'Câble de recharge', 'Protection / housse'],
    inclusionNote: 'Carte microSD et perche invisible : présence et conditions à confirmer lors de la réservation.',
    optionalAccessories: [accessory('ventouse', 'Support voiture / ventouse'), accessory('perche', 'Perche invisible'), accessory('grande-perche', 'Grande perche type faux drone'), accessory('batterie-x5', 'Batterie supplémentaire'), accessory('chargeur-x5', 'Chargeur'), accessory('microsd-x5', 'Carte microSD supplémentaire'), accessory('casque', 'Fixation casque'), accessory('guidon', 'Fixation guidon / moto / vélo')],
    image: '/assets/img/location/insta360-x5.webp', imageAlt: 'Insta360 X5 noire, caméra 360° disponible à la location à Montpellier',
    seoTitle: 'Location caméra Insta360 X5 Montpellier | L’Agence du Sud', seoDescription: 'Louez une Insta360 X5 à Montpellier : 25 € la demi-journée, 39 € la journée. Caméra 360° 8K, accessoires sur demande et retrait sur rendez-vous.',
    source: 'https://onlinemanual.insta360.com/x5/fr-fr/faq/specs/hardware'
  },
  {
    id: 'ray-ban-meta', slug: 'location-ray-ban-meta-montpellier', name: 'Ray-Ban Meta Gen 2', brand: 'Ray-Ban', category: 'Lunettes connectées · POV', number: '02',
    tagline: 'Votre point de vue, sans tenir une caméra.', halfDayPrice: 20, dayPrice: 30, deposit: 500,
    description: 'Filmez exactement ce que vous voyez. Une balade, les coulisses d’un événement, une journée entre amis : les lunettes capturent votre point de vue pendant que vos mains restent libres. Les photos et vidéos se récupèrent ensuite sur votre téléphone.',
    highlights: ['Vidéo Ultra HD 3K', 'Mains libres', 'Étui de recharge inclus'],
    uses: ['Voyage', 'Événement', 'Vlog & lifestyle', 'TikTok & Reels', 'Journée entre amis', 'Sport léger'],
    choice: 'Pour filmer naturellement en POV, vivre le moment et garder les mains libres.',
    specifications: [['Caméra', 'Grand-angle 12 MP'], ['Vidéo', 'Ultra HD 3K'], ['Autonomie', 'Jusqu’à 8 heures en utilisation modérée, variable selon l’usage'], ['Stockage', '32 Go · plus de 500 photos ou 100 vidéos de 30 secondes selon l’usage'], ['Son', 'Audio intégré · 5 microphones'], ['Connexion', 'Bluetooth 5.3 · Wi-Fi 6E'], ['Commandes', 'Tactiles et vocales · Meta AI'], ['Recharge', 'Étui de recharge fourni']],
    includedAccessories: ['Ray-Ban Meta Gen 2', 'Étui de recharge', 'Chiffon microfibre'], inclusionNote: 'Le modèle de monture et les verres sont précisés lors de la confirmation. Visuel illustratif du modèle.', optionalAccessories: [],
    image: '/assets/img/location/ray-ban-meta.webp', imageAlt: 'Lunettes Ray-Ban Meta Gen 2, pour filmer en vue subjective sans les mains',
    seoTitle: 'Location Ray-Ban Meta Gen 2 Montpellier | L’Agence du Sud', seoDescription: 'Louez des Ray-Ban Meta Gen 2 à Montpellier : 20 € la demi-journée, 30 € la journée. Vidéo POV mains libres et étui de recharge inclus.',
    source: 'https://about.fb.com/fr/news/2025/09/ray-ban-meta-gen-2-desormais-disponible-avec-une-autonomie-jusqua-deux-fois-superieure-et-une-meilleure-capture-video/'
  },
  {
    id: 'dji-mini-2-se', slug: 'location-drone-dji-mini-2-se-montpellier', name: 'DJI Mini 2 SE', brand: 'DJI', category: 'Drone · Vue aérienne', number: '03',
    tagline: 'Prenez de la hauteur.', halfDayPrice: 25, dayPrice: 35, deposit: 400,
    description: 'Un paysage, une propriété, une route qui serpente : le Mini 2 SE donne une autre échelle à vos images. Sa nacelle stabilise la caméra sur trois axes pour des mouvements fluides, même quand vous découvrez la prise de vue aérienne.',
    highlights: ['Vidéo 2,7K', 'Nacelle stabilisée 3 axes', 'Environ 246 g'],
    uses: ['Paysage & voyage', 'Immobilier', 'Contenu automobile', 'Réseaux sociaux', 'Souvenirs de vacances', 'Extérieur, en zone autorisée'],
    choice: 'Pour les images aériennes, les paysages et les plans qui prennent du recul.',
    specifications: [['Poids', 'Environ 246 g'], ['Classe européenne', 'C0 selon la fiche DJI ; marquage de l’appareil remis à vérifier'], ['Capteur', 'CMOS 1/2,3 pouce · 12 MP'], ['Vidéo', '2,7K à 30 i/s · Full HD jusqu’à 60 i/s'], ['Photo', 'JPEG et RAW'], ['Stabilisation', 'Nacelle mécanique sur 3 axes'], ['Autonomie maximale', 'Jusqu’à 31 minutes par batterie dans les conditions de référence DJI'], ['Vent', 'Résistance niveau 5'], ['QuickShots', 'Dronie, Helix, Rocket, Circle et Boomerang']],
    includedAccessories: ['DJI Mini 2 SE', 'Radiocommande', 'Batterie', 'Câbles', 'Sac / protection'], inclusionNote: 'Le contenu exact et les accessoires disponibles sont confirmés avant le retrait.',
    optionalAccessories: [accessory('batterie-dji', 'Batterie supplémentaire'), accessory('pack-batteries', 'Pack plusieurs batteries'), accessory('microsd-dji', 'Carte microSD'), accessory('helices', 'Hélices de rechange'), accessory('hub', 'Chargeur / hub de charge')],
    image: '/assets/img/location/dji-mini-2-se.webp', imageAlt: 'Drone DJI Mini 2 SE déplié, avec sa caméra stabilisée',
    seoTitle: 'Location drone DJI Mini 2 SE Montpellier | L’Agence du Sud', seoDescription: 'Location de drone DJI Mini 2 SE à Montpellier : 25 € la demi-journée, 35 € la journée. Vidéo 2,7K, retrait sur rendez-vous et accessoires sur demande.',
    source: 'https://www.dji.com/support/product/mini-2-se'
  }
];
export const packs = [
 {id:'createur',name:'Pack créateur',description:'Ray-Ban Meta + Insta360 X5',products:['ray-ban-meta','insta360-x5'],accessories:[],price:null},
 {id:'road-trip',name:'Pack road trip',description:'Insta360 X5 + support voiture',products:['insta360-x5'],accessories:['ventouse'],price:null},
 {id:'ultimate',name:'Pack ultimate',description:'Insta360 X5 + Ray-Ban Meta + DJI Mini 2 SE',products:['insta360-x5','ray-ban-meta','dji-mini-2-se'],accessories:[],price:null}
];
export const faqs = [
 ['Quel matériel vidéo peut-on louer à Montpellier ?', 'Une Insta360 X5 pour la vidéo 360°, des Ray-Ban Meta Gen 2 pour filmer en POV et un drone DJI Mini 2 SE pour les vues aériennes. Chaque demande fait l’objet d’une confirmation de disponibilité.'],
 ['Peut-on louer le matériel uniquement pour une demi-journée ?', 'Oui. Les trois appareils sont proposés à la demi-journée ou à la journée. Pour plusieurs jours, indiquez les dates dans votre message : nous vous préparons un tarif adapté. Les horaires sont fixés ensemble.'],
 ['Comment fonctionne la caution ?', `Un dépôt de garantie est demandé lors du retrait du matériel. Sauf incident, il n’est pas encaissé. Comptez ${products[0].deposit} € pour la X5, ${products[1].deposit} € pour les Ray-Ban Meta et ${products[2].deposit} € pour le DJI. Le mode de dépôt est précisé avant la location.`],
 ['Les accessoires sont-ils inclus ?', 'Chaque fiche distingue le matériel de base fourni des options. La disponibilité et le tarif des accessoires sont confirmés avant la réservation. Aucune option n’est ajoutée sans votre accord.'],
 ['Peut-on louer une Insta360 pour filmer une voiture ?', 'Oui, avec un support adapté. Demandez le pack voiture : X5 et support à ventouse, sous réserve de disponibilité. La fixation doit être sécurisée et utilisée conformément aux consignes du fabricant.'],
 ['Comment utiliser les Ray-Ban Meta pendant une location ?', 'Prévoyez un smartphone compatible, l’application Meta AI et un compte Meta. Associez les lunettes, puis transférez vos contenus avant de les rendre. Les lunettes sont réinitialisées entre deux locations.'],
 ['Faut-il une carte SD ?', 'La X5 et le DJI nécessitent une carte microSD compatible. Demandez-nous si une carte est disponible pour votre créneau. Les Ray-Ban Meta utilisent leur stockage interne.'],
 ['Où récupérer le matériel ?', 'Le retrait se fait sur rendez-vous à Montpellier. L’adresse et le créneau vous sont communiqués lors de la confirmation. La location est proposée à Montpellier et aux alentours.'],
 ['Peut-on louer plusieurs appareils en même temps ?', 'Oui. Sélectionnez plusieurs appareils dans le formulaire ou demandez un pack. Nous vérifions leur disponibilité ensemble et vous communiquons le tarif.'],
 ['Quelles règles faut-il respecter avec le drone ?', 'Le vol reste sous la responsabilité du télépilote. Vérifiez la réglementation et les restrictions locales avant chaque vol. Un drone de moins de 250 g ne peut pas voler partout. Consultez les informations officielles de la DGAC.']
];
