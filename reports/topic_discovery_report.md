# Topic Discovery Report

Initial topic probes were run against the OpenAlex Topics API.

| Curated domain | OpenAlex topic seed | Notes |
| --- | --- | --- |
| Large Language Models | `T10028` Topic Modeling | OpenAlex topic search does not currently expose a narrow "large language models" topic in this probe. The MVP uses the broader NLP/topic modeling topic plus keyword fallback queries for "large language model", "generative artificial intelligence", "transformer language model", and "retrieval augmented generation". |
| Multiple Myeloma | `T10649` Multiple Myeloma Research and Treatments | Strong direct match. |
| Spatial Transcriptomics | `T11289` Single-cell and spatial transcriptomics | Strong direct match, but broad enough to include single-cell transcriptomics. |

Recommended next discovery pass:

- Review top 200 works per domain for noise.
- Add exclusion keywords if LLM search pulls social-science text analysis papers.
- Split spatial transcriptomics from general single-cell when enough OpenAlex topic granularity is available.
- Compare `topics.id` and `primary_topic.id` recall and precision.

