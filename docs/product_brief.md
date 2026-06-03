# Research Atlas Product Brief

## Product Promise

Research Atlas helps analysts, researchers, strategy teams, and curious technical readers understand where a research domain is moving: which subtopics are accelerating, which researchers are gaining visibility, which institutions are active, and how collaboration networks are shaped.

The MVP is intentionally static and curated. It now starts with a wider but still bounded set of high-signal profiles rather than trying to mirror all of OpenAlex:

- Generative AI / LLM topics such as large language models, RAG, AI agents, graph neural networks, and reinforcement learning
- Oncology and medicine topics such as multiple myeloma, cancer immunotherapy, CAR-T, lung cancer, breast cancer, colorectal cancer, pulmonary hypertension, and Alzheimer's disease
- Life sciences topics such as immunology, CRISPR, and spatial transcriptomics
- Physics and materials topics such as quantum computing, quantum materials, condensed matter physics, particle physics, fusion/plasma, and battery materials

## Target Users

- Researchers entering an adjacent area
- Academic strategy and research office teams
- Biotech, pharma, and KOL intelligence analysts
- Technical strategy teams monitoring AI and scientific frontiers
- Students building reading lists and understanding field structure

## Product Principles

- Curated over exhaustive
- Transparent metrics over mysterious rankings
- Rising visibility over absolute "best"
- Static artifacts over live browser API calls
- Compact visual intelligence over huge undirected graphs

## MVP Pages

- `/` Atlas home and topic explorer
- `/` Atlas workspace with OpenAlex domain / field / topic selectors
- `/topic/{slug}` deep link into the Atlas workspace
- `/trending` topic momentum ranking
- `/researchers` rising visibility discovery surface
- `/networks` collaboration intelligence with researcher, institution, geo, and matrix modes
- `/methodology` scoring methods, limitations, and update model

## First Data Backbone

OpenAlex is the backbone because it exposes works, authors, institutions, sources, funders, publishers, and topics as an interconnected research graph. Research Atlas uses OpenAlex Topics as the primary taxonomy and keyword searches as a recall supplement for newer phrases such as "large language model."
