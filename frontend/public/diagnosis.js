        const DIAGNOSIS = {
            yellow_leaves: [
                { cause: 'Overwatering', prob: 'Most likely', fix: 'Let soil dry out completely before next watering. Check drainage holes — roots may be rotting. Consider repotting in fresh, well-draining soil.', urgency: 'high' },
                { cause: 'Nutrient deficiency', prob: 'Possible', fix: 'Yellow lower leaves often mean nitrogen deficiency. Apply balanced liquid fertilizer (10-10-10) at half strength.', urgency: 'medium' },
                { cause: 'Natural aging', prob: 'If only bottom leaves', fix: 'Oldest leaves naturally yellow and drop. Nothing to worry about — just trim them off.', urgency: 'low' },
            ],
            brown_tips: [
                { cause: 'Low humidity', prob: 'Most likely', fix: 'Mist leaves regularly, use a pebble tray with water, or move to bathroom/kitchen. Brown tips won\'t heal but new growth will be healthy.', urgency: 'medium' },
                { cause: 'Fluoride/chemical burn', prob: 'Possible', fix: 'Switch to distilled, rain, or filtered water. Let tap water sit 24h before using. Snake plants and dracaenas are especially sensitive.', urgency: 'medium' },
                { cause: 'Over-fertilizing', prob: 'If you fertilized recently', fix: 'Flush soil with water to remove excess salts. Reduce fertilizer to quarter-strength every 2-3 months.', urgency: 'medium' },
            ],
            drooping: [
                { cause: 'Underwatering', prob: 'Most likely if soil is dry', fix: 'Water thoroughly until water drains from bottom. Plant should perk up within hours. Consider bottom-watering for deep saturation.', urgency: 'high' },
                { cause: 'Overwatering (root rot)', prob: 'If soil is wet', fix: 'Stop watering immediately. Check roots — if brown/mushy, trim rotted roots and repot in dry soil. Reduce watering frequency.', urgency: 'high' },
                { cause: 'Temperature shock', prob: 'If near draft/window', fix: 'Move away from cold drafts, AC vents, or heat sources. Most houseplants prefer 18-27°C (65-80°F).', urgency: 'medium' },
            ],
            spots: [
                { cause: 'Fungal/bacterial infection', prob: 'If spots are spreading', fix: 'Remove affected leaves immediately. Improve air circulation. Avoid wetting leaves when watering. Apply neem oil or copper fungicide.', urgency: 'high' },
                { cause: 'Sunburn', prob: 'If spots are dry/bleached', fix: 'Move plant away from direct sun, especially afternoon sun. Most houseplants want bright INDIRECT light.', urgency: 'medium' },
                { cause: 'Pest damage', prob: 'Check undersides of leaves', fix: 'Look for tiny insects, webbing, or sticky residue. See pest diagnosis below.', urgency: 'medium' },
            ],
            pests: [
                { cause: 'Spider mites', prob: 'If fine webbing, tiny dots', fix: 'Wipe leaves with damp cloth. Spray with neem oil solution (5ml neem + 1L water + drop of soap). Repeat weekly for 3 weeks. Increase humidity.', urgency: 'high' },
                { cause: 'Mealybugs', prob: 'If white cotton-like fuzz', fix: 'Dab with alcohol on cotton swab. Spray with insecticidal soap. Check leaf joints and undersides thoroughly.', urgency: 'high' },
                { cause: 'Fungus gnats', prob: 'If tiny black flies in soil', fix: 'Let soil surface dry out. Use sticky traps. Sprinkle cinnamon on soil (natural fungicide). Avoid overwatering.', urgency: 'medium' },
            ],
            no_growth: [
                { cause: 'Insufficient light', prob: 'Most likely', fix: 'Move closer to window. Even "low light" plants need some light. Consider grow light if no bright spot available. Rotate plant weekly.', urgency: 'medium' },
                { cause: 'Root bound', prob: 'If roots circle the pot', fix: 'Repot to next size up (2-5cm wider). Gently loosen roots before repotting. Best done in spring/early summer.', urgency: 'medium' },
                { cause: 'Dormancy/wrong season', prob: 'If winter', fix: 'Most plants grow little in winter. This is normal. Reduce watering and fertilizing. Growth will resume in spring.', urgency: 'low' },
            ],
        };
