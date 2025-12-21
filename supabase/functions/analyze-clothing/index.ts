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

    console.log("Starting ultra-fast brand analysis...");

    // Optimized prompt for brand identification and precise details
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em moda e identificação de marcas. Analise a roupa DETALHADAMENTE.
RETORNE APENAS JSON válido sem markdown:
{"type":"tipo EXATO (ex: camisa polo manga curta, camiseta gola redonda, blazer slim fit, vestido midi, calça jeans skinny)","color":"cor EXATA em português (ex: azul marinho, verde musgo, rosa claro, vermelho vinho, branco gelo)","style":"casual/formal/esportivo/streetwear/elegante","brand":"MARCA OFICIAL se identificável pelo logo, etiqueta ou design característico (Nike, Adidas, Lacoste, Zara, etc) ou null se não visível","pattern":"liso/listrado/estampado/xadrez/floral","material":"algodão/poliéster/jeans/seda/linho se identificável","searchQuery":"[marca se houver] [tipo exato] [cor exata] [padrão] masculino/feminino comprar"}
IMPORTANTE: Identifique a MARCA OFICIAL se houver logos, etiquetas ou características de design reconhecíveis. Seja MUITO específico no tipo e cor.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique a marca e analise esta roupa com máxima precisão:" },
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
        brand: null,
        searchQuery: "roupa moda"
      };
    }

    let exactProducts: any[] = [];
    let similarProducts: any[] = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching for exact and similar products...");
      
      // Build search queries - one for exact (with brand if available), one for similar
      const hasBrand = clothingInfo.brand && clothingInfo.brand !== "null" && clothingInfo.brand !== null;
      
      const exactQuery = hasBrand 
        ? `${clothingInfo.brand} ${clothingInfo.type} ${clothingInfo.color} comprar original`
        : `${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.pattern || ''} comprar`.trim();
      
      const similarQuery = `${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.pattern || ''} comprar`.trim();
      
      console.log("Exact query:", exactQuery);
      console.log("Similar query:", similarQuery);
      
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
        "Puma": "puma.com.br",
        "New Balance": "newbalance.com.br",
        "Polo": "poloralphlauren.com.br",
      };

      // Extended color synonyms
      const colorSynonyms: Record<string, string[]> = {
        "preto": ["preto", "black", "negro"],
        "branco": ["branco", "white", "off-white", "creme", "gelo"],
        "azul": ["azul", "blue"],
        "azul marinho": ["azul marinho", "navy", "azul escuro", "marinho"],
        "azul royal": ["azul royal", "royal blue", "azul intenso"],
        "azul claro": ["azul claro", "azul bebê", "light blue", "celeste"],
        "vermelho": ["vermelho", "red"],
        "vinho": ["vinho", "bordô", "burgundy", "marsala"],
        "verde": ["verde", "green"],
        "verde musgo": ["verde musgo", "musgo", "verde escuro", "verde militar"],
        "amarelo": ["amarelo", "yellow", "mostarda"],
        "rosa": ["rosa", "pink", "rosé"],
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
      
      const colorWord = clothingInfo.color.toLowerCase();
      const colorVariants = getColorVariants(colorWord);
      const typeWords = clothingInfo.type.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const brandLower = hasBrand ? clothingInfo.brand.toLowerCase() : "";
      
      const processResults = (results: any[], isExactSearch: boolean) => {
        return results
          .filter((item: any) => item.thumbnail && item.title)
          .map((item: any) => {
            const title = (item.title || "").toLowerCase();
            
            // Type matching
            let typeScore = 0;
            let mainTypeMatch = false;
            for (const word of typeWords) {
              if (title.includes(word)) {
                typeScore += 20;
                if (word.length > 4) mainTypeMatch = true;
              }
            }
            if (title.includes(clothingInfo.type.toLowerCase())) {
              typeScore += 30;
              mainTypeMatch = true;
            }
            
            // Color matching
            let colorScore = 0;
            for (const colorVar of colorVariants) {
              if (title.includes(colorVar)) {
                colorScore = 30;
                break;
              }
            }
            
            // Brand matching (for exact products)
            let brandScore = 0;
            let isBrandMatch = false;
            if (hasBrand) {
              if (title.includes(brandLower)) {
                brandScore = 40;
                isBrandMatch = true;
              }
              // Also check store/source name
              if ((item.source || "").toLowerCase().includes(brandLower)) {
                brandScore += 20;
                isBrandMatch = true;
              }
            }
            
            const totalScore = typeScore + colorScore + brandScore;
            const isExact = isBrandMatch && mainTypeMatch && colorScore > 0;
            const isSimilar = mainTypeMatch && colorScore > 0;
            
            return { item, score: totalScore, isExact, isSimilar };
          });
      };
      
      const createProduct = (item: any, index: number, score: number, isExact: boolean) => {
        const storeName = item.source || "Loja";
        const productTitle = item.title || exactQuery;
        
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
        
        // Higher similarity for exact matches
        const similarity = isExact 
          ? Math.min(99, 95 + Math.floor(score / 20))
          : Math.min(92, 80 + Math.floor(score / 15));
        
        return {
          id: `product-${isExact ? 'exact' : 'similar'}-${index}`,
          name: storeName,
          productImage: item.thumbnail,
          productName: productTitle,
          priceRange: item.price || "Consulte",
          distance: "Online",
          address: storeName,
          onlineLink: finalLink,
          similarity,
          isExact,
        };
      };
      
      try {
        // Search for products
        const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(exactQuery)}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=40&api_key=${SERPAPI_KEY}`;
        
        const serpResponse = await fetch(serpUrl);
        const serpData = await serpResponse.json();
        
        if (serpData.shopping_results) {
          const processed = processResults(serpData.shopping_results, true);
          
          // Separate exact and similar
          const exactFiltered = processed
            .filter((r: any) => r.isExact && r.score >= 70)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 4);
          
          const similarFiltered = processed
            .filter((r: any) => r.isSimilar && !r.isExact && r.score >= 50)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 6);
          
          exactProducts = exactFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, true));
          similarProducts = similarFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, false));
        }
        
        // If no exact products found and we have a brand, try searching for similar without brand
        if (exactProducts.length === 0 && similarProducts.length < 4 && hasBrand) {
          console.log("No exact matches, searching for more similar products...");
          
          const similarUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(similarQuery)}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=30&api_key=${SERPAPI_KEY}`;
          
          const similarResponse = await fetch(similarUrl);
          const similarData = await similarResponse.json();
          
          if (similarData.shopping_results) {
            const processed = processResults(similarData.shopping_results, false);
            const filtered = processed
              .filter((r: any) => r.isSimilar && r.score >= 40)
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 6);
            
            similarProducts = filtered.map((r: any, i: number) => createProduct(r.item, i, r.score, false));
          }
        }
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    const hasExact = exactProducts.length > 0;
    const hasSimilar = similarProducts.length > 0;
    
    console.log(`Found ${exactProducts.length} exact and ${similarProducts.length} similar products`);

    return new Response(JSON.stringify({ 
      analysis: clothingInfo,
      exactProducts,
      similarProducts,
      hasExact,
      hasSimilar,
      message: !hasExact && !hasSimilar 
        ? "Não encontramos produtos correspondentes. Tente uma foto mais clara."
        : !hasExact 
          ? "Não encontramos a peça exata, mas encontramos opções muito semelhantes!"
          : null,
      needsApiKey: !SERPAPI_KEY
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
