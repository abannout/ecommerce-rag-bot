# E-Commerce RAG-Chatbot

## Overview
An intelligent shopping assistant leveraging Retrieval-Augmented Generation (RAG) technology to provide personalized product recommendations and answer customer queries in natural language. This project serves as the practical implementation for a bachelor's thesis investigating the impact of RAG-based chatbots on customer engagement in e-commerce platforms.

Built with a comprehensive dataset of **30,000 products** stored in Supabase vector database for high-performance semantic search.

## Research Questions
This project addresses three key research questions:
1. **Customer Engagement**: How does a RAG chatbot influence customer retention compared to traditional search systems?
2. **User Behavior Impact**: What effects does a RAG system have on user behavior, satisfaction, and conversion rates?
3. **Integration Success Factors**: What technical and organizational success factors emerge when integrating into existing platforms?

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with vector extensions)
- **Dataset**: 30,000 fashion products with vector embeddings
- **Embedding Service**: FastAPI with SentenceTransformers (multilingual-e5-small)
- **LLM**: Meta Llama 3.1 8B Instruct via Kiski API
- **Authentication**: Supabase Auth (Anonymous users)

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Supabase account
- LLM API access (Kiski/OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/abannout/ecommerce-rag-bot
   cd ecommerce-rag-bot
    ```

2. **Install dependencies**
    ```
    npm install
    ```
3. **Set up embedding service**
    ```
    cd embeding
    python -m venv venv
    venv\Scripts\Activate.ps1  # Windows
    # source venv/bin/activate  # macOS/Linux
    pip install fastapi uvicorn sentence-transformers
    ```
4. **Environment configuration**

    Create ``.env.local:``
    ````
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
    EMBED_API=http://localhost:8000/embed
    KISKI_ENDPOINT=your_llm_api_endpoint
    KISKI_API=your_llm_api_key
    ````
5. **Start services**
    ````
    # Terminal 1: Embedding service
    cd embeding
    uvicorn embed_api:app --host 0.0.0.0 --port 8000 --reload

    # Terminal 2: Next.js app
    npm run dev
    ````
## Data Pipeline

### Product Dataset
- **Scale**: 30,000 fashion products from ASOS catalog  
- **Content**: Product names, descriptions, prices, categories, colors, sizes  
- **Processing**: Cleaned descriptions with structured metadata extraction  
- **Storage**: Vector embeddings in Supabase with semantic search capabilities  

### Product Embedding Process
1. **Data Ingestion**: Load ASOS product catalog from CSV (`embed_products.ts`)  
2. **Content Processing**: Clean and format product descriptions using `cleanDescription()`  
3. **Embedding Generation**: Create vector representations using multilingual-e5-small model  
4. **Vector Storage**: Store 30k+ embeddings in Supabase `product_chunks` table  
5. **Batch Processing**: Handle large dataset with optimized batch operations  

```typescript
// Example: Product embedding workflow
const content = formatContentForRAG(productRow);
const embedding = await embedQuery(content);
await supabase.from('product_chunks').insert({
  content,
  embedding,
});
```
---

## RAG Implementation

### Enhanced Search Pipeline
The system processes user queries through multiple stages to find the most relevant products from the 30,000-item catalog:

1. **Query Processing**: Extract attributes (gender, category, occasion) using `extractQueryAttributes()`  
2. **Query Expansion**: Generate multiple search variants with German↔English translation  
3. **Vector Similarity**: Match against 30k product embeddings using `match_product_chunks_cleaned()`  
4. **Content Filtering**: Apply gender/category constraints with `contentBasedFilter()`  
5. **Result Ranking**: Combine similarity scores + attribute matching for optimal results  

```typescript
// Enhanced search workflow
const attributes = extractQueryAttributes(originalQuery);
const searchQueries = createMultipleSearchQueries(originalQuery);
const allResults = await performVectorSearch(searchQueries);
const filteredResults = contentBasedFilter(allResults, attributes);
const rankedResults = rankResults(filteredResults, attributes);
```
---

## Frontend Components

### Core Components
- **`EcommerceChatbot`**: Main chat interface with gradient design  
- **`ChatMessages`**: Scrollable message display with loading indicators  
- **`ChatInput`**: User input with validation and send functionality  
- **`MessageBubble`**: Styled message containers with timestamps  
- **`LoadingIndicator`**: Engaging loading animation during processing  

### State Management
- **`useAuth`**: Anonymous user authentication with Supabase  
- **`useChatMessages`**: Message persistence and chat history loading  
- **Real-time UI**: Responsive chat experience with optimistic updates  

---

## API Architecture

### Core Endpoints
- **`/api/chat`**: Main chat processing endpoint handling RAG pipeline  
- **FastAPI Embedding Service** (`embed_api.py`): Dedicated microservice on port 8000  

### Chat Flow
1. User submits query → `POST /api/chat` → Extract user/query attributes  
2. Enhanced search → Query 30k product vectors → Get relevant matches  
3. Context building → Generate LLM prompt → Get conversational response  
4. Database persistence → Save user query and assistant response  
5. Return formatted answer → Update chat interface  

```typescript
// Chat API workflow
const matches = await performEnhancedSearch(query, 5);
const context = buildProductContext(matches);
const answer = await generateAnswer(context, query, chatHistory);
await saveChat(userId, query, answer);
```
---

## Performance Optimizations

### Caching Strategy
- **Embedding Cache**: 1-hour TTL, 1000 item limit for frequently accessed queries  
- **Query Cache**: Prevents duplicate searches across user sessions  
- **Search Cache**: Results caching for common fashion queries  
- **Warm-up System**: Pre-cache popular terms (wedding dress, business suit, etc.)  

### Database Optimization
- **Vector Indexing**: Fast similarity search across 30k embeddings  
- **Batch Processing**: Efficient data ingestion with 10-item batches  
- **Connection Pooling**: Supabase optimization for concurrent users  
- **Match Threshold**: 0.7 similarity threshold for quality results  

```typescript
// Performance monitoring
const stats = {
  totalProducts: 30000,
  cacheHitRate: getCacheHitRate(),
  averageSearchTime: measureSearchLatency(),
  embeddingCacheSize: getEmbeddingCacheStats()
};
```

## Multilingual Support

### Language Processing Pipeline
The system handles German and English queries seamlessly:

- **German Input**: "Schwarzes Hochzeitskleid für Frauen"  
- **Translation**: "Black wedding dress for women"  
- **Attribute Extraction**: Color=black, Category=formal wear, Gender=female  
- **Search Execution**: Query 30k products with appropriate filters  
- **Response**: Contextual recommendations in user's preferred language  

```typescript
// Multilingual query processing
const translatedQuery = translateGermanToEnglish(originalQuery);
const expandedQueries = createMultipleSearchQueries(originalQuery);
// Searches both original German and English variants
```
---

## Security & Privacy

### Data Protection
- **Anonymous Authentication**: No personal data collection or storage  
- **Secure API Communication**: Environment variables for sensitive keys  
- **Input Validation**: injection prevention across all inputs  
- **Rate Limiting**: Prevents abuse of embedding and LLM services  

---

## Known Limitations
- **Dataset Scope**: Limited to ASOS fashion catalog (30k products)  
- **Language Support**: Currently German/English only  
- **Real-time Inventory**: Static product data, no live availability  
- **Complex Queries**: Multi-intent queries may need query refinement  
- **Product Images**: Text-based search only, no visual similarity  

## Future Enhancements

### Planned Features
- **Expanded Dataset**: Scale beyond 30k products to 100k+ items  
- **Real-time Inventory**: Live product availability and pricing  
- **Visual Search**: Image-based product queries and similarity  
- **Advanced Personalization**: User preference learning and history  
- **Multi-platform**: Mobile app integration with shared backend  
- **Enhanced Analytics**: Detailed conversion funnel analysis  

### Technical Improvements
- **Embedding Model Upgrades**: Fine-tuned fashion-specific embeddings  
- **Query Understanding**: Better handling of complex, multi-intent queries  
- **Performance Scaling**: Optimizations for larger product catalogs  
---

## Contributing
This project serves as the technical implementation for academic research. The codebase demonstrates practical application of RAG technology in e-commerce settings with real-world scale (30k products).  

---


