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

    // Step 1: Analyze the image with AI to get clothing description
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
            content: `Você é um especialista em moda brasileiro. Analise a imagem de roupa com MÁXIMO DETALHE e retorne APENAS um JSON com:
{
  "type": "tipo EXATO da peça (ex: camisa polo, blazer slim fit, vestido midi, calça skinny)",
  "color": "cor EXATA em português (ex: vinho, azul marinho, verde musgo)",
  "style": "estilo específico (ex: casual, formal, esportivo, streetwear)",
  "material": "material aparente (ex: algodão piqué, jeans, linho, couro)",
  "details": "todos os detalhes visuais (gola, botões, estampa, corte, acabamentos)",
  "brand": "marca se visível no produto",
  "searchQuery": "query MUITO ESPECÍFICA para encontrar EXATAMENTE esta peça em lojas brasileiras online, incluindo tipo, cor, material e detalhes principais"
}
Seja EXTREMAMENTE específico na searchQuery para encontrar produtos o mais similares possível.
Responda APENAS com o JSON, sem markdown ou texto adicional.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta roupa e extraia as informações para busca:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Por favor, adicione créditos." }), {
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
      // Clean up potential markdown formatting
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

    // Step 2: Search for similar products using SerpAPI (Google Shopping)
    let products = [];
    
    if (SERPAPI_KEY) {
      console.log("Searching products with SerpAPI...");
      // Query mais específica para produtos muito similares
      const searchQuery = encodeURIComponent(`${clothingInfo.searchQuery}`);
      const serpUrl = `https://serpapi.com/search.json?engine=google_shopping&q=${searchQuery}&location=${encodeURIComponent(location || 'São Paulo, Brazil')}&hl=pt&gl=br&num=20&api_key=${SERPAPI_KEY}`;
      
      try {
        const serpResponse = await fetch(serpUrl);
        const serpData = await serpResponse.json();
        
        console.log("SerpAPI response:", JSON.stringify(serpData.shopping_results?.slice(0, 2)));
        
        if (serpData.shopping_results) {
          // Buscar detalhes do produto para obter link direto da loja
          const getProductDetails = async (item: any) => {
            // SerpAPI retorna product_link que leva ao Google Shopping
            // Para link direto, precisamos usar a immersive product API
            // Por enquanto, criar um link de busca site-specific
            const storeName = item.source || "Loja";
            const productTitle = item.title || clothingInfo.searchQuery;
            
            // Tentar mapear lojas conhecidas para seus domínios
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
            
            // Procurar domínio da loja no mapping
            let storeDomain = "";
            for (const [name, domain] of Object.entries(storeMapping)) {
              if (storeName.toLowerCase().includes(name.toLowerCase())) {
                storeDomain = domain;
                break;
              }
            }
            
            // Se temos o domínio, buscar dentro do site da loja
            let finalLink: string;
            if (storeDomain) {
              finalLink = `https://www.google.com/search?q=site:${storeDomain}+${encodeURIComponent(productTitle)}&btnI=1`;
            } else {
              // Fallback: buscar produto + loja com "I'm Feeling Lucky" para ir direto
              finalLink = `https://www.google.com/search?q=${encodeURIComponent(productTitle + " " + storeName + " comprar site oficial")}&btnI=1`;
            }
            
            return {
              storeName,
              productTitle,
              finalLink,
            };
          };
          
          const productPromises = serpData.shopping_results.slice(0, 10).map(async (item: any, index: number) => {
            const details = await getProductDetails(item);
            
            console.log(`Product ${index} - source: ${details.storeName}, final link: ${details.finalLink}`);
            
            return {
              id: `product-${index}`,
              name: details.storeName,
              productImage: item.thumbnail || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
              productName: details.productTitle,
              priceRange: item.price || "Consulte",
              distance: "Online",
              address: details.storeName,
              onlineLink: details.finalLink,
              similarity: Math.max(75, 98 - (index * 2)),
            };
          });
          
          products = await Promise.all(productPromises);
        }
      } catch (e) {
        console.error("SerpAPI error:", e);
      }
    }

    // If no products found via API, return structured response indicating need for API key
    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        analysis: clothingInfo,
        products: [],
        message: "Para buscar produtos reais, configure a chave SERPAPI_KEY nas configurações do projeto.",
        needsApiKey: true
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
    console.error("Error in analyze-clothing function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro ao analisar imagem" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
