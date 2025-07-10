
const EMBED_API = process.env.EMBED_API!;

async function embedQuery(query: string) {
    const res = await fetch(EMBED_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query }),
    });
    const json = await res.json();
    return json.embedding;
}
export default embedQuery;