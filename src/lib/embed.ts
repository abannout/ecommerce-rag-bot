async function embedQuery(query: string) {
    const EMBED_API = process.env.EMBED_API!;
    console.log(EMBED_API)
    const res = await fetch(EMBED_API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.HF_API_KEY}`
        },
        body: JSON.stringify({ text: query }),
    });

    const json = await res.json();
    return json.embedding;
}

export default embedQuery;
