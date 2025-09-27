"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, Upload, FileText, CheckCircle, ArrowLeft, Download, Eye, AlertCircle, Users, Calendar, DollarSign, FileWarning, CheckCircle2, XCircle } from "lucide-react"
import { useDropzone } from "react-dropzone"

// Interface correspondant à la réponse de votre API FastAPI
interface AnalysisResult {
  filename: string
  file_size: number
  text_length: number
  analysis: {
    contract_type: string
    parties: {
      client: string
      prestataire: string
    }
    financial: {
      amount: string
      duration: string
    }
    provider_commitments: string[]
    risk_clauses: string[]
    missing_elements: string[]
    detailed_explanations: Array<{
      titre: string
      explication: string
      risque: string
    }>
    contract_score: number
    recommendation: string
  }
  structure_detected: {
    [key: string]: string
  }
}

export default function UploadPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setAnalysisResult(null)
      setError(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  })

  const analyzeDocument = async () => {
    if (!uploadedFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Erreur lors de l'analyse")
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsAnalyzing(false)
      setActiveTab("overview")
    }
  }

  const getRiskLevel = (clause: string): "low" | "medium" | "high" => {
    if (clause.includes("🚨") || clause.toLowerCase().includes("excessif") || clause.toLowerCase().includes("déséquilibrée")) {
      return "high"
    } else if (clause.includes("⚠️") || clause.toLowerCase().includes("potentiellement")) {
      return "medium"
    }
    return "low"
  }

  const getRiskColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "high":
        return "border-red-300 bg-red-50"
      case "medium":
        return "border-yellow-300 bg-yellow-50"
      case "low":
        return "border-green-300 bg-green-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  const getRiskTextColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "high":
        return "text-red-700"
      case "medium":
        return "text-yellow-700"
      case "low":
        return "text-green-700"
      default:
        return "text-gray-700"
    }
  }

  const getRiskBadgeVariant = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      case "low":
        return "default"
      default:
        return "outline"
    }
  }

  const formatRiskClause = (clause: string) => {
    return clause.replace(/[🚨⚠️🔒⚖️💰🎯🤫⚡✅❌🔍📊👥📝🎨📌📖]/g, '').trim()
  }

  const getEmojiForClause = (clause: string) => {
    if (clause.includes("🚨")) return "🚨"
    if (clause.includes("⚠️")) return "⚠️"
    if (clause.includes("🔒")) return "🔒"
    if (clause.includes("⚖️")) return "⚖️"
    if (clause.includes("💰")) return "💰"
    if (clause.includes("🎯")) return "🎯"
    return "📄"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Analyse Contractuelle</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!uploadedFile ? (
          /* Upload Section */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4">Uploader un Contrat</h1>
              <p className="text-muted-foreground">Uploader votre contrat pour une analyse IA approfondie</p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  {isDragActive ? (
                    <p className="text-lg">Déposer le fichier ici...</p>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">Glisser-déposer votre document</p>
                      <p className="text-muted-foreground mb-4">ou cliquer pour parcourir les fichiers</p>
                      <Button variant="outline">Choisir un fichier</Button>
                    </div>
                  )}
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">Formats supportés: PDF (Max 10MB)</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Analysis Section */
          <div className="space-y-6">
            {/* File info and actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle>{uploadedFile.name}</CardTitle>
                      <CardDescription>
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • Uploadé à l'instant
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!analysisResult && !isAnalyzing && (
                      <Button onClick={analyzeDocument}>Analyser le Document</Button>
                    )}
                    <Button variant="outline" onClick={() => setUploadedFile(null)}>
                      Nouveau Fichier
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card>
                <CardHeader>
                  <CardTitle>Analyse en Cours...</CardTitle>
                  <CardDescription>Notre IA analyse votre contrat</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={66} className="w-full" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Document uploadé avec succès
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Extraction du texte et analyse des clauses...
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 border border-muted-foreground/25 rounded-full" />
                      Génération du rapport détaillé
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Results */}
            {analysisResult && (
              <div className="space-y-6">
                {/* Score Card */}
                <Card className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Score d'Équilibre du Contrat</CardTitle>
                        <CardDescription>{analysisResult.analysis.recommendation}</CardDescription>
                      </div>
                      <Badge 
                        variant={
                          analysisResult.analysis.contract_score >= 80 ? "default" :
                          analysisResult.analysis.contract_score >= 60 ? "secondary" : "destructive"
                        }
                        className="text-lg px-4 py-2"
                      >
                        {analysisResult.analysis.contract_score}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={analysisResult.analysis.contract_score} className="w-full h-3 mb-4" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium">Éléments Présents</div>
                        <div className="text-2xl font-bold text-green-600">
                          {7 - analysisResult.analysis.missing_elements.length}/7
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Clauses à Risque</div>
                        <div className="text-2xl font-bold text-red-600">
                          {analysisResult.analysis.risk_clauses.length}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">Engagements</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analysisResult.analysis.provider_commitments.length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Vue d'Ensemble</TabsTrigger>
                    <TabsTrigger value="parties">Parties</TabsTrigger>
                    <TabsTrigger value="clauses">Clauses</TabsTrigger>
                    <TabsTrigger value="analysis">Analyse Détaillée</TabsTrigger>
                    <TabsTrigger value="structure">Structure</TabsTrigger>
                  </TabsList>

                  {/* Vue d'Ensemble */}
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations Générales */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Informations Générales
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Type de Contrat</label>
                            <p className="font-medium">{analysisResult.analysis.contract_type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Taille du Texte</label>
                            <p className="font-medium">{analysisResult.text_length} caractères</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Fichier</label>
                            <p className="font-medium">{analysisResult.filename}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Aspects Financiers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Aspects Financiers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Montant</label>
                            <p className={`font-medium ${
                              analysisResult.analysis.financial.amount === "Non spécifié" ? "text-red-600" : "text-green-600"
                            }`}>
                              {analysisResult.analysis.financial.amount}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Durée</label>
                            <p className={`font-medium ${
                              analysisResult.analysis.financial.duration === "Non spécifiée" ? "text-red-600" : "text-green-600"
                            }`}>
                              {analysisResult.analysis.financial.duration}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Éléments Vérifiés */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5" />
                            Éléments Vérifiés
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {["montant", "duree", "livrables", "paiement", "propriete_intellectuelle", "confidentialite", "resiliation"].map((element) => {
                              const isPresent = !analysisResult.analysis.missing_elements.includes(element)
                              return (
                                <div key={element} className="flex items-center gap-2">
                                  {isPresent ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <span className={`text-sm ${isPresent ? "text-green-700" : "text-red-700"}`}>
                                    {element.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Alertes */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Alertes Principales
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {analysisResult.analysis.risk_clauses.length > 0 ? (
                            <div className="space-y-2">
                              {analysisResult.analysis.risk_clauses.slice(0, 3).map((clause, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <span>{getEmojiForClause(clause)}</span>
                                  <span className="flex-1">{formatRiskClause(clause)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-green-600 text-sm">✅ Aucune clause à risque majeur détectée</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Parties Contractantes */}
                  <TabsContent value="parties" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Parties Contractantes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Prestataire</h4>
                              <Card className="p-4">
                                <p className="text-sm">{analysisResult.analysis.parties.prestataire}</p>
                              </Card>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Engagements du Prestataire</h4>
                              {analysisResult.analysis.provider_commitments.length > 0 ? (
                                <div className="space-y-2">
                                  {analysisResult.analysis.provider_commitments.map((commitment, index) => (
                                    <Card key={index} className="p-3">
                                      <p className="text-sm">{commitment}</p>
                                    </Card>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">Aucun engagement spécifique détecté</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Client</h4>
                            <Card className="p-4">
                              <p className="text-sm">{analysisResult.analysis.parties.client}</p>
                            </Card>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Clauses à Risque */}
                  <TabsContent value="clauses" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Clauses à Attention</CardTitle>
                        <CardDescription>Analyse des clauses nécessitant une attention particulière</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysisResult.analysis.risk_clauses.length > 0 ? (
                            analysisResult.analysis.risk_clauses.map((clause, index) => {
                              const riskLevel = getRiskLevel(clause)
                              return (
                                <Card key={index} className={`border-l-4 ${getRiskColor(riskLevel)}`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <Badge variant={getRiskBadgeVariant(riskLevel)}>
                                        {riskLevel === "high" ? "Risque Élevé" : riskLevel === "medium" ? "Risque Moyen" : "Risque Faible"}
                                      </Badge>
                                      <span className="text-2xl">{getEmojiForClause(clause)}</span>
                                    </div>
                                    <p className={`text-sm ${getRiskTextColor(riskLevel)}`}>
                                      {formatRiskClause(clause)}
                                    </p>
                                  </CardContent>
                                </Card>
                              )
                            })
                          ) : (
                            <Card className="border-l-4 border-l-green-500">
                              <CardContent className="p-6 text-center">
                                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                <p className="text-green-700 font-medium">✅ Aucune clause à risque majeur détectée</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Explications Détaillées */}
                    {analysisResult.analysis.detailed_explanations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Explications Détaillées</CardTitle>
                          <CardDescription>Analyse approfondie des clauses complexes</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {analysisResult.analysis.detailed_explanations.map((explanation, index) => (
                              <Card key={index} className="p-4">
                                <h4 className="font-medium mb-2">{explanation.titre}</h4>
                                <p className="text-sm mb-2">{explanation.explication}</p>
                                <p className="text-sm text-muted-foreground">
                                  <strong>Risque:</strong> {explanation.risque}
                                </p>
                              </Card>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Analyse Détaillée */}
                  <TabsContent value="analysis" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Éléments Manquants */}
                      {analysisResult.analysis.missing_elements.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                              <FileWarning className="h-5 w-5" />
                              Éléments Manquants à Négocier
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {analysisResult.analysis.missing_elements.map((element, index) => (
                                <div key={index} className="flex items-center gap-2 text-red-700">
                                  <XCircle className="h-4 w-4" />
                                  <span>{element.replace('_', ' ').toUpperCase()}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Conseils Pratiques */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Conseils Pratiques</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">• Demandez toujours un avenant pour les modifications</p>
                          <p className="text-sm">• Conservez toutes les communications écrites</p>
                          <p className="text-sm">• Vérifiez les délais de paiement (max 45 jours)</p>
                          <p className="text-sm">• Négociez une clause de propriété intellectuelle équilibrée</p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Structure du Document */}
                  <TabsContent value="structure" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Structure du Document</CardTitle>
                        <CardDescription>Sections détectées dans le contrat</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(analysisResult.structure_detected).map(([section, content]) => (
                            <Card key={section} className="p-4">
                              <h4 className="font-medium mb-2 capitalize">{section.replace('_', ' ')}</h4>
                              <p className="text-sm text-muted-foreground">
                                {content ? `${content.substring(0, 100)}...` : 'Non détecté'}
                              </p>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}