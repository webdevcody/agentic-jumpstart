# Vector Search Implementation Prompt

<context>
I have a course platform with video transcripts stored in my PostgreSQL database. The transcripts are stored in the `segments` table in a `transcripts` text field. I currently have approximately 75 videos, and my PostgreSQL database is hosted on Railway.
</context>

<requirements>
I need to implement a vector search system that allows me to:
1. Generate vector embeddings for all course video transcripts
2. Store these vectors in my PostgreSQL database
3. Perform semantic searches over the transcripts to find videos that discuss specific topics
4. Make this search functionality available ONLY to admin users
</requirements>

<constraints>
- Database: PostgreSQL hosted on Railway
- Scale: ~75 videos (relatively small dataset)
- Some transcripts may be very long, so chunking strategy needs to be evaluated
- Admin-only access required for the search interface
</constraints>

<instructions>
1. **Architecture Planning:**
   - Determine the best approach for generating and storing vector embeddings
   - Evaluate whether transcript chunking is necessary (consider transcript length variability)
   - Design the database schema for storing vectors (consider PostgreSQL extensions like pgvector)
   - Plan the vector search implementation approach

2. **Admin Process:**
   - Design an admin-accessible process/interface to:
     - Generate vectors for all existing transcripts
     - Re-generate vectors when transcripts are updated
     - Monitor the vectorization process

3. **Search Implementation:**
   - Implement vector similarity search functionality
   - Create an admin-only search interface that:
     - Accepts a search query (topic/keywords)
     - Returns the most relevant videos ranked by relevance
     - Displays results with video titles, segments, and relevance scores

4. **Technical Considerations:**
   - Choose appropriate embedding model (consider cost, quality, and API availability)
   - Determine optimal chunk size if chunking is needed
   - Implement efficient vector storage and indexing
   - Ensure search performance is acceptable for ~75 videos
</instructions>

<output>
Please provide:
1. A detailed implementation plan with architecture decisions
2. Database schema changes needed (migrations)
3. Code implementation for:
   - Vector generation process
   - Vector storage
   - Search functionality
   - Admin UI for search
4. Recommendations on:
   - Whether chunking is necessary and optimal chunk size
   - Embedding model selection
   - Vector storage approach (pgvector vs alternatives)
</output>

