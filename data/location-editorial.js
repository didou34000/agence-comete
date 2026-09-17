// Contenu propre à chaque location ; les montants restent issus du catalogue.
export const rentalContentUpdated = '2026-09-17';

export function productEditorial(p) {
  const shared = [
    [`Quel est le tarif de location pour ${p.name} à Montpellier ?`, `La location coûte ${p.halfDayPrice} € la demi-journée ou ${p.dayPrice} € la journée. Le dépôt de garantie est de ${p.deposit} €. Les accessoires en option et les locations de plusieurs jours font l’objet d’une proposition avant confirmation.`],
    [`Peut-on louer ce matériel pour un week-end ?`, 'Vous pouvez demander plusieurs jours de location. Indiquez vos dates de départ et de retour dans le formulaire : nous vérifions la disponibilité et vous communiquons le tarif total. Les créneaux de retrait et de restitution sont convenus ensemble.'],
    ['Où se fait le retrait à Montpellier ?', 'Le matériel est remis sur rendez-vous à Montpellier. L’adresse précise et les horaires vous sont transmis après confirmation de la disponibilité. Vous pouvez venir d’une commune voisine ; le lieu de retrait reste Montpellier.']
  ];
  const content = {
    'insta360-x5': {
      heading: 'Louer une caméra 360° pour la voiture, le sport ou le voyage',
      intro: 'Vous souhaitez rapporter plusieurs angles d’une sortie sans multiplier les appareils ? La location de l’Insta360 X5 permet de filmer la scène à 360°, puis de choisir le point de vue à conserver. Prévoyez aussi un moment après le tournage pour trier et recadrer vos séquences.',
      uses: [
        ['Voiture, moto et road trip', 'Pour un trajet ou une présentation de véhicule, pensez d’abord à la fixation. Le support voiture à ventouse, les fixations guidon et casque se demandent en option. Décrivez votre installation avant de réserver : les accessoires disponibles et leur tarif sont confirmés avec vous.'],
        ['Sport et souvenirs de vacances', 'La capture à 360° permet de choisir entre le sujet et ce qui l’entoure après la prise. Une perche invisible peut compléter la caméra pour varier les points de vue. Elle reste une option à demander ; elle n’est pas présumée incluse dans le tarif de base.'],
        ['Reels, TikTok et vidéos YouTube', 'Un même enregistrement peut servir à préparer un cadrage vertical ou horizontal. C’est utile lorsque vous souhaitez publier une sortie sur plusieurs réseaux. La résolution 8K concerne la vidéo à 360° entière : un extrait recadré ne correspond pas à une image plane 8K.']
      ],
      preparation: 'Indiquez le type de fixation souhaité, votre durée de tournage et votre besoin de carte microSD. Pour une sortie longue, demandez la disponibilité d’une batterie supplémentaire. Au retour, prévoyez d’avoir copié vos fichiers sur votre propre support, surtout si vous avez loué la carte avec la caméra.',
      related: [['/visite-virtuelle-360', 'Découvrir aussi nos prestations de visite virtuelle'], ['/location-ray-ban-meta-montpellier', 'Comparer avec les lunettes Ray-Ban Meta pour filmer en POV']],
      faqs: [shared[0],
        ['La perche invisible est-elle comprise dans la location ?', 'La caméra est proposée avec une batterie, un câble et une protection. La perche invisible et la carte microSD sont à confirmer lors de la réservation. Vous pouvez sélectionner la perche dans les accessoires souhaités ; sa disponibilité et son prix vous seront précisés.'],
        ['Peut-on louer une Insta360 avec une ventouse pour voiture ?', 'Oui, vous pouvez demander le pack road trip ou sélectionner le support voiture dans les options. Le tarif du support est sur demande. Le montage doit être adapté au véhicule, sécurisé et conforme aux consignes du fabricant.'],
        ['Puis-je louer une fixation pour moto ou vélo ?', 'Des fixations guidon, moto, vélo et casque figurent parmi les options sur demande. Précisez l’usage et le support envisagés afin de confirmer les accessoires disponibles avant le retrait.'],
        ['Faut-il cadrer pendant que la caméra filme ?', 'En mode 360°, la X5 enregistre tout autour d’elle. Vous choisissez ensuite le point de vue dans un outil de recadrage compatible. Il reste nécessaire de bien placer et sécuriser la caméra pour obtenir les images souhaitées.'],
        ['Une carte microSD est-elle nécessaire pour la X5 ?', 'Oui, prévoyez une carte microSD compatible avec les exigences du fabricant. Si vous souhaitez en louer une avec la caméra, indiquez-le dans les options. Sa présence n’est confirmée qu’après notre échange.'],
        shared[1], shared[2]]
    },
    'ray-ban-meta': {
      heading: 'Louer des Ray-Ban Meta pour essayer les lunettes ou créer un vlog',
      intro: 'Vous hésitez à acheter des lunettes connectées ou vous avez un projet ponctuel ? La location des Ray-Ban Meta Gen 2 à Montpellier permet de les utiliser le temps d’une demi-journée, d’une journée ou sur plusieurs jours après accord. Vous filmez depuis votre regard, sans tenir votre téléphone devant vous.',
      uses: [
        ['Essayer les Ray-Ban Meta avant un achat', 'Une location permet de découvrir les commandes, le confort de la monture et la récupération des fichiers sur votre téléphone. Le modèle de monture et les verres sont précisés avant confirmation. Signalez toute contrainte de confort ou de compatibilité avant le retrait.'],
        ['Filmer en POV pour un vlog', 'Le POV est une prise de vue à la première personne : on suit votre regard pendant une balade, une activité ou les préparatifs d’un projet. Pour préparer votre vidéo, alternez de courtes scènes et vérifiez les cadrages sur votre téléphone avant de poursuivre.'],
        ['Créer des Reels et des coulisses', 'Les lunettes peuvent accompagner un créateur de contenu pour montrer un geste, un produit ou les coulisses d’un événement. Prévenez les personnes filmées et respectez les règles du lieu. Prévoyez le transfert et le montage de vos séquences avant publication.']
      ],
      preparation: 'Installez l’application Meta AI et prévoyez votre compte Meta sur un smartphone compatible. Avant de réserver, vérifiez la compatibilité auprès de Ray-Ban. Gardez du stockage libre sur votre téléphone pour transférer les photos et les vidéos ; faites ce transfert avant la restitution et la réinitialisation des lunettes.',
      related: [['/services/reseaux-sociaux', 'Besoin d’aide pour vos contenus sur les réseaux sociaux ?'], ['/location-insta360-x5-montpellier', 'Comparer avec la caméra Insta360 X5 pour choisir le cadrage après']],
      faqs: [shared[0],
        ['Peut-on tester les Ray-Ban Meta avant de les acheter ?', 'Oui, la location vous permet de les essayer sur une durée convenue et de découvrir leur usage avec votre téléphone. L’essai se fait aux tarifs de location affichés, après confirmation de la disponibilité.'],
        ['Quel modèle de Ray-Ban Meta est proposé ?', 'Les lunettes proposées sont des Ray-Ban Meta Gen 2, avec capture vidéo jusqu’en 3K et étui de recharge. Le modèle précis de monture et les verres sont confirmés lors de la réservation ; le visuel de la fiche est illustratif.'],
        ['Faut-il un téléphone et un compte Meta ?', 'Oui. Prévoyez un smartphone compatible, l’application Meta AI et un compte Meta pour configurer et utiliser les lunettes. Vérifiez les exigences actualisées auprès du fabricant avant votre réservation.'],
        ['Comment récupérer les vidéos des lunettes louées ?', 'Transférez vos photos et vidéos dans l’application sur votre téléphone avant de rendre les lunettes. Vérifiez que les fichiers sont bien récupérés. Le stockage est intégré aux lunettes : il n’y a pas de carte microSD à emporter.'],
        ['Les lunettes sont-elles réinitialisées entre deux locations ?', 'Oui. Elles sont réinitialisées avant la location suivante. Sauvegardez vos contenus avant la restitution : le matériel ne doit pas être utilisé comme un espace de conservation de vos fichiers.'],
        shared[1], shared[2]]
    },
    'dji-mini-2-se': {
      heading: 'Louer un drone DJI pour préparer vos propres images aériennes',
      intro: 'Le DJI Mini 2 SE s’adresse aux personnes qui souhaitent réaliser elles-mêmes leurs prises de vue. Cette offre porte sur le matériel à retirer à Montpellier. Le projet doit être préparé en fonction du lieu, de la météo et des règles applicables au vol envisagé.',
      uses: [
        ['Paysages et souvenirs de voyage', 'Une vue aérienne permet de situer un lieu dans son environnement. Avant de choisir votre date, vérifiez que la zone et les conditions permettent le vol prévu. La disponibilité du drone ne vaut pas autorisation de décoller sur le lieu de votre projet.'],
        ['Immobilier et contenu automobile', 'Pour présenter une propriété ou un véhicule dans son environnement, préparez les plans et les conditions d’accès au site. Si vous souhaitez confier le tournage à l’agence, consultez notre prestation photo et vidéo par drone : le pilote n’est pas inclus dans cette location.'],
        ['Un appareil compact pour la vidéo 2,7K', 'Le Mini 2 SE filme jusqu’en 2,7K et stabilise l’image avec une nacelle mécanique sur trois axes. Ce modèle ne filme pas en 4K. Tenez compte du format final souhaité et du temps de tournage lorsque vous choisissez le matériel et les batteries.']
      ],
      preparation: 'Précisez votre projet, vos dates et votre besoin de batteries ou de carte microSD. Vérifiez les exigences de l’application DJI Fly et la compatibilité de votre téléphone auprès de DJI. Prenez connaissance du manuel et des règles officielles avant le retrait, puis contrôlez les restrictions de la zone et les conditions météo avant chaque vol.',
      related: [['/photo-video-drone', 'Découvrir la prestation drone avec tournage par l’agence'], ['/location-insta360-x5-montpellier', 'Découvrir aussi la caméra 360° pour les prises de vue au sol']],
      faqs: [shared[0],
        ['Le drone est-il loué avec un pilote ?', 'Non, cette offre concerne la location du matériel. Vous restez responsable de son utilisation et des conditions de vol. Pour confier la réalisation des images à l’agence, consultez la prestation photo et vidéo par drone.'],
        ['Peut-on voler partout à Montpellier avec ce drone ?', 'Non. Le retrait à Montpellier ne signifie pas que le vol y est autorisé partout. Vérifiez les restrictions locales et les règles applicables à votre opération auprès des sources officielles. Le poids inférieur à 250 g ne dispense pas de ces vérifications.'],
        ['Le DJI Mini 2 SE filme-t-il en 4K ?', 'Non. Ce modèle filme jusqu’en 2,7K à 30 images par seconde et en Full HD jusqu’à 60 images par seconde. Si votre projet exige de la 4K, le Mini 2 SE ne correspond pas à cette exigence.'],
        ['Combien de temps peut-on voler avec une batterie ?', 'DJI annonce jusqu’à 31 minutes dans ses conditions de référence. La durée réelle varie selon l’environnement et l’utilisation ; ce maximum ne constitue pas une durée de vol garantie. Des batteries supplémentaires sont proposées sur demande.'],
        ['La radiocommande et la carte microSD sont-elles incluses ?', 'La configuration de base comprend le drone, une radiocommande, une batterie, les câbles et un sac ou une protection. La carte microSD et les batteries supplémentaires se demandent en option. Le contenu exact est confirmé avant le retrait.'],
        shared[1], shared[2]]
    }
  };
  return content[p.id];
}
