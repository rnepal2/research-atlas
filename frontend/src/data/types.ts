export interface AtlasData {
  version: number
  generatedAt: string
  artifactStatus: string
  source: {
    label: string
    url: string
    notes: string
  }
  topics: TopicProfile[]
  taxonomy: TaxonomyDomain[]
  leaderboards: {
    authors: GlobalAuthorProfile[]
    institutions: GlobalInstitutionProfile[]
  }
  coverage: AtlasCoverage
  searchIndex: SearchIndexEntry[]
  skippedTopics?: {
    slug: string
    label: string
    worksCollected: number
  }[]
  trending: TrendingTopic[]
  methodology: Record<string, string>
}

export interface TopicProfile {
  slug: string
  label: string
  domain: string
  field: string
  subfield: string
  workArea: string
  description: string
  summary: string
  openalexTopicIds: string[]
  keywordQueries: string[]
  metrics: TopicMetrics
  quality: TopicQuality
  insights: TopicInsight[]
  yearlyMetrics: YearlyMetric[]
  subtopics: SubtopicMetric[]
  subtopicSeries: SubtopicSeriesPoint[]
  authors: AuthorProfile[]
  institutions: InstitutionProfile[]
  countries: CountryMetric[]
  papers: PaperProfile[]
  paperCollections: PaperCollections
  network: NetworkData
  institutionNetwork: NetworkData
  networkCommunities: {
    authors: NetworkCommunitySummary[]
    institutions: NetworkCommunitySummary[]
  }
  subtopicMatrix: SubtopicMatrix
  frontierCards: FrontierCard[]
}

export interface TopicMetrics {
  worksLastYear: number
  worksLast3Years: number
  worksLast5Years: number
  growthRate: number
  citationVelocity: number
  activeAuthors: number
  activeInstitutions: number
  concentrationScore: number
  fragmentationScore: number
  newAuthorShare: number
  crossDisciplinarySpread: number
  trendScore: number
}

export interface YearlyMetric {
  year: number
  works: number
  citations: number
  citationVelocity: number
  authors: number
  institutions: number
}

export interface SubtopicMetric {
  label: string
  works: number
  citations: number
  growth: number
  field: string
}

export interface SubtopicSeriesPoint {
  year: number
  subtopic: string
  works: number
  citations: number
  share: number
}

export interface AuthorProfile {
  id: string
  openalexId: string
  name: string
  institution: string
  country: string
  works: number
  recentWorks: number
  citations: number
  citationVelocity: number
  risingScore: number
  focus: number
  bridgeScore: number
  collaborationBreadth: number
  countryBreadth: number
  scoreDrivers: string[]
  topics: string[]
  recentWork: string
  url?: string
}

export interface InstitutionProfile {
  id: string
  openalexId: string
  name: string
  country: string
  type: string
  works: number
  recentWorks: number
  citations: number
  activeAuthors: number
  strengthScore: number
  subtopics: string[]
  partnerCount: number
  topicBreadth: number
  scoreDrivers: string[]
  url?: string
}

export interface CountryMetric {
  country: string
  name?: string
  works: number
  institutions: number
  citations: number
  workShare?: number
  rank?: number
}

export interface PaperProfile {
  id: string
  openalexId: string
  title: string
  year: number
  date?: string
  type: string
  citations: number
  citationVelocity: number
  source: string
  authors: string[]
  topic: string
  topics?: string[]
  url?: string
}

export interface PaperCollections {
  recentImpact: PaperProfile[]
  mostCited: PaperProfile[]
  newest: PaperProfile[]
  reviews: PaperProfile[]
  bridgePapers: PaperProfile[]
}

export interface TopicQuality {
  worksCollected: number
  topicIdMatchShare: number
  keywordFallbackShare: number
  authorResolutionRate: number
  institutionResolutionRate: number
  countryResolutionRate: number
  latestPublicationYear: number
  mappedCountries: number
  dataCompletenessScore: number
}

export interface TopicInsight {
  label: string
  title: string
  value: string
  description: string
  type: string
  url?: string
}

export interface AtlasCoverage {
  topics: number
  worksCollected: number
  fields: number
  workAreas: number
  mappedCountries: number
  averageCompletenessScore: number
}

export interface SearchIndexEntry {
  type: 'topic' | 'paper' | 'author' | 'institution'
  label: string
  description: string
  meta: string
  path: string
  score: number
}

export interface NetworkData {
  nodes: NetworkNode[]
  edges: NetworkEdge[]
}

export interface NetworkNode {
  id: string
  openalexId: string
  label: string
  type: string
  score: number
  community: string
  institution: string
  country?: string
  works?: number
}

export interface NetworkEdge {
  source: string
  target: string
  weight: number
  type: string
}

export interface NetworkCommunitySummary {
  label: string
  nodeCount: number
  edgeCount: number
  avgScore: number
  topInstitutions: string[]
  topCountries: string[]
  topNodes: {
    label: string
    score: number
  }[]
}

export interface FrontierCard {
  label: string
  title: string
  value: string
  description: string
  type: string
  url?: string
}

export interface TrendingTopic {
  slug: string
  label: string
  domain: string
  field: string
  subfield: string
  workArea: string
  trendScore: number
  growthRate: number
  worksLast3Years: number
  topSubtopic: string
  topInstitution?: string
  topCountry?: string
  newAuthorShare?: number
  qualityScore?: number
  whyTrending?: string
}

export interface TaxonomyDomain {
  domain: string
  fields: {
    field: string
    subfields: {
      subfield: string
      topics: {
        slug: string
        label: string
        workArea: string
        trendScore: number
      }[]
    }[]
  }[]
}

export interface SubtopicMatrix {
  columns: string[]
  rows: {
    institution: string
    country: string
    values: {
      subtopic: string
      value: number
    }[]
  }[]
}

export interface GlobalAuthorProfile extends AuthorProfile {
  topicsSeen: string[]
  aggregateScore: number
  aggregateRecentWorks: number
}

export interface GlobalInstitutionProfile extends InstitutionProfile {
  topicsSeen: string[]
  aggregateScore: number
  aggregateWorks: number
}
