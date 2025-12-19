import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting fast analysis...");

    // Ultra-optimized prompt for maximum precision and speed
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Fastest model
        messages: [
          {
            role: "system",
            content: `Você é um especialista em moda. Analise a roupa na imagem com EXTREMA PRECISÃO.
RETORNE APENAS JSON válido sem markdown:
{"type":"tipo EXATO da peça (ex: camisa polo, camiseta gola V, blazer slim, vestido midi, calça jeans skinny)","color":"cor EXATA em português (ex: azul marinho, verde musgo, rosa claro, vermelho vinho)","style":"casual/formal/esportivo/streetwear","brand":"marca se visível ou null","pattern":"liso/listrado/estampado/xadrez","searchQuery":"[tipo exato] [cor exata] [padrão] masculino/feminino"}
SEJA ESPECÍFICO: não diga apenas "camisa", diga "camisa social manga longa". Não diga apenas "azul", diga "azul royal".`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta roupa com máxima precisão:" },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI analysis failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI Analysis:", analysisText);

    let clothingInfo;
    try {
      const cleanJson = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      clothingInfo = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      clothingInfo = {
        type: "roupa",
        color: "variada",
        style: "casual",
        searchQuery: "roupa moda"
      };
    }

    // Fast product search with strict matching
    let products = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching products with strict filters...");
      
      // Build very specific search query
      const strictQuery = `${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.pattern || ''} comprar`.trim();
      const searchQuery = encodeURIComponent(strictQuery);
      
      // Parallel search for faster results - request more to filter strictly
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=50&api_key=${SERPAPI_KEY}`;
      
      try {
        const serpResponse = await fetch(serpUrl);
        const serpData = await serpResponse.json();
        
        if (serpData.shopping_results) {
          const storeMapping: Record<string, string> = {
            "Netshoes": "netshoes.com.br",
            "Dafiti": "dafiti.com.br",
            "Renner": "lojasrenner.com.br",
            "C&A": "cea.com.br",
            "Riachuelo": "riachuelo.com.br",
            "Zara": "zara.com/br",
            "Hering": "hering.com.br",
            "Marisa": "marisa.com.br",
            "Centauro": "centauro.com.br",
            "Reserva": "usereserva.com",
            "Nike": "nike.com.br",
            "Adidas": "adidas.com.br",
            "Amazon": "amazon.com.br",
            "Shopee": "shopee.com.br",
            "Mercado Livre": "mercadolivre.com.br",
            "Magazine Luiza": "magazineluiza.com.br",
            "Americanas": "americanas.com.br",
            "Shein": "shein.com",
            "Youcom": "youcom.com.br",
            "Lacoste": "lacoste.com.br",
            "Tommy": "tommy.com.br",
            "Ralph Lauren": "ralphlauren.com.br",
          };

          // Strict matching keywords
          const typeWords = clothingInfo.type.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
          const colorWord = clothingInfo.color.toLowerCase();
          const patternWord = (clothingInfo.pattern || '').toLowerCase();
          
          // Extended color synonyms for precise matching
          const colorSynonyms: Record<string, string[]> = {
            "preto": ["preto", "black", "negro", "noir"],
            "branco": ["branco", "white", "off-white", "creme"],
            "azul": ["azul", "blue"],
            "azul marinho": ["azul marinho", "navy", "azul escuro", "marinho"],
            "azul royal": ["azul royal", "royal blue", "azul intenso"],
            "azul claro": ["azul claro", "azul bebê", "light blue"],
            "vermelho": ["vermelho", "red"],
            "vinho": ["vinho", "bordô", "burgundy", "marsala"],
            "verde": ["verde", "green"],
            "verde musgo": ["verde musgo", "musgo", "verde escuro", "verde militar"],
            "verde claro": ["verde claro", "verde água", "menta"],
            "amarelo": ["amarelo", "yellow", "mostarda"],
            "rosa": ["rosa", "pink", "rosé"],
            "rosa claro": ["rosa claro", "rosa bebê", "rosa pastel"],
            "cinza": ["cinza", "grey", "gray", "mescla", "grafite"],
            "bege": ["bege", "creme", "nude", "areia", "caramelo"],
            "marrom": ["marrom", "brown", "café", "chocolate", "terra"],
            "laranja": ["laranja", "orange", "coral"],
            "roxo": ["roxo", "purple", "violeta", "lilás"],
          };
          
          const getColorVariants = (color: string): string[] => {
            const variants: string[] = [color];
            for (const [key, synonyms] of Object.entries(colorSynonyms)) {
              if (color.includes(key) || synonyms.some(s => color.includes(s))) {
                variants.push(...synonyms);
              }
            }
            return [...new Set(variants)];
          };
          
          const colorVariants = getColorVariants(colorWord);
          
          // Score and filter with STRICT thresholds
          const scoredResults = serpData.shopping_results
            .filter((item: any) => item.thumbnail && item.title)
            .map((item: any) => {
              const title = (item.title || "").toLowerCase();
              
              // Type score - must match primary type keywords
              let typeScore = 0;
              let mainTypeMatch = false;
              for (const word of typeWords) {
                if (title.includes(word)) {
                  typeScore += 25;
                  if (word.length > 4) mainTypeMatch = true;
                }
              }
              
              // Exact type match bonus
              if (title.includes(clothingInfo.type.toLowerCase())) {
                typeScore += 30;
                mainTypeMatch = true;
              }
              
              // Color score - strict color matching
              let colorScore = 0;
              for (const colorVar of colorVariants) {
                if (title.includes(colorVar)) {
                  colorScore = 35;
                  break;
                }
              }
              
              // Pattern match bonus
              let patternScore = 0;
              if (patternWord && patternWord !== 'liso') {
                if (title.includes(patternWord)) {
                  patternScore = 15;
                }
              }
              
              // Brand match bonus (if detected)
              let brandScore = 0;
              if (clothingInfo.brand && title.toLowerCase().includes(clothingInfo.brand.toLowerCase())) {
                brandScore = 20;
              }
              
              const totalScore = typeScore + colorScore + patternScore + brandScore;
              
              // STRICT: Must have main type match AND color match for high similarity
              const isHighQuality = mainTypeMatch && colorScore > 0;
              
              return { item, score: totalScore, isHighQuality };
            })
            .filter((result: any) => result.isHighQuality && result.score >= 60) // Very strict filter
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 6); // Only top 6 most identical
          
          products = scoredResults.map((result: any, index: number) => {
            const item = result.item;
            const storeName = item.source || "Loja";
            const productTitle = item.title || strictQuery;
            
            let storeDomain = "";
            for (const [name, domain] of Object.entries(storeMapping)) {
              if (storeName.toLowerCase().includes(name.toLowerCase())) {
                storeDomain = domain;
                break;
              }
            }
            
            let finalLink: string;
            if (item.link && item.link.startsWith('http')) {
              finalLink = item.link;
            } else if (storeDomain) {
              finalLink = `https://www.google.com/search?q=site:${storeDomain}+${encodeURIComponent(productTitle)}&btnI=1`;
            } else {
              finalLink = `https://www.google.com/search?q=${encodeURIComponent(productTitle + " " + storeName + " comprar")}&btnI=1`;
            }
            
            // Calculate similarity based on strict scoring
            const similarity = Math.min(99, 90 + Math.floor(result.score / 15));
            
            return {
              id: `product-${index}`,
              name: storeName,
              productImage: item.thumbnail,
              productName: productTitle,
              priceRange: item.price || "Consulte",
              distance: "Online",
              address: storeName,
              onlineLink: finalLink,
              similarity,
            };
          });
        }
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        analysis: clothingInfo,
        products: [],
        message: "Nenhum produto idêntico encontrado. Tente uma foto mais clara.",
        needsApiKey: !SERPAPI_KEY
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${products.length} highly similar products`);
    
    return new Response(JSON.stringify({ 
      analysis: clothingInfo,
      products 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao analisar imagem" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});