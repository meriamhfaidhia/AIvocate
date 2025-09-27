"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Scale,
  Search,
  ArrowLeft,
  BookOpen,
  ExternalLink,
  Clock,
  Star,
  Filter,
  Sparkles,
  FileText,
  Gavel,
} from "lucide-react"

interface SearchResult {
  id: number
  title: string
  type: "case" | "statute" | "regulation" | "precedent"
  jurisdiction: string
  date: string
  relevanceScore: number
  summary: string
  citation: string
  source: string
  keyPoints: string[]
}

interface AIResponse {
  answer: string
  confidence: number
  sources: number[]
  relatedQueries: string[]
}

interface AnswerResponse {
  answer: string
  links: string[]
}

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [filterJurisdiction, setFilterJurisdiction] = useState("all")
  const [apiResponse, setApiResponse] = useState<AnswerResponse | null>(null)

  const mockResults: SearchResult[] = [
    {
      id: 1,
      title: "Smith v. Johnson - Interprétation de contrat",
      type: "case",
      jurisdiction: "Fédéral",
      date: "2023-08-15",
      relevanceScore: 95,
      summary:
        "Affaire historique établissant les principes d'interprétation des termes ambigus dans les contrats commerciaux. La cour a statué que les preuves extrinsèques peuvent être considérées lorsque le langage du contrat est ambigu.",
      citation: "Smith v. Johnson, 789 F.3d 123 (2023)",
      source: "Base de données des cours fédérales",
      keyPoints: [
        "Les termes ambigus nécessitent des preuves extrinsèques",
        "Le contexte commercial est important dans l'interprétation",
        "La bonne foi est implicite dans tous les contrats",
      ],
    },
    {
      id: 2,
      title: "Code de commerce uniforme § 2-207",
      type: "statute",
      jurisdiction: "Fédéral",
      date: "2023-01-01",
      relevanceScore: 88,
      summary:
        "Termes additionnels dans l'acceptation ou la confirmation. Régit la bataille des formes dans les transactions commerciales et quand les termes additionnels font partie du contrat.",
      citation: "UCC § 2-207",
      source: "Institut d'information juridique",
      keyPoints: ["Résolution de la bataille des formes", "Termes additionnels dans l'acceptation", "Test d'altération matérielle"],
    },
    {
      id: 3,
      title: "Exigences de formation des contrats",
      type: "regulation",
      jurisdiction: "Californie",
      date: "2023-06-01",
      relevanceScore: 82,
      summary:
        "Dispositions du code civil californien concernant les éléments essentiels de la formation d'un contrat : offre, acceptation, considération et consentement mutuel.",
      citation: "Cal. Civ. Code § 1550-1701",
      source: "Information législative californienne",
      keyPoints: [
        "Quatre éléments essentiels requis",
        "Le consentement mutuel doit être clair",
        "La considération doit avoir une valeur légale",
      ],
    },
    {
      id: 4,
      title: "Williams v. Tech Solutions - Limitations de responsabilité",
      type: "precedent",
      jurisdiction: "New York",
      date: "2023-03-22",
      relevanceScore: 79,
      summary:
        "Analyse judiciaire des clauses de limitation de responsabilité dans les accords de service. Établit des lignes directrices pour les dispositions de limitation de responsabilité exécutoires.",
      citation: "Williams v. Tech Solutions, 456 N.Y.S.2d 789 (2023)",
      source: "Tribunaux de l'État de New York",
      keyPoints: [
        "Les plafonds de responsabilité doivent être raisonnables",
        "Ne peut exclure la négligence grave",
        "Un langage clair est requis pour l'exécution",
      ],
    },
  ]

  // Nouvelle fonction pour appeler l'API backend
  const callAskAPI = async (question: string): Promise<AnswerResponse> => {
    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP! statut: ${response.status}`)
      }

      const data: AnswerResponse = await response.json()
      return data
    } catch (error) {
      console.error("Erreur lors de l'appel à l'API:", error)
      throw error
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsSearching(true)
    setSearchResults([])
    setAiResponse(null)
    setApiResponse(null)

    try {
      // Appel à l'API backend
      const apiResult = await callAskAPI(query)
      setApiResponse(apiResult)

      // Filtrer les résultats mock basés sur la requête (pour la démo)
      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.summary.toLowerCase().includes(query.toLowerCase()) ||
          result.keyPoints.some((point) => point.toLowerCase().includes(query.toLowerCase())),
      )

      setSearchResults(filteredResults.length > 0 ? filteredResults : mockResults)

      // Réponse AI basée sur la réponse de l'API
      setAiResponse({
        answer: apiResult.answer || `Sur la base des précédents juridiques et des lois, ${query.toLowerCase()} implique généralement plusieurs considérations clés. L'interprétation des contrats nécessite d'examiner d'abord le langage clair, puis de considérer les preuves extrinsèques en cas d'ambiguïté.`,
        confidence: 87,
        sources: [1, 2, 3],
        relatedQueries: [
          "Éléments de formation des contrats",
          "Exécutabilité des limitations de responsabilité",
          "Interprétation des contrats commerciaux",
          "Preuves extrinsèques dans les contrats",
        ],
      })

    } catch (error) {
      console.error("Erreur de recherche:", error)
      
      // Fallback aux données mock en cas d'erreur
      const filteredResults = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.summary.toLowerCase().includes(query.toLowerCase()) ||
          result.keyPoints.some((point) => point.toLowerCase().includes(query.toLowerCase())),
      )

      setSearchResults(filteredResults.length > 0 ? filteredResults : mockResults)
      setAiResponse({
        answer: `Sur la base des précédents juridiques et des lois, ${query.toLowerCase()} implique généralement plusieurs considérations clés. L'interprétation des contrats nécessite d'examiner d'abord le langage clair, puis de considérer les preuves extrinsèques en cas d'ambiguïté.`,
        confidence: 87,
        sources: [1, 2, 3],
        relatedQueries: [
          "Éléments de formation des contrats",
          "Exécutabilité des limitations de responsabilité",
          "Interprétation des contrats commerciaux",
          "Preuves extrinsèques dans les contrats",
        ],
      })
    } finally {
      setIsSearching(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "case":
        return "default"
      case "statute":
        return "secondary"
      case "regulation":
        return "outline"
      case "precedent":
        return "destructive"
      default:
        return "default"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "case":
        return <Gavel className="h-4 w-4" />
      case "statute":
        return <BookOpen className="h-4 w-4" />
      case "regulation":
        return <FileText className="h-4 w-4" />
      case "precedent":
        return <Star className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const filteredResults = searchResults.filter((result) => {
    const matchesType = filterType === "all" || result.type === filterType
    const matchesJurisdiction = filterJurisdiction === "all" || result.jurisdiction === filterJurisdiction
    return matchesType && matchesJurisdiction
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Recherche Juridique</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Recherche Juridique Assistée par IA</h1>
          <p className="text-muted-foreground text-lg">
            Recherchez parmi des millions de documents juridiques, affaires et lois avec l'assistance de l'IA
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Textarea
                    placeholder="Posez une question juridique ou recherchez des affaires, lois, règlements..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        handleSearch()
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Type de document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="case">Affaires</SelectItem>
                    <SelectItem value="statute">Lois</SelectItem>
                    <SelectItem value="regulation">Règlements</SelectItem>
                    <SelectItem value="precedent">Précédents</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Juridiction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les juridictions</SelectItem>
                    <SelectItem value="Fédéral">Fédéral</SelectItem>
                    <SelectItem value="Californie">Californie</SelectItem>
                    <SelectItem value="New York">New York</SelectItem>
                    <SelectItem value="Texas">Texas</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={isSearching || !query.trim()} className="md:w-auto">
                  {isSearching ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Recherche en cours...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Réponse de l'API */}
        {apiResponse && (
          <Card className="mb-8 border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Analyse Juridique par IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{apiResponse.answer}</p>
              
              {apiResponse.links && apiResponse.links.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Sources :</h4>
                  <div className="space-y-1">
                    {apiResponse.links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline break-all"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Response (mock) */}
        {aiResponse && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Analyse Juridique par IA
                <Badge variant="outline">{aiResponse.confidence}% confiance</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{aiResponse.answer}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Sources :</span>
                {aiResponse.sources.map((sourceId, index) => (
                  <Badge key={sourceId} variant="outline" className="text-xs">
                    [{index + 1}]
                  </Badge>
                ))}
              </div>
              {aiResponse.relatedQueries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recherches associées :</h4>
                  <div className="flex flex-wrap gap-2">
                    {aiResponse.relatedQueries.map((relatedQuery, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuery(relatedQuery)}
                        className="text-xs"
                      >
                        {relatedQuery}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Résultats de recherche ({filteredResults.length})</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtré par pertinence</span>
              </div>
            </div>

            <div className="space-y-4">
              {filteredResults.map((result, index) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={getTypeColor(result.type)} className="text-xs">
                            {getTypeIcon(result.type)}
                            <span className="ml-1 capitalize">{result.type === "case" ? "affaire" : 
                                 result.type === "statute" ? "loi" : 
                                 result.type === "regulation" ? "règlement" : "précédent"}</span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {result.jurisdiction}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {result.date}
                          </div>
                        </div>
                        <CardTitle className="text-lg leading-tight">{result.title}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">{result.citation}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {result.relevanceScore}% correspondance
                        </Badge>
                        {aiResponse?.sources.includes(result.id) && (
                          <Badge variant="default" className="text-xs">
                            [{aiResponse.sources.indexOf(result.id) + 1}]
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed">{result.summary}</p>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Points clés :</h4>
                      <ul className="space-y-1">
                        {result.keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground">Source : {result.source}</div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Voir le document complet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {searchResults.length === 0 && !isSearching && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Commencez votre recherche juridique</h3>
            <p className="text-muted-foreground mb-4">
              Entrez votre question juridique ou vos termes de recherche ci-dessus pour trouver des affaires, lois et précédents pertinents
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Interprétation de contrat",
                "Limitations de responsabilité",
                "Droit du travail",
                "Propriété intellectuelle",
                "Gouvernance d'entreprise",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}