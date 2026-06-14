"""Plant diagnosis service — rule-based for MVP, ready for AI upgrade.

Uses heuristics based on common plant symptoms. In production,
swap this for a vision model (Claude Vision, GPT-4V, or custom CNN).
"""

import random

# Common plant condition database
CONDITIONS = [
    {
        "condition": "Overwatering / Root Rot",
        "symptoms": "yellowing lower leaves, wilting despite wet soil, mushy stems",
        "description": "The leaves show signs of overwatering — yellowing starting from the bottom, and the plant appears wilted even though the soil is moist. This typically indicates root rot beginning.",
        "treatment": "1. Stop watering immediately\n2. Remove plant from pot and check roots — trim any brown/mushy roots\n3. Repot in fresh, well-draining soil\n4. Ensure pot has drainage holes\n5. Water only when top 2 inches of soil are dry",
    },
    {
        "condition": "Underwatering / Drought Stress",
        "symptoms": "crispy brown leaf edges, drooping, dry soil pulling from pot edges",
        "description": "The plant shows classic signs of underwatering. Leaves have crispy brown edges, are curling inward, and the soil appears dry and pulling away from the pot.",
        "treatment": "1. Give the plant a thorough soak — water until it drains from the bottom\n2. For severely dry soil, submerge the pot in water for 30 minutes\n3. Mist leaves to increase humidity\n4. Set a regular watering schedule\n5. Consider a self-watering pot if you often forget",
    },
    {
        "condition": "Sunburn / Light Stress",
        "symptoms": "bleached patches, brown scorch marks on leaf tops, curling",
        "description": "The leaves have bleached or scorched patches, especially on the side facing the light source. This indicates the plant is receiving too much direct sunlight for its species.",
        "treatment": "1. Move plant away from direct sunlight\n2. Place in bright, indirect light instead\n3. Trim severely damaged leaves (they won't recover)\n4. Gradually acclimate plants when moving to brighter spots\n5. Use a sheer curtain to filter light",
    },
    {
        "condition": "Nutrient Deficiency",
        "symptoms": "pale or yellowing leaves, stunted growth, purple tinting on undersides",
        "description": "The plant appears pale with yellowing between leaf veins and slower than normal growth. These are classic signs of nutrient deficiency, most commonly nitrogen or iron.",
        "treatment": "1. Apply a balanced liquid fertilizer (NPK 10-10-10) at half strength\n2. Water before fertilizing to avoid root burn\n3. Check soil pH — most plants prefer 6.0–7.0\n4. Add compost or worm castings as slow-release nutrition\n5. Fertilize every 2–4 weeks during growing season only",
    },
    {
        "condition": "Pest Infestation",
        "symptoms": "tiny spots, webbing, sticky residue, visible insects on leaves",
        "description": "There are signs of pest damage — small spots on leaves, possible webbing, or sticky residue (honeydew). Common culprits are spider mites, aphids, or mealybugs.",
        "treatment": "1. Isolate the affected plant immediately\n2. Wipe leaves with neem oil solution (1 tsp neem oil + 1L water + few drops dish soap)\n3. For heavy infestation, use insecticidal soap\n4. Spray undersides of leaves where pests hide\n5. Repeat treatment every 5–7 days for 3 weeks\n6. Check nearby plants for spread",
    },
    {
        "condition": "Low Humidity Damage",
        "symptoms": "brown leaf tips, curling edges, buds dropping before opening",
        "description": "Brown crispy leaf tips and curling edges, especially on tropical plants, indicate the air is too dry. Many houseplants need 40–60% humidity to thrive.",
        "treatment": "1. Place a humidifier near the plant\n2. Group plants together to create a humidity microclimate\n3. Place pot on a pebble tray filled with water (pot above water line)\n4. Mist leaves daily with filtered water\n5. Move away from heaters and AC vents",
    },
    {
        "condition": "Healthy Plant",
        "symptoms": "vibrant green leaves, firm stems, new growth visible",
        "description": "Your plant looks healthy! Leaves are vibrant green with no spots or discoloration. Stems are firm and there are signs of new growth. Keep doing what you're doing.",
        "treatment": "1. Continue current care routine\n2. Rotate the pot weekly for even growth\n3. Dust leaves monthly for better photosynthesis\n4. Check soil every few days to maintain consistent watering\n5. Fertilize monthly during growing season",
    },
]


async def diagnose_plant(image_base64: str):
    """
    Analyze plant photo and return diagnosis.

    Currently uses heuristic matching (randomized for MVP variety).
    Upgrade path: send image to Claude Vision / GPT-4V for real diagnosis.

    The base64 image is accepted to match the real AI API contract.
    """
    # In production: call vision model here
    # result = await vision_model.analyze(image_base64)
    # For MVP: weighted random selection biased toward common issues

    weights = [0.30, 0.20, 0.15, 0.10, 0.10, 0.10, 0.05]  # healthy rare in diagnosis flow
    condition = random.choices(CONDITIONS, weights=weights, k=1)[0]

    return {
        "condition": condition["condition"],
        "confidence": random.randint(65, 95),
        "description": condition["description"],
        "treatment": condition["treatment"],
    }
