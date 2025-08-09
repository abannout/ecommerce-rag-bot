import { extractQueryAttributes } from "../querySearch/queryProcessor";

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    context?: string,
    timestamp?: Date;
}
const KISKI_API = process.env.KISKI_ENDPOINT!;
const KISKI_API_KEY = process.env.KISKI_API!;

async function generateAnswer(context: string, 
    query: string, 
    chatHistory: ChatMessage[] = []
) {
    const attributes = extractQueryAttributes(query);
    
    const enhancedSystemPrompt = buildEnhancedPrompt(attributes);
    
    const messages = buildMessageHistory(enhancedSystemPrompt, context, query, chatHistory);
                console.log("old chat:" + JSON.stringify(messages))
    let res, json;

    try {
        res = await fetch(KISKI_API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${KISKI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "meta-llama-3.1-8b-instruct",
                messages,
                max_tokens: 512,
                temperature: 0.3,
                top_p: 0.5,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`LLM API Error (${res.status}): ${errorText}`);
        }

        json = await res.json();
        const answer = json.choices?.[0]?.message?.content;

        if (!answer) {
            throw new Error("No answer returned from LLM. Full response: " + JSON.stringify(json));
        }

        return answer;

    } catch (error: any) {
        console.error("Fetch error:", error.message);
        throw new Error("Failed to call LLM API");
    }
}
function buildMessageHistory(
    systemPrompt: string,
    context: string,
    currentQuery: string,
    chatHistory: ChatMessage[]
): any[] {
    const messages = [
        {
            role: "system",
            content: systemPrompt,
        }
    ];

    
    chatHistory.forEach(msg => {
        const message: any = {
            role: msg.role,
            content: msg.content
        };
        if (msg.context) {
            message.context = msg.context;
        }
        messages.push(message);
    });

    messages.push({
        role: "user",
        content: `Product Information:\n${context}\n\nUser Question: ${currentQuery}`,
    });

    return messages;
}
function buildEnhancedPrompt(attributes: any): string {
    const genderRequirement = attributes.gender?.[0];

    
    let prompt = `You are a professional fashion shopping assistant. Your job is to recommend appropriate clothing and accessories based on the user's specific requirements.

CRITICAL GENDER FILTERING RULES:
`;

    // Add specific gender filtering based on query
    if ( genderRequirement === 'male') {
        prompt += `
 THE USER IS SPECIFICALLY LOOKING FOR MEN'S ITEMS. YOU MUST:
 ONLY recommend items that are appropriate for men
 Include: men's suits, men's shirts, men's jackets, men's pants, men's shoes, men's accessories
 NEVER recommend: dresses, skirts, women's blouses, women's heels, women's handbags, bras, women's jewelry
 NEVER recommend: items described as "for women", "ladies", "feminine", "bridal dress", "gown"
 IGNORE any items labeled as "unisex" if they are clearly women's items (like dresses or women's coats)

SPECIFICALLY FOR MEN'S FORMAL/WEDDING WEAR:
 Recommend: suits, tuxedos, dress shirts, ties, bow ties, dress shoes, cufflinks, pocket squares
 NEVER recommend: wedding dresses, evening gowns, women's formal wear, high heels

`;
    } else if ( genderRequirement === 'female') {
        prompt += `
 THE USER IS SPECIFICALLY LOOKING FOR WOMEN'S ITEMS. YOU MUST:
 ONLY recommend items that are appropriate for women  
 Include: women's dresses, women's blouses, women's skirts, women's heels, women's handbags
 NEVER recommend: men's suits, men's ties, men's dress shirts (unless specifically unisex), men's shoes
 NEVER recommend: items described as "for men", "masculine", "groom"
 IGNORE any items labeled as "unisex" if they are clearly men's items (like men's suits or ties)

SPECIFICALLY FOR WOMEN'S FORMAL/WEDDING WEAR:
 Recommend: dresses, gowns, blouses, skirts, heels, women's formal accessories
 NEVER recommend: men's suits, tuxedos, men's dress shirts, ties (unless women's ties)

`;
    }

    prompt += `

RESPONSE GUIDELINES:
1. If the user refers to previous messages, answer based only on the context of those earlier messages. Do not introduce new items unless explicitly requested.
2. Respond in the same language the user used
3. Only recommend products that match the user's gender requirements
4. If you have no items related to the question say: Sorry, I could not find suitable products for your request. Please visit asoss.com for a wider selection.
5. Explain why each recommendation fits their needs
6. Mention specific features that make each item appropriate
7. If items seem inappropriately gendered despite being in results, skip them entirely
8. Consider if the user is looking to chitchat and answer accordingly

PRODUCT APPROPRIATENESS ANALYSIS:
When analyzing each product, carefully examine the description for:
1. Explicit gender mentions ("men's", "women's", "ladies", "gentleman")
2. Product type appropriateness (dresses are for women, suits typically for men)
3. Styling cues (feminine vs masculine design elements)
4. Target audience indicators in the description

CONTEXT HANDLING:
- Some items may be incorrectly labeled as "unisex" in the database
- Use your judgment about product appropriateness based on descriptions
- When in doubt about gender appropriateness, err on the side of exclusion
- Focus on items that clearly match the user's gender requirements

Remember: It's better to recommend fewer, more appropriate items than to include questionable matches.`;

    return prompt;
}

export default generateAnswer;