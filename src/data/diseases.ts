export interface Disease {
  name: string;
  hindiName: string;
  crops: string[];
  symptoms: string;
  cause: string;
  treatment: string;
  prevention: string;
  severity: "low" | "medium" | "high";
  emoji: string;
}

export const diseases: Disease[] = [
  {
    name: "Late Blight",
    hindiName: "झुलसा रोग",
    crops: ["Tomato", "Potato"],
    symptoms: "Dark water-soaked lesions on leaves, white fungal growth underneath",
    cause: "Phytophthora infestans (fungus-like oomycete)",
    treatment: "Mancozeb (Dithane M-45) 2.5g/L or Metalaxyl + Mancozeb (Ridomil Gold) 2g/L",
    prevention: "Avoid overhead irrigation, ensure air circulation, use resistant varieties",
    severity: "high",
    emoji: "🍅",
  },
  {
    name: "Powdery Mildew",
    hindiName: "चूर्णिल आसिता",
    crops: ["Cucurbits", "Peas", "Grapes"],
    symptoms: "White powdery coating on leaf surfaces, curling and yellowing",
    cause: "Erysiphe spp. / Podosphaera spp. (fungus)",
    treatment: "Sulphur WP 3g/L or Karathane (Dinocap) 1ml/L. Organic: Neem oil 5ml/L",
    prevention: "Proper spacing, avoid excess nitrogen, grow resistant varieties",
    severity: "medium",
    emoji: "🥒",
  },
  {
    name: "Bacterial Leaf Blight",
    hindiName: "जीवाणु झुलसा",
    crops: ["Rice", "Cotton"],
    symptoms: "Water-soaked streaks along veins, turning yellow-white and drying",
    cause: "Xanthomonas oryzae pv. oryzae",
    treatment: "Streptocycline 1g + Copper oxychloride 25g per 10L. No effective chemical cure — manage early",
    prevention: "Use certified seed, balanced fertilization, avoid excess nitrogen",
    severity: "high",
    emoji: "🌾",
  },
  {
    name: "Fusarium Wilt",
    hindiName: "उकठा रोग",
    crops: ["Tomato", "Banana", "Chickpea"],
    symptoms: "Yellowing of lower leaves, wilting despite adequate water, brown vascular discoloration",
    cause: "Fusarium oxysporum (soil-borne fungus)",
    treatment: "Trichoderma viride 5g/kg seed treatment. Carbendazim (Bavistin) 1g/L soil drench",
    prevention: "Crop rotation (3–4 years), solarize soil, use resistant rootstocks",
    severity: "high",
    emoji: "🍌",
  },
  {
    name: "Aphid Infestation",
    hindiName: "माहू / चेंपा",
    crops: ["Mustard", "Wheat", "Vegetables"],
    symptoms: "Curled leaves, sticky honeydew, sooty mold, stunted growth",
    cause: "Lipaphis erysimi / Aphis gossypii (sucking pest)",
    treatment: "Neem oil 5ml/L or Imidacloprid (Confidor) 0.3ml/L. Release ladybird beetles as biocontrol",
    prevention: "Yellow sticky traps, intercropping with coriander, avoid excess nitrogen",
    severity: "medium",
    emoji: "🐛",
  },
  {
    name: "Downy Mildew",
    hindiName: "मृदुरोमिल आसिता",
    crops: ["Grapes", "Cucurbits", "Onion"],
    symptoms: "Yellow angular spots on upper leaf, purplish-grey fungal growth below",
    cause: "Peronospora spp. / Pseudoperonospora spp.",
    treatment: "Metalaxyl + Mancozeb (Ridomil Gold) 2g/L or Copper oxychloride 3g/L",
    prevention: "Avoid waterlogging, morning irrigation, prune for air flow",
    severity: "medium",
    emoji: "🍇",
  },
  {
    name: "Root Knot Nematode",
    hindiName: "जड़ गांठ सूत्रकृमि",
    crops: ["Tomato", "Brinjal", "Okra", "Carrot"],
    symptoms: "Stunting, wilting in heat, swollen galls/knots on roots",
    cause: "Meloidogyne incognita (nematode)",
    treatment: "Paecilomyces lilacinus or Carbofuran 1kg a.i./ha at transplanting. Neem cake 250kg/ha",
    prevention: "Marigold intercrop/rotation, solarization, resistant varieties",
    severity: "high",
    emoji: "🥕",
  },
  {
    name: "Leaf Curl Virus",
    hindiName: "पत्ती मोड़क विषाणु",
    crops: ["Tomato", "Chilli", "Cotton"],
    symptoms: "Upward curling, puckering, reduced leaf size, stunted plants",
    cause: "Begomovirus transmitted by whitefly (Bemisia tabaci)",
    treatment: "No cure. Remove infected plants. Control whitefly: Imidacloprid 0.3ml/L or neem oil",
    prevention: "Use virus-free seedlings, silver mulch to repel whitefly, resistant hybrids",
    severity: "high",
    emoji: "🌶️",
  },
  {
    name: "Early Blight",
    hindiName: "अगेती झुलसा",
    crops: ["Tomato", "Potato", "Brinjal"],
    symptoms:
      "Brown spots with concentric rings (target/bullseye pattern) on older lower leaves, yellow halo around spots, leaves drop from bottom upward",
    cause: "Alternaria solani (fungus), favoured by warm humid weather and alternating wet-dry spells",
    treatment:
      "Mancozeb 2.5g/L or Chlorothalonil 2g/L at 10-day intervals. Organic: Trichoderma + neem oil 5ml/L",
    prevention: "Mulch to stop soil splash, remove lower infected foliage, 3-year rotation, stake plants",
    severity: "high",
    emoji: "🎯",
  },
  {
    name: "Rice Blast",
    hindiName: "रिच झोंका / ब्लास्ट",
    crops: ["Rice", "Finger Millet"],
    symptoms:
      "Diamond/spindle-shaped spots with grey centre and brown margin on leaves; blackened rotting node; neck of panicle breaks and grain fills poorly",
    cause: "Magnaporthe oryzae (Pyricularia oryzae), severe in cool nights with heavy dew and high nitrogen",
    treatment:
      "Tricyclazole 0.6g/L or Isoprothiolane 1.5ml/L at boot-leaf and heading stage. Seed treat with Carbendazim 2g/kg",
    prevention: "Split nitrogen doses, avoid dense planting, resistant varieties, drain field periodically",
    severity: "high",
    emoji: "🌾",
  },
  {
    name: "Wheat Rust",
    hindiName: "गेरुआ रोग",
    crops: ["Wheat", "Barley", "Oats"],
    symptoms:
      "Orange-brown or yellow powdery pustules in stripes or scattered dots on leaves and stem; rusty powder rubs off on fingers and clothes",
    cause: "Puccinia species (stripe, leaf and stem rust), spreads on wind in cool moist weather",
    treatment: "Propiconazole 1ml/L or Tebuconazole 1ml/L, repeat after 15 days if pustules persist",
    prevention: "Sow rust-resistant varieties, timely sowing, destroy volunteer wheat plants",
    severity: "high",
    emoji: "🟠",
  },
  {
    name: "Mosaic Virus",
    hindiName: "मोजेक विषाणु",
    crops: ["Tomato", "Okra", "Cucurbits", "Papaya", "Tobacco"],
    symptoms:
      "Mottled light-and-dark green patchwork on leaves, blistered puckered surface, narrow strap-like distorted new leaves, stunted plant, poor fruit set",
    cause: "Tobacco/Cucumber mosaic virus and Yellow Vein Mosaic, spread by aphids, whitefly and handling",
    treatment:
      "No chemical cure. Uproot and burn infected plants. Control vectors: Imidacloprid 0.3ml/L or neem oil 5ml/L",
    prevention: "Virus-free seed, wash hands and tools, no tobacco use near crop, barrier crop of maize",
    severity: "high",
    emoji: "🧩",
  },
  {
    name: "Anthracnose",
    hindiName: "श्यामवर्ण / एन्थ्रेक्नोज",
    crops: ["Chilli", "Mango", "Beans", "Banana"],
    symptoms:
      "Sunken circular dark spots on fruit with pink spore masses in the centre, fruit rots and dries; twig dieback in mango",
    cause: "Colletotrichum species, spreads in rain splash at fruit maturity",
    treatment: "Carbendazim 1g/L or Mancozeb 2.5g/L sprays at flowering and fruit set",
    prevention: "Harvest dry fruit, remove mummified fruit, avoid overhead irrigation, proper spacing",
    severity: "medium",
    emoji: "🌶️",
  },
  {
    name: "Damping Off",
    hindiName: "आर्द्र गलन",
    crops: ["Nursery seedlings", "Tomato", "Chilli", "Brinjal", "Cabbage"],
    symptoms:
      "Seedlings collapse and topple at soil line, stem base water-soaked and pinched thin, patches of dead seedlings in nursery bed",
    cause: "Pythium and Rhizoctonia in overwatered, poorly drained, crowded nursery beds",
    treatment: "Drench with Copper oxychloride 3g/L or Metalaxyl 2g/L; reduce watering immediately",
    prevention: "Raised nursery beds, soil solarisation, Trichoderma 10g/kg soil, thin sowing",
    severity: "high",
    emoji: "🌱",
  },
  {
    name: "Stem Borer",
    hindiName: "तना छेदक",
    crops: ["Rice", "Maize", "Sugarcane", "Brinjal"],
    symptoms:
      "Dead heart in young plants — central shoot dries and pulls out easily; white empty panicles (white ear) later; bore holes with frass on stem",
    cause: "Scirpophaga incertulas / Chilo species (moth larvae tunnelling inside the stem)",
    treatment: "Cartap hydrochloride 4G 18kg/ha or Chlorantraniliprole 0.3ml/L. Release Trichogramma cards",
    prevention: "Clip seedling tips before transplanting, pheromone traps, destroy stubble after harvest",
    severity: "high",
    emoji: "🐛",
  },
  {
    name: "Fruit & Shoot Borer",
    hindiName: "फल एवं प्ररोह छेदक",
    crops: ["Brinjal", "Okra", "Tomato"],
    symptoms:
      "Young shoots wilt and droop, bore hole plugged with excreta on fruit, tunnels and larva inside the fruit when cut open",
    cause: "Leucinodes orbonalis / Earias species",
    treatment: "Emamectin benzoate 0.4g/L or Spinosad 0.3ml/L. Handpick and destroy bored fruit",
    prevention: "Pheromone traps 5/acre, remove wilted shoots weekly, resistant long-fruited varieties",
    severity: "medium",
    emoji: "🍆",
  },
  {
    name: "Whitefly",
    hindiName: "सफेद मक्खी",
    crops: ["Cotton", "Tomato", "Chilli", "Brinjal", "Pulses"],
    symptoms:
      "Tiny white insects fly up in a cloud when plant is shaken, undersides of leaves sticky, black sooty mould, leaves yellow and curl, virus spreads fast",
    cause: "Bemisia tabaci (sucking pest and virus vector)",
    treatment: "Diafenthiuron 1g/L or Spiromesifen 1ml/L; organic: neem oil 5ml/L + sticky yellow traps",
    prevention: "Yellow sticky traps 10/acre, silver reflective mulch, avoid excess nitrogen, border maize rows",
    severity: "high",
    emoji: "🦟",
  },
  {
    name: "Thrips",
    hindiName: "थ्रिप्स",
    crops: ["Chilli", "Onion", "Cotton", "Grapes"],
    symptoms:
      "Leaves curl upward like a boat (leaf curl), silvery streaks and scratch marks, buds drop, flowers dry and fall",
    cause: "Scirtothrips dorsalis / Thrips tabaci (rasping-sucking pest, severe in dry heat)",
    treatment: "Fipronil 1.5ml/L or Spinosad 0.3ml/L; organic: neem oil 5ml/L + blue sticky traps",
    prevention: "Blue sticky traps, sprinkler irrigation to raise humidity, remove weed hosts",
    severity: "medium",
    emoji: "🌶️",
  },
  {
    name: "Bacterial Wilt",
    hindiName: "जीवाणु उकठा",
    crops: ["Tomato", "Brinjal", "Potato", "Chilli", "Ginger"],
    symptoms:
      "Sudden wilting of a green healthy-looking plant without yellowing; cut stem placed in water oozes milky white bacterial threads",
    cause: "Ralstonia solanacearum (soil and water-borne bacterium)",
    treatment:
      "No cure. Uproot and burn affected plants, drench pit with bleaching powder 15kg/ha or Copper oxychloride 3g/L",
    prevention: "Rotate with cereals for 3 years, grafted resistant rootstock, raised beds and good drainage",
    severity: "high",
    emoji: "🥔",
  },
  {
    name: "Citrus Greening (HLB)",
    hindiName: "नींबू हरितता रोग",
    crops: ["Citrus", "Orange", "Lemon", "Kinnow"],
    symptoms:
      "Blotchy asymmetric yellow mottling across the leaf midrib, twig dieback, small lopsided bitter fruit that drops early",
    cause: "Candidatus Liberibacter, spread by citrus psyllid (Diaphorina citri)",
    treatment:
      "No cure. Remove infected trees. Control psyllid with Imidacloprid 0.3ml/L; tetracycline trunk injection gives temporary relief",
    prevention: "Certified disease-free saplings, monitor and spray psyllid on new flush, remove curry leaf hosts",
    severity: "high",
    emoji: "🍊",
  },
  {
    name: "Nitrogen Deficiency",
    hindiName: "नाइट्रोजन की कमी",
    crops: ["All crops", "Rice", "Wheat", "Maize", "Vegetables"],
    symptoms:
      "Uniform pale yellow older lower leaves with yellowing starting from the leaf tip along the midrib, thin stems, slow stunted growth, no spots or lesions",
    cause: "Insufficient nitrogen, leaching after heavy rain, or unfinished organic matter tying up nitrogen",
    treatment: "Top-dress Urea 40-50kg/ha or spray 2% urea solution for a quick recovery within a week",
    prevention: "Split nitrogen application, green manure, FYM 10t/ha, soil test before the season",
    severity: "medium",
    emoji: "💛",
  },
  {
    name: "Zinc Deficiency",
    hindiName: "जिंक की कमी (खैरा रोग)",
    crops: ["Rice", "Maize", "Wheat", "Citrus"],
    symptoms:
      "Rusty brown patches on middle leaves of young rice (khaira), white or pale bands between veins, shortened internodes, small bunched leaves at the tip",
    cause: "Low available zinc, common in alkaline, calcareous and continuously flooded soils",
    treatment: "Spray Zinc sulphate 0.5% (5g/L) with lime twice at 10-day gap; soil apply 25kg ZnSO4/ha",
    prevention: "Apply zinc every 2-3 seasons, avoid continuous flooding, add organic manure",
    severity: "medium",
    emoji: "🧪",
  },
  {
    name: "Iron Deficiency",
    hindiName: "लौह तत्व की कमी",
    crops: ["Citrus", "Groundnut", "Soybean", "Vegetables"],
    symptoms:
      "Youngest top leaves turn pale yellow or white while veins stay bright green (interveinal chlorosis); older leaves remain normal",
    cause: "Iron locked up in high-pH calcareous soil or waterlogged roots, not a true shortage",
    treatment: "Spray Ferrous sulphate 0.5% (5g/L) + citric acid 1g/L, two to three sprays at weekly gaps",
    prevention: "Improve drainage, add organic matter, avoid over-liming, use chelated iron in alkaline soil",
    severity: "low",
    emoji: "🍋",
  },
  {
    name: "Fall Armyworm",
    hindiName: "फॉल आर्मीवर्म",
    crops: ["Maize", "Sorghum", "Sugarcane", "Millets"],
    symptoms:
      "Ragged window-pane holes and shot holes in whorl leaves, moist sawdust-like frass in the funnel, large larva with inverted Y on head",
    cause: "Spodoptera frugiperda (invasive caterpillar)",
    treatment:
      "Emamectin benzoate 0.4g/L or Spinetoram 0.5ml/L poured into the whorl in the evening. Sand + lime in whorl for small larvae",
    prevention: "Early uniform sowing, pheromone traps 5/acre, intercrop with pulses, encourage birds",
    severity: "high",
    emoji: "🌽",
  },
  {
    name: "Sheath Blight",
    hindiName: "शीथ ब्लाइट",
    crops: ["Rice"],
    symptoms:
      "Oval greenish-grey water-soaked patches on the leaf sheath near the water line, later becoming straw-coloured with brown borders; sheath rots and tillers lodge",
    cause: "Rhizoctonia solani, worst in dense crops with heavy nitrogen and high humidity",
    treatment: "Validamycin 2ml/L or Hexaconazole 2ml/L directed at the base of the plant",
    prevention: "Wider spacing, balanced nitrogen, remove weeds and stubble, alternate wet-dry irrigation",
    severity: "medium",
    emoji: "🌾",
  },
  {
    name: "Red Rot of Sugarcane",
    hindiName: "लाल सड़न रोग",
    crops: ["Sugarcane"],
    symptoms:
      "Third and fourth leaves yellow and dry, split cane shows red internal tissue with crosswise white patches and a sour alcoholic smell",
    cause: "Colletotrichum falcatum, spread through infected setts and irrigation water",
    treatment:
      "No cure for a standing infected clump. Uproot and burn, drench the pit with Carbendazim 1g/L",
    prevention: "Disease-free setts, hot water treatment of setts at 52°C, resistant varieties, crop rotation",
    severity: "high",
    emoji: "🎋",
  },
];
