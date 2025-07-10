const KISKI_API = process.env.KISKI_ENDPOINT!;
const KISKI_API_KEY = process.env.KISKI_API!;

async function generateAnswer(context: string, query: string) {
    const messages = [
        {
            role: "system",
            content: "You are a helpful e-commerce assistant. Use the product info provided to answer the user's question. please in reply in the langauge that the user uses, if there is no product info provided, just say there si no matching products",
        },
        {
            role: "user",
            content: `${context}\n\nQ: ${query}`,
        },
    ];

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
                temperature: 0.5,
                top_p: 0.5,
            }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`LLM API Error (${res.status}): ${errorText}`);
        }
        console.log(res)

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
export default generateAnswer;