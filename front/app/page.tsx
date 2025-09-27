"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, FileText, Search, Zap, Shield, Users, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [isVisible, setIsVisible] = useState(false)
  const featuresRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleAuth = async (type: "login" | "register") => {
    setIsLoading(true)
    // Mock authentication - simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard
      window.location.href = "/dashboard"
    }, 1500)
  }

  // Animation variants avec typage correct
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  const featureVariants = {
    hidden: { scale: 0.9, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background overflow-hidden">
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Scale className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">AIvocate</span>
            </motion.div>
           
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <motion.div 
            className="space-y-8"
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={containerVariants}
          >
            <motion.div className="space-y-4" variants={itemVariants}>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                L’IA au service du droit
                <motion.span 
                  className="text-primary block"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Intelligence
                </motion.span>
              </h1>
              <motion.p 
                className="text-xl text-muted-foreground text-pretty leading-relaxed"
                variants={itemVariants}
              >
                Libérez votre temps et gagnez en précision : analyse intelligente des contrats, analyse des emails juridiques et recommandations juridiques basées sur l’IA. Pour les esprits juridiques modernes.
              </motion.p>
            </motion.div>

            {/* Features grid */}
            <motion.div 
              ref={featuresRef}
              className="grid grid-cols-2 gap-4"
              variants={containerVariants}
            >
              <motion.div 
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-md transition-shadow cursor-pointer"
                variants={featureVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Analyse de Contrats</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-md transition-shadow cursor-pointer"
                variants={featureVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Search className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Recherche Juridique</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-md transition-shadow cursor-pointer"
                variants={featureVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Analyse des emails</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 p-4 rounded-lg bg-card border hover:shadow-md transition-shadow cursor-pointer"
                variants={featureVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Évaluation des Risques</span>
              </motion.div>
            </motion.div>

            {/* Trust indicators */}
            
          </motion.div>

          {/* Right side - Auth form */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <Card className="w-full max-w-md shadow-xl border-0">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl">Bienvenue sur AIvocate</CardTitle>
                <CardDescription>Connectez-vous à votre compte ou créez-en un nouveau pour commencer</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Se connecter</TabsTrigger>
                    <TabsTrigger value="register">S’inscrire</TabsTrigger>
                  </TabsList>

                  <AnimatePresence mode="wait">
                    {activeTab === "login" && (
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TabsContent value="login" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input 
                              id="email" 
                              type="email" 
                              placeholder="Entrez votre email" 
                              defaultValue="demo@aivocate.com" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input 
                              id="password" 
                              type="password" 
                              placeholder="Entrez votre mot de passe" 
                              defaultValue="demo123" 
                            />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => handleAuth("login")} 
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connexion...
                              </>
                            ) : "Se connecter"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                          </p>
                        </TabsContent>
                      </motion.div>
                    )}

                    {activeTab === "register" && (
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <TabsContent value="register" className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nom Complet</Label>
                            <Input id="name" type="text" placeholder="Entrez votre nom" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email-register">Email</Label>
                            <Input id="email-register" type="email" placeholder="Entrez votre email" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password-register">Mot de passe</Label>
                            <Input id="password-register" type="password" placeholder="creez votre compte" />
                          </div>
                          <Button 
                            className="w-full" 
                            onClick={() => handleAuth("register")} 
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creation du compte...
                              </>
                            ) : "Creer un compte"}
                          </Button>
                          <p className="text-xs text-center text-muted-foreground">
                          </p>
                        </TabsContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}