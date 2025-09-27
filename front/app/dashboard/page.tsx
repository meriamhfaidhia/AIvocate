"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scale,
  FileText,
  Upload,
  Search,
  PlusCircle,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Mail,
} from "lucide-react"

// Ajout des styles CSS dans une balise style normale
const styles = `
@keyframes growWidth {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.animate-in {
  animation-fill-mode: both;
}

.fade-in-0 {
  opacity: 0;
}

.slide-in-from-top-5 {
  transform: translateY(-20px);
}

.slide-in-from-bottom-5 {
  transform: translateY(20px);
}

.slide-in-from-left-5 {
  transform: translateX(-20px);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-slide-in-left {
  animation: slideInLeft 0.6s ease-out forwards;
}

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-300 {
  animation-delay: 0.3s;
}

/* Nouvelle classe pour centrer les actions principales */
.main-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  justify-content: center;
  max-width: 1000px;
  margin-left: auto;
  margin-right: auto;
}
`

export default function Dashboard() {
  const [user] = useState({ name: "Meriam", email: "meriam@gmail.com" })
  const [isHovered, setIsHovered] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const recentDocuments = [
    { id: 1, name: "Service Agreement ", status: "analyzed", risk: "medium", date: "2024-01-15" },
    { id: 2, name: "Employment Contract ", status: "processing", risk: "low", date: "2024-01-14" },
    { id: 3, name: "NDA ", status: "completed", risk: "high", date: "2024-01-13" },
  ]

  const stats = [
    { label: "Documents analysés", value: "127", change: "+12%", icon: FileText },
    { label: "Score de risque moyen", value: "68/100", change: "-5%", icon: AlertTriangle },
    { label: "Temps gagné", value: "45h", change: "+23%", icon: Clock },
    { label: "Projets actifs", value: "8", change: "+2", icon: BarChart3 },
  ]

  const mainActions = [
    { 
      title: "Téléverser un document", 
      description: "Analyser des contrats et documents juridiques", 
      icon: Upload, 
      href: "/upload" 
    },
    { 
      title: "Recherche juridique", 
      description: "Rechercher des précédents et affaires juridiques", 
      icon: Search, 
      href: "/search" 
    },
    { 
      title: "Analyse Emails", 
      description: "Analyse des Emails Juridiques", 
      icon: Mail,  // Changé de PlusCircle à Mail pour plus de cohérence
      href: "/generate" 
    },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <style>{styles}</style>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Injection des styles CSS */}
      <style>{styles}</style>
      
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md transition-all duration-300">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Scale className="h-8 w-8 text-primary" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AIvocate
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="group relative overflow-hidden">
                <User className="h-4 w-4 mr-2" />
                {user.name}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8 animate-fade-in-up text-center lg:text-left">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
           Bienvenue de retour,{user.name}
          </h1>
          <p className="text-muted-foreground text-lg">Actualité de vos documents juridiques aujourd’hui.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            const delayClass = `delay-${index * 100}`
            
            return (
              <Card 
                key={index} 
                className={`relative overflow-hidden group hover:shadow-xl transition-all duration-500 hover:scale-105 animate-fade-in-up ${delayClass}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-medium">{stat.label}</CardDescription>
                    <IconComponent className="h-5 w-5 text-primary opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{stat.value}</span>
                    <Badge 
                      variant={stat.change.startsWith("+") ? "default" : "secondary"} 
                      className="transition-transform duration-300"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mt-3 w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ 
                        width: stat.change.startsWith("+") ? '75%' : '60%',
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Main actions - CENTRÉES ET AMÉLIORÉES */}
        <div className="flex justify-center mb-12">
          <div className="main-actions-grid gap-6 w-full">
            {mainActions.map((action, index) => {
              const delayClass = `delay-${index * 150}`
              
              return (
                <Card
                  key={index}
                  className={`cursor-pointer group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl animate-fade-in-up ${delayClass} h-full flex flex-col`}
                  onClick={() => (window.location.href = action.href)}
                  onMouseEnter={() => setIsHovered(action.title)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="text-center relative z-10 flex-1 flex flex-col justify-center">
                    <div className="relative inline-block mx-auto">
                      <action.icon className="h-16 w-16 text-primary mx-auto mb-4 transition-all duration-500 group-hover:scale-110" />
                      <div className="absolute -inset-2 bg-primary/10 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500" />
                    </div>
                    <CardTitle className="text-xl mb-2 transition-transform duration-300">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-base transition-all duration-300">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <div className="p-4 pt-0 mt-auto">
                    <div className="flex justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                      <Button className="gap-2">
                        Commencer
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

      
      </div>
    </div>
  )
}