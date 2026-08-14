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
];
