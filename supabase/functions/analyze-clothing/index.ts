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
    const { imageBase64, location, minPrice, maxPrice } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting precise model identification...");

    // Ultra-precise prompt for exact model identification
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em identificação de roupas e moda. Analise a imagem com MÁXIMA PRECISÃO para identificar o MODELO EXATO da peça.

RETORNE APENAS JSON válido sem markdown:
{
  "type": "tipo MUITO ESPECÍFICO (ex: camisa polo manga curta gola ribana, camiseta oversized gola careca, blazer slim fit 2 botões, vestido midi evasê, calça jeans skinny cintura alta)",
  "color": "cor EXATA detalhada (ex: azul marinho escuro, verde musgo militar, rosa blush claro, vermelho ferrari, branco off-white)",
  "style": "casual/formal/esportivo/streetwear/elegante/básico",
  "brand": "MARCA se visível por logo/etiqueta/design característico (Nike, Adidas, Lacoste, Zara, etc) ou null",
  "modelName": "NOME DO MODELO ESPECÍFICO se identificável (ex: Nike Air Force 1, Lacoste L.12.12, Polo Ralph Lauren Custom Fit) ou null",
  "pattern": "liso/listrado/estampado/xadrez/floral/geométrico/abstrato",
  "material": "algodão/poliéster/jeans/seda/linho/malha/viscose/couro",
  "fit": "regular/slim/oversized/skinny/relaxed",
  "neckline": "gola V/gola redonda/gola polo/gola alta/decote/sem gola",
  "sleeves": "manga curta/manga longa/sem manga/manga 3/4",
  "details": "detalhes distintivos (botões, bolsos, estampas específicas, acabamentos)",
  "gender": "masculino/feminino/unissex",
  "searchQuery": "[marca] [modelName se houver] [tipo exato] [cor] [fit] [gênero] comprar original"
}

IMPORTANTE: 
- Seja EXTREMAMENTE específico no tipo e detalhes
- Identifique CARACTERÍSTICAS ÚNICAS que diferenciam este modelo
- Se não conseguir identificar a marca/modelo exato, foque nas características visuais distintivas`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identifique o MODELO EXATO desta roupa com todos os detalhes distintivos:" },
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
        modelName: null,
        pattern: "liso",
        searchQuery: "roupa moda"
      };
    }

    let exactProducts: any[] = [];
    let similarProducts: any[] = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching for exact model and similar products...");
      
      const hasBrand = clothingInfo.brand && clothingInfo.brand !== "null" && clothingInfo.brand !== null;
      const hasModel = clothingInfo.modelName && clothingInfo.modelName !== "null" && clothingInfo.modelName !== null;
      
      // Build highly specific search queries
      const exactQuery = hasModel
        ? `${clothingInfo.brand || ''} ${clothingInfo.modelName} ${clothingInfo.color} comprar original`.trim()
        : hasBrand 
          ? `${clothingInfo.brand} ${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.fit || ''} original`.trim()
          : `${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.pattern || ''} ${clothingInfo.fit || ''}`.trim();
      
      const similarQuery = `${clothingInfo.type} ${clothingInfo.color} ${clothingInfo.pattern || ''} ${clothingInfo.gender || ''} comprar`.trim();
      
      // Add price filter to query if provided
      let priceParam = "";
      if (minPrice !== undefined && minPrice !== null) {
        priceParam += `,price_min:${minPrice}`;
      }
      if (maxPrice !== undefined && maxPrice !== null) {
        priceParam += `,price_max:${maxPrice}`;
      }
      
      console.log("Exact query:", exactQuery);
      console.log("Similar query:", similarQuery);
      console.log("Price filter:", priceParam || "none");
      
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

      // Extended color synonyms with more precision
      const colorSynonyms: Record<string, string[]> = {
        "preto": ["preto", "black", "negro"],
        "branco": ["branco", "white", "off-white", "creme", "gelo", "off white"],
        "azul": ["azul", "blue"],
        "azul marinho": ["azul marinho", "navy", "azul escuro", "marinho", "navy blue"],
        "azul royal": ["azul royal", "royal blue", "azul intenso", "azul vivo"],
        "azul claro": ["azul claro", "azul bebê", "light blue", "celeste", "azul céu"],
        "vermelho": ["vermelho", "red"],
        "vinho": ["vinho", "bordô", "burgundy", "marsala", "bordeaux"],
        "verde": ["verde", "green"],
        "verde musgo": ["verde musgo", "musgo", "verde escuro", "verde militar", "oliva"],
        "verde claro": ["verde claro", "verde menta", "mint", "verde água"],
        "amarelo": ["amarelo", "yellow", "mostarda", "dourado"],
        "rosa": ["rosa", "pink", "rosé", "rosa claro", "rosa choque"],
        "cinza": ["cinza", "grey", "gray", "mescla", "grafite", "chumbo"],
        "bege": ["bege", "creme", "nude", "areia", "caramelo", "caqui"],
        "marrom": ["marrom", "brown", "café", "chocolate", "terra", "caramelo"],
        "laranja": ["laranja", "orange", "coral", "terracota"],
        "roxo": ["roxo", "purple", "violeta", "lilás", "lavanda"],
      };
      
      // Type synonyms for better matching
      const typeSynonyms: Record<string, string[]> = {
        "camisa": ["camisa", "shirt", "blusa"],
        "camiseta": ["camiseta", "t-shirt", "tshirt", "tee", "blusa"],
        "polo": ["polo", "piquet", "pique"],
        "calça": ["calça", "pants", "trousers"],
        "jeans": ["jeans", "denim", "calça jeans"],
        "shorts": ["shorts", "bermuda", "short"],
        "vestido": ["vestido", "dress"],
        "saia": ["saia", "skirt"],
        "blazer": ["blazer", "paletó", "terno"],
        "jaqueta": ["jaqueta", "jacket", "casaco"],
        "moletom": ["moletom", "hoodie", "moleton", "sweatshirt"],
        "regata": ["regata", "tank", "cava"],
      };
      
      const getColorVariants = (color: string): string[] => {
        const variants: string[] = [color.toLowerCase()];
        for (const [key, synonyms] of Object.entries(colorSynonyms)) {
          if (color.toLowerCase().includes(key) || synonyms.some(s => color.toLowerCase().includes(s))) {
            variants.push(...synonyms);
          }
        }
        return [...new Set(variants)];
      };
      
      const getTypeVariants = (type: string): string[] => {
        const variants: string[] = [type.toLowerCase()];
        for (const [key, synonyms] of Object.entries(typeSynonyms)) {
          if (type.toLowerCase().includes(key) || synonyms.some(s => type.toLowerCase().includes(s))) {
            variants.push(...synonyms);
          }
        }
        return [...new Set(variants)];
      };
      
      const colorWord = clothingInfo.color.toLowerCase();
      const colorVariants = getColorVariants(colorWord);
      const typeVariants = getTypeVariants(clothingInfo.type);
      const typeWords = clothingInfo.type.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const brandLower = hasBrand ? clothingInfo.brand.toLowerCase() : "";
      const modelLower = hasModel ? clothingInfo.modelName.toLowerCase() : "";
      const patternLower = (clothingInfo.pattern || "").toLowerCase();
      const fitLower = (clothingInfo.fit || "").toLowerCase();
      
      // Parse price from string like "R$ 99,90" or "99.90"
      const parsePrice = (priceStr: string): number | null => {
        if (!priceStr) return null;
        const cleaned = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };
      
      const processResults = (results: any[], requireExactMatch: boolean) => {
        return results
          .filter((item: any) => {
            if (!item.thumbnail || !item.title) return false;
            
            // Apply price filter
            const itemPrice = parsePrice(item.price || "");
            if (minPrice !== undefined && minPrice !== null && itemPrice !== null && itemPrice < minPrice) return false;
            if (maxPrice !== undefined && maxPrice !== null && itemPrice !== null && itemPrice > maxPrice) return false;
            
            return true;
          })
          .map((item: any) => {
            const title = (item.title || "").toLowerCase();
            const source = (item.source || "").toLowerCase();
            
            // STRICT Type matching - must match main type
            let typeScore = 0;
            let mainTypeMatch = false;
            
            for (const typeVar of typeVariants) {
              if (title.includes(typeVar)) {
                typeScore += 25;
                mainTypeMatch = true;
                break;
              }
            }
            
            for (const word of typeWords) {
              if (word.length > 3 && title.includes(word)) {
                typeScore += 10;
                if (word.length > 5) mainTypeMatch = true;
              }
            }
            
            // STRICT Color matching - must match color
            let colorScore = 0;
            let colorMatch = false;
            for (const colorVar of colorVariants) {
              if (title.includes(colorVar)) {
                colorScore = 30;
                colorMatch = true;
                break;
              }
            }
            
            // Pattern matching
            let patternScore = 0;
            let patternMatch = patternLower === "liso"; // Plain patterns match anything
            if (patternLower && patternLower !== "liso") {
              if (title.includes(patternLower)) {
                patternScore = 15;
                patternMatch = true;
              }
            } else {
              patternMatch = true;
              patternScore = 5;
            }
            
            // Fit matching
            let fitScore = 0;
            if (fitLower && title.includes(fitLower)) {
              fitScore = 10;
            }
            
            // Brand matching (for exact products)
            let brandScore = 0;
            let isBrandMatch = false;
            if (hasBrand) {
              if (title.includes(brandLower) || source.includes(brandLower)) {
                brandScore = 35;
                isBrandMatch = true;
              }
            }
            
            // Model name matching (for exact products)
            let modelScore = 0;
            let isModelMatch = false;
            if (hasModel) {
              const modelWords = modelLower.split(/\s+/).filter((w: string) => w.length > 2);
              let matchedWords = 0;
              for (const word of modelWords) {
                if (title.includes(word)) matchedWords++;
              }
              if (matchedWords >= modelWords.length * 0.7) {
                modelScore = 50;
                isModelMatch = true;
              } else if (matchedWords >= modelWords.length * 0.5) {
                modelScore = 25;
              }
            }
            
            const totalScore = typeScore + colorScore + patternScore + fitScore + brandScore + modelScore;
            
            // For EXACT: must have brand + model match OR brand + very high type/color/pattern match
            const isExact = hasModel 
              ? isModelMatch && isBrandMatch && colorMatch
              : hasBrand 
                ? isBrandMatch && mainTypeMatch && colorMatch && totalScore >= 90
                : false;
            
            // For SIMILAR: must have STRICT type + color match
            const isSimilar = mainTypeMatch && colorMatch && patternMatch && totalScore >= 50;
            
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
        
        // Calculate realistic similarity
        const similarity = isExact 
          ? Math.min(99, 92 + Math.floor(score / 25))
          : Math.min(89, 75 + Math.floor(score / 20));
        
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
        // First search for exact matches
        const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(exactQuery)}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=50&api_key=${SERPAPI_KEY}`;
        
        console.log("Fetching exact products...");
        const serpResponse = await fetch(serpUrl);
        const serpData = await serpResponse.json();
        
        if (serpData.shopping_results) {
          const processed = processResults(serpData.shopping_results, true);
          
          // Get ONLY truly exact matches (brand + model or very high score with brand)
          const exactFiltered = processed
            .filter((r: any) => r.isExact && r.score >= 85)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 4);
          
          // Get similar matches (strict type + color + pattern)
          const similarFiltered = processed
            .filter((r: any) => r.isSimilar && !r.isExact && r.score >= 55)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 8);
          
          exactProducts = exactFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, true));
          similarProducts = similarFiltered.map((r: any, i: number) => createProduct(r.item, i, r.score, false));
        }
        
        // If we need more similar products, do a broader search
        if (similarProducts.length < 4) {
          console.log("Searching for more similar products...");
          
          const similarUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(similarQuery)}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=40&api_key=${SERPAPI_KEY}`;
          
          const similarResponse = await fetch(similarUrl);
          const similarData = await similarResponse.json();
          
          if (similarData.shopping_results) {
            const processed = processResults(similarData.shopping_results, false);
            const filtered = processed
              .filter((r: any) => r.isSimilar && r.score >= 50)
              .sort((a: any, b: any) => b.score - a.score)
              .slice(0, 8 - similarProducts.length);
            
            const existingIds = new Set(similarProducts.map((p: any) => p.productName?.toLowerCase()));
            const newProducts = filtered
              .filter((r: any) => !existingIds.has(r.item.title?.toLowerCase()))
              .map((r: any, i: number) => createProduct(r.item, similarProducts.length + i, r.score, false));
            
            similarProducts = [...similarProducts, ...newProducts];
          }
        }
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    const hasExact = exactProducts.length > 0;
    const hasSimilar = similarProducts.length > 0;
    
    console.log(`Found ${exactProducts.length} exact and ${similarProducts.length} similar products`);

    // Build detailed message
    let message = null;
    if (!hasExact && !hasSimilar) {
      message = "Não encontramos produtos correspondentes. Tente uma foto mais clara ou com melhor iluminação.";
    } else if (!hasExact && hasSimilar) {
      const brandText = clothingInfo.brand ? ` da marca ${clothingInfo.brand}` : "";
      const modelText = clothingInfo.modelName ? ` (modelo ${clothingInfo.modelName})` : "";
      message = `Não encontramos a peça exata${brandText}${modelText}, mas encontramos opções extremamente semelhantes com a mesma cor e modelo!`;
    }

    return new Response(JSON.stringify({ 
      analysis: clothingInfo,
      exactProducts,
      similarProducts,
      hasExact,
      hasSimilar,
      message,
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
