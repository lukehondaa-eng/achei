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

    console.log("Analyzing image with AI...");

    // Step 1: Analyze image with fast model for quick response
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite", // Faster model
        messages: [
          {
            role: "system",
            content: `Analise a roupa na imagem e retorne APENAS JSON:
{
  "type": "tipo exato (camisa polo, camiseta, blazer, vestido, calça jeans, etc)",
  "color": "cor exata em português (azul marinho, vermelho, preto, branco, etc)",
  "style": "casual/formal/esportivo",
  "material": "material se visível",
  "details": "detalhes importantes",
  "searchQuery": "query específica: [tipo] [cor] [material] [detalhe principal]"
}
Seja PRECISO na cor e tipo. Responda SÓ o JSON.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analise esta roupa:" },
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
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente." }), {
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

    // Step 2: Search with strict query for exact matches
    let products = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching products...");
      
      // Build strict search query with exact color and type
      const strictQuery = `${clothingInfo.type} ${clothingInfo.color}`.trim();
      const searchQuery = encodeURIComponent(strictQuery);
      
      // Request more results to filter down to best matches
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=40&api_key=${SERPAPI_KEY}`;
      
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
          };

          // Filter products by similarity (must contain type AND color in title)
          const typeKeywords = clothingInfo.type.toLowerCase().split(' ');
          const colorKeyword = clothingInfo.color.toLowerCase();
          
          // Color synonyms for better matching
          const colorSynonyms: Record<string, string[]> = {
            "preto": ["preto", "black", "negro"],
            "branco": ["branco", "white", "off-white"],
            "azul": ["azul", "blue", "navy"],
            "azul marinho": ["azul marinho", "navy", "azul escuro"],
            "vermelho": ["vermelho", "red", "vinho", "bordô"],
            "verde": ["verde", "green"],
            "amarelo": ["amarelo", "yellow", "mostarda"],
            "rosa": ["rosa", "pink"],
            "cinza": ["cinza", "grey", "gray", "mescla"],
            "bege": ["bege", "creme", "nude", "areia"],
            "marrom": ["marrom", "brown", "caramelo", "café"],
          };
          
          const getColorVariants = (color: string): string[] => {
            for (const [key, variants] of Object.entries(colorSynonyms)) {
              if (color.includes(key) || variants.some(v => color.includes(v))) {
                return variants;
              }
            }
            return [color];
          };
          
          const colorVariants = getColorVariants(colorKeyword);
          
          const scoredResults = serpData.shopping_results
            .filter((item: any) => item.thumbnail) // Must have image
            .map((item: any) => {
              const title = (item.title || "").toLowerCase();
              
              // Score based on type match
              let typeScore = 0;
              for (const keyword of typeKeywords) {
                if (keyword.length > 2 && title.includes(keyword)) {
                  typeScore += 30;
                }
              }
              
              // Score based on color match
              let colorScore = 0;
              for (const colorVar of colorVariants) {
                if (title.includes(colorVar)) {
                  colorScore = 40;
                  break;
                }
              }
              
              // Bonus for exact type matches
              if (title.includes(clothingInfo.type.toLowerCase())) {
                typeScore += 20;
              }
              
              const totalScore = typeScore + colorScore;
              
              return { item, score: totalScore };
            })
            .filter((result: any) => result.score >= 50) // Only high similarity
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 8); // Top 8 most similar
          
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
            if (storeDomain) {
              finalLink = `https://www.google.com/search?q=site:${storeDomain}+${encodeURIComponent(productTitle)}&btnI=1`;
            } else {
              finalLink = `https://www.google.com/search?q=${encodeURIComponent(productTitle + " " + storeName + " comprar")}&btnI=1`;
            }
            
            // Calculate similarity percentage based on score
            const similarity = Math.min(98, 85 + Math.floor(result.score / 10));
            
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
        message: "Nenhum produto muito similar encontrado. Tente outra imagem.",
        needsApiKey: !SERPAPI_KEY
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
