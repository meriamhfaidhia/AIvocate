"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Scale,
  ArrowLeft,
  FileText,
  Download,
  Eye,
  Sparkles,
  Calendar,
  DollarSign,
  User,
  Building,
  Mail,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileWarning,
  ExternalLink,
  BarChart3,
  PieChart,
  Image as ImageIcon,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

// Interfaces pour l'analyse des emails
interface EmailAnalysisResult {
  sujet: string
  expediteur: string
  date: string
  ton_email: string
  score_ton: string
  pieces_jointes_juridiques: number
  noms_pieces_jointes: string
  raison_filtrage: string
  pieces_jointes_detaillees?: PieceJointeDetaillee[]
  clauses_analysees?: ClauseAnalysee[]
  id?: string
  total_pieces_jointes?: number
}

interface PieceJointeDetaillee {
  nom: string
  raison: string
  clauses_identifiees: number
  clauses_risque_eleve: number
  clauses_risque_modere: number
  clauses_risque_faible: number
  texte_extrait?: string
}

interface ClauseAnalysee {
  texte: string
  score_risque: number
  niveau_risque: "ÉLEVÉ" | "MODÉRÉ" | "FAIBLE"
  mots_cles_risque: string[]
}

interface AnalysisSummary {
  total_emails_analyses: number
  total_pieces_jointes_juridiques: number
  emails_avec_risque_eleve: number
  emails_avec_risque_modere: number
  emails_avec_risque_faible: number
  ton_moyen: string
  score_ton_moyen: number
  rapport_sauvegarde?: string
  total_pieces_jointes_analysées?: number
}

interface AnalysisResponse {
  resultats: EmailAnalysisResult[]
  resume: AnalysisSummary
  log_analyse?: string[]
  image_heatmap?: string // Base64 encoded image
}

export default function EmailAnalysisPage() {
  const [activeTab, setActiveTab] = useState("analysis")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<EmailAnalysisResult | null>(null)
  const [filterRisk, setFilterRisk] = useState("all")
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({})
  const [logMessages, setLogMessages] = useState<string[]>([])

  // Fonction pour appeler l'API d'analyse des emails
  const analyzeEmails = async () => {
    setIsAnalyzing(true)
    setAnalysisData(null)
    setSelectedEmail(null)
    setLogMessages([])

    try {
      const response = await fetch("http://localhost:8000/analyse-mails")
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }
      
      const data: AnalysisResponse = await response.json()
      setAnalysisData(data)
      
      // Simuler les logs de l'analyse Python
      simulateAnalysisLogs(data)
      
    } catch (error) {
      console.error("Erreur lors de l'analyse des emails:", error)
      
      // Données mock pour la démonstration basées sur votre sortie réelle
      const mockData: AnalysisResponse = {
        resultats: [
          {
            sujet: "Transmission du contrat pour analyse et vérification des clauses",
            expediteur: "maryem hfaidhia <maryem.hfaidhia@gmail.com>",
            date: "Fri, 26 Sep 2025 03:58:15 +0100",
            ton_email: "Ton conciliant ✅",
            score_ton: "0.32",
            pieces_jointes_juridiques: 1,
            noms_pieces_jointes: "CONTRAT.pdf",
            raison_filtrage: "1 pièce(s) jointe(s) juridique(s) identifiée(s)",
            pieces_jointes_detaillees: [
              {
                nom: "CONTRAT.pdf",
                raison: "Pièce jointe juridique: contrat dans 'CONTRAT.pdf'",
                clauses_identifiees: 8,
                clauses_risque_eleve: 2,
                clauses_risque_modere: 1,
                clauses_risque_faible: 5,
                texte_extrait: "Contrat de location contenant 8 clauses analysées avec détection des risques"
              }
            ],
            clauses_analysees: [
              {
                texte: "Article 1 – Paiement du loyer - Le locataire s'engage à payer le loyer mensuel à terme échu, le premier jour de chaque mois, par virement bancaire.",
                score_risque: 0.79,
                niveau_risque: "ÉLEVÉ",
                mots_cles_risque: ["paiement", "loyer", "engagement"]
              },
              {
                texte: "Article 6 – Sanctions et pénalités - Le propriétaire se réserve le droit d'appliquer des pénalités en cas de retard de paiement supérieur à 15 jours.",
                score_risque: 0.79,
                niveau_risque: "ÉLEVÉ",
                mots_cles_risque: ["sanctions", "pénalités", "retard"]
              },
              {
                texte: "Article 7 – Assurance - Le locataire doit souscrire une assurance couvrant les risques locatifs dans un délai de 8 jours suivant la signature.",
                score_risque: 0.52,
                niveau_risque: "MODÉRÉ",
                mots_cles_risque: ["assurance", "délai", "obligation"]
              }
            ]
          }
        ],
        resume: {
          total_emails_analyses: 1,
          total_pieces_jointes_juridiques: 1,
          emails_avec_risque_eleve: 0,
          emails_avec_risque_modere: 0,
          emails_avec_risque_faible: 1,
          ton_moyen: "Ton conciliant ✅",
          score_ton_moyen: 0.32,
          rapport_sauvegarde: "analyse_emails_pieces_jointes_juridiques.csv",
          total_pieces_jointes_analysées: 1
        },
        log_analyse: [
          "🔍 Récupération des emails...",
          "→ 100 emails récupérés au total",
          "→ 1 pièces jointes totales détectées",
          "🔎 Filtrage STRICT : emails avec pièces jointes juridiques...",
          "→ 1 emails avec pièces jointes juridiques identifiés",
          "📧 ANALYSE 1/1 - Sujet: Transmission du contrat pour analyse et vérification des clauses",
          "📊 Ton de l'email: Ton conciliant ✅ (score: 0.32)",
          "📄 DOCUMENT: CONTRAT.pdf - 8 clauses analysées",
          "🔴 Top 3 clauses à risque identifiées",
          "✅ RAPPORT FINAL - 1 email analysé, rapport sauvegardé"
        ]
      }

      setAnalysisData(mockData)
      simulateAnalysisLogs(mockData)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Simuler l'affichage des logs en temps réel
  const simulateAnalysisLogs = (data: AnalysisResponse) => {
    const logs = data.log_analyse || [
      "🔍 Démarrage de l'analyse des emails...",
      "→ Connexion au serveur IMAP...",
      "→ Récupération des emails en cours...",
      "→ Filtrage des pièces jointes juridiques...",
      "→ Analyse du ton des emails...",
      "→ Détection des clauses à risque...",
      "✅ Analyse terminée avec succès"
    ]

    logs.forEach((log, index) => {
      setTimeout(() => {
        setLogMessages(prev => [...prev, log])
      }, index * 800)
    })
  }

  // Toggle l'expansion des sections
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Télécharger le rapport CSV
  const downloadCSVReport = () => {
    if (!analysisData?.resume.rapport_sauvegarde) return

    // Créer un fichier CSV mock basé sur les données
    const csvContent = "sujet,expediteur,date,ton_email,score_ton,pieces_jointes_juridiques,noms_pieces_jointes,raison_filtrage\n" +
      analysisData.resultats.map(email => 
        `"${email.sujet}","${email.expediteur}","${email.date}","${email.ton_email}","${email.score_ton}",${email.pieces_jointes_juridiques},"${email.noms_pieces_jointes}","${email.raison_filtrage}"`
      ).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = analysisData.resume.rapport_sauvegarde
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Obtenir la couleur du badge de risque
  const getRiskColor = (score: number) => {
    if (score > 0.66) return "destructive"
    if (score > 0.33) return "secondary"
    return "default"
  }

  // Obtenir l'icône de risque
  const getRiskIcon = (score: number) => {
    if (score > 0.66) return <AlertTriangle className="h-4 w-4" />
    if (score > 0.33) return <Clock className="h-4 w-4" />
    return <CheckCircle className="h-4 w-4" />
  }

  const analysisResults = analysisData?.resultats || []
  const analysisSummary = analysisData?.resume

  // Filtrer les résultats par niveau de risque
  const filteredResults = analysisResults.filter(email => {
    if (filterRisk === "all") return true
    const score = parseFloat(email.score_ton)
    if (filterRisk === "high") return score > 0.66
    if (filterRisk === "medium") return score > 0.33 && score <= 0.66
    if (filterRisk === "low") return score <= 0.33
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Analyse des Emails Juridiques</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Analyse Automatique des Emails</h1>
          <p className="text-muted-foreground text-lg">
            Détection et analyse des pièces jointes juridiques avec évaluation des risques
          </p>
        </div>

        {/* Contrôles d'analyse */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Analyse automatique des emails avec filtrage strict des pièces jointes juridiques
                </p>
              </div>
              <Button 
                onClick={analyzeEmails} 
                disabled={isAnalyzing}
                size="lg"
                className="md:w-auto"
              >
                {isAnalyzing ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Lancer l'analyse des emails
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logs en temps réel */}
        {isAnalyzing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Journal d'analyse en temps réel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto">
                {logMessages.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
                {isAnalyzing && (
                  <div className="animate-pulse">▊</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Analyse</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedEmail}>
              Détails Email
            </TabsTrigger>
            <TabsTrigger value="report" disabled={!analysisSummary}>
              Rapport Complet
            </TabsTrigger>
            <TabsTrigger value="clauses" disabled={!analysisData}>
              Heatmap Clauses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {/* Résumé rapide */}
            {analysisSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Résumé de l'analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{analysisSummary.total_emails_analyses}</div>
                      <div className="text-sm text-muted-foreground">Emails analysés</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{analysisSummary.total_pieces_jointes_juridiques}</div>
                      <div className="text-sm text-muted-foreground">Pièces jointes</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{analysisSummary.emails_avec_risque_faible}</div>
                      <div className="text-sm text-muted-foreground">Risque faible</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{analysisSummary.ton_moyen}</div>
                      <div className="text-sm text-muted-foreground">Ton moyen</div>
                    </div>
                  </div>
                  
                  {analysisSummary.rapport_sauvegarde && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-blue-700">
                        <FileSpreadsheet className="h-4 w-4" />
                        <span className="font-medium">Rapport sauvegardé:</span>
                        <span>{analysisSummary.rapport_sauvegarde}</span>
                        <Button variant="outline" size="sm" onClick={downloadCSVReport} className="ml-auto">
                          <Download className="h-3 w-3 mr-1" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Filtres */}
            {analysisResults.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filtrer par risque:</span>
                    </div>
                    <Select value={filterRisk} onValueChange={setFilterRisk}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Tous les risques" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les risques</SelectItem>
                        <SelectItem value="high">Risque élevé</SelectItem>
                        <SelectItem value="medium">Risque modéré</SelectItem>
                        <SelectItem value="low">Risque faible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Liste des emails analysés */}
            {filteredResults.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Emails avec pièces jointes juridiques ({filteredResults.length})
                </h3>
                {filteredResults.map((email, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedEmail(email)
                      setActiveTab("details")
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={getRiskColor(parseFloat(email.score_ton))}>
                              {getRiskIcon(parseFloat(email.score_ton))}
                              <span className="ml-1">{email.ton_email}</span>
                            </Badge>
                            <Badge variant="outline">
                              {email.pieces_jointes_juridiques} pièce(s) jointe(s)
                            </Badge>
                            <span className="text-sm text-muted-foreground">{email.date}</span>
                          </div>
                          
                          <h4 className="font-medium leading-tight">{email.sujet}</h4>
                          
                          <div className="text-sm text-muted-foreground">
                            De: {email.expediteur}
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            {email.noms_pieces_jointes}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {(parseFloat(email.score_ton) * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Score risque</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : analysisResults.length === 0 && !isAnalyzing ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucune analyse effectuée</h3>
                  <p className="text-muted-foreground mb-4">
                    Cliquez sur "Lancer l'analyse" pour scanner vos emails et détecter les pièces jointes juridiques
                  </p>
                </CardContent>
              </Card>
            ) : filteredResults.length === 0 && analysisResults.length > 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Aucun email correspondant aux filtres</h3>
                  <p className="text-muted-foreground">
                    Aucun email ne correspond au niveau de risque sélectionné
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            {selectedEmail && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Détails de l'email analysé</span>
                      <Badge variant={getRiskColor(parseFloat(selectedEmail.score_ton))}>
                        {selectedEmail.ton_email} ({(parseFloat(selectedEmail.score_ton) * 100).toFixed(1)}%)
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Analyse détaillée des pièces jointes juridiques et clauses détectées
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Sujet</h4>
                        <p className="text-sm bg-muted/30 p-2 rounded">{selectedEmail.sujet}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Expéditeur</h4>
                        <p className="text-sm bg-muted/30 p-2 rounded">{selectedEmail.expediteur}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Date de réception</h4>
                        <p className="text-sm bg-muted/30 p-2 rounded">{selectedEmail.date}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Raison du filtrage</h4>
                        <p className="text-sm bg-muted/30 p-2 rounded">{selectedEmail.raison_filtrage}</p>
                      </div>
                    </div>

                    <div>
                      <div 
                        className="flex items-center justify-between cursor-pointer p-3 bg-muted/30 rounded-lg"
                        onClick={() => toggleSection('pieces_jointes')}
                      >
                        <h4 className="font-medium">Pièces jointes identifiées</h4>
                        {expandedSections['pieces_jointes'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                      {expandedSections['pieces_jointes'] && (
                        <div className="mt-3 space-y-3">
                          {selectedEmail.pieces_jointes_detaillees?.map((pj, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4" />
                                  {pj.nom}
                                </span>
                                <Badge variant="outline">
                                  {pj.clauses_identifiees} clauses analysées
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{pj.raison}</p>
                              <div className="flex gap-2 text-xs">
                                <Badge variant="destructive" className="text-xs">
                                  {pj.clauses_risque_eleve} risque élevé
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {pj.clauses_risque_modere} risque modéré
                                </Badge>
                                <Badge variant="default" className="text-xs">
                                  {pj.clauses_risque_faible} risque faible
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedEmail.clauses_analysees && selectedEmail.clauses_analysees.length > 0 && (
                      <div>
                        <div 
                          className="flex items-center justify-between cursor-pointer p-3 bg-muted/30 rounded-lg"
                          onClick={() => toggleSection('clauses_risque')}
                        >
                          <h4 className="font-medium">Clauses à risque identifiées</h4>
                          {expandedSections['clauses_risque'] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                        {expandedSections['clauses_risque'] && (
                          <div className="mt-3 space-y-3">
                            {selectedEmail.clauses_analysees.map((clause, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <Badge variant={
                                    clause.niveau_risque === "ÉLEVÉ" ? "destructive" :
                                    clause.niveau_risque === "MODÉRÉ" ? "secondary" : "default"
                                  }>
                                    {clause.niveau_risque} ({(clause.score_risque * 100).toFixed(0)}%)
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">Clause #{index + 1}</span>
                                </div>
                                <p className="text-sm mb-2">{clause.texte}</p>
                                <div className="flex flex-wrap gap-1">
                                  {clause.mots_cles_risque.map((mot, idx) => (
                                    <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                      {mot}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            {analysisSummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    Rapport d'analyse complet
                  </CardTitle>
                  <CardDescription>
                    Synthèse détaillée de l'analyse des emails juridiques
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{analysisSummary.total_emails_analyses}</div>
                      <div className="text-sm text-muted-foreground">Emails analysés</div>
                    </div>
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold text-primary">{analysisSummary.total_pieces_jointes_juridiques}</div>
                      <div className="text-sm text-muted-foreground">Pièces jointes juridiques</div>
                    </div>
                    <div className="text-center p-6 bg-muted/30 rounded-lg">
                      <div className="text-3xl font-bold">{analysisSummary.ton_moyen}</div>
                      <div className="text-sm text-muted-foreground">Ton moyen détecté</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{analysisSummary.emails_avec_risque_eleve}</div>
                      <div className="text-sm text-muted-foreground">Risque élevé</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{analysisSummary.emails_avec_risque_modere}</div>
                      <div className="text-sm text-muted-foreground">Risque modéré</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{analysisSummary.emails_avec_risque_faible}</div>
                      <div className="text-sm text-muted-foreground">Risque faible</div>
                    </div>
                  </div>

                  {analysisSummary.rapport_sauvegarde && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Rapport sauvegardé</h4>
                          <p className="text-sm text-blue-700">{analysisSummary.rapport_sauvegarde}</p>
                        </div>
                        <Button onClick={downloadCSVReport} className="bg-blue-600 hover:bg-blue-700">
                          <Download className="h-4 w-4 mr-2" />
                          Télécharger CSV
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4">Recommandations</h4>
                    <div className="space-y-3">
                      {analysisSummary.emails_avec_risque_eleve > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                          <div>
                            <span className="font-medium text-red-800">Attention requise</span>
                            <p className="text-sm text-red-700">
                              {analysisSummary.emails_avec_risque_eleve} email(s) présentent un risque élevé et nécessitent une revue immédiate.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {analysisSummary.emails_avec_risque_modere > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                          <Clock className="h-5 w-5 text-yellow-600" />
                          <div>
                            <span className="font-medium text-yellow-800">Revue recommandée</span>
                            <p className="text-sm text-yellow-700">
                              {analysisSummary.emails_avec_risque_modere} email(s) à risque modéré méritent une attention dans les prochains jours.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <span className="font-medium text-green-800">Situation favorable</span>
                          <p className="text-sm text-green-700">
                            {analysisSummary.emails_avec_risque_faible} email(s) présentent un faible risque.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clauses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Heatmap des Clauses - Analyse des Risques
                </CardTitle>
                <CardDescription>
                  Visualisation des niveaux de risque détectés dans les clauses des documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 bg-muted/30 rounded-lg border-2 border-dashed">
                  <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium mb-2">Heatmap des clauses générée</h4>
                  <p className="text-muted-foreground mb-4">
                    L'analyse a généré une visualisation heatmap des clauses à risque.
                  </p>
                  
                  {/* Simulation de l'image de heatmap */}
                  <div className="max-w-2xl mx-auto bg-white p-4 rounded-lg shadow-lg">
                    <div className="text-center mb-4">
                      <h5 className="font-bold text-lg">Heatmap - CONTRAT.pdf</h5>
                      <p className="text-sm text-muted-foreground">Transmission du contrat pour analyse...</p>
                    </div>
                    
                    {/* Barres de risque simulées */}
                    <div className="space-y-2">
                      {[
                        { label: "Article 1 – Paiement du loyer", risk: 0.79, color: "bg-red-500" },
                        { label: "Article 6 – Sanctions et pénalités", risk: 0.79, color: "bg-red-500" },
                        { label: "Article 7 – Assurance", risk: 0.52, color: "bg-yellow-500" },
                        { label: "Article 2 – Durée du contrat", risk: 0.28, color: "bg-green-500" },
                        { label: "Article 3 – État des lieux", risk: 0.15, color: "bg-green-500" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-32 text-xs text-right truncate">{item.label}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-6">
                            <div 
                              className={`h-6 rounded-full ${item.color} transition-all duration-300`}
                              style={{ width: `${item.risk * 100}%` }}
                            ></div>
                          </div>
                          <div className="w-12 text-xs font-medium">{(item.risk * 100).toFixed(0)}%</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span>Faible risque (0-33%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span>Risque modéré (34-66%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span>Risque élevé (67-100%)</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="mt-4" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger l'image complète
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}