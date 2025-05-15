"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useProject } from "@/lib/contexts/project-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

type Feature = {
  id: string
  name: string
  description: string
  enabled: boolean
}

const defaultFeatures: Feature[] = [
  {
    id: "jwt",
    name: "JWT Authentication",
    description: "Autenticación basada en tokens JWT",
    enabled: true,
  },
  {
    id: "crud",
    name: "CRUD Básico",
    description: "Operaciones CRUD para entidades",
    enabled: true,
  },
  {
    id: "swagger",
    name: "Swagger/OpenAPI",
    description: "Documentación API automática",
    enabled: false,
  },
  {
    id: "tests",
    name: "Tests Unitarios",
    description: "Framework de testing incluido",
    enabled: false,
  },
]

const languageFeatures: Record<string, Feature[]> = {
  javascript: [
    { id: "jwt", name: "JWT Authentication", description: "Autenticación basada en tokens JWT", enabled: false },
    { id: "crud", name: "CRUD Básico", description: "Operaciones CRUD para entidades", enabled: false },
    { id: "swagger", name: "Swagger/OpenAPI", description: "Documentación API automática", enabled: false },
    { id: "tests", name: "Tests Unitarios", description: "Framework de testing incluido", enabled: false },
    { id: "logger", name: "Logger", description: "Registro de logs de la aplicación", enabled: false },
  ],
  python: [
    { id: "jwt", name: "JWT Authentication", description: "Autenticación basada en tokens JWT", enabled: false },
    { id: "crud", name: "CRUD Básico", description: "Operaciones CRUD para entidades", enabled: false },
    { id: "swagger", name: "Swagger/OpenAPI", description: "Documentación API automática", enabled: false },
    { id: "tests", name: "Tests Unitarios", description: "Framework de testing incluido", enabled: false },
    { id: "celery", name: "Celery", description: "Tareas asíncronas con Celery", enabled: false },
  ],
  php: [
    { id: "jwt", name: "JWT Authentication", description: "Autenticación basada en tokens JWT", enabled: false },
    { id: "crud", name: "CRUD Básico", description: "Operaciones CRUD para entidades", enabled: false },
    { id: "swagger", name: "Swagger/OpenAPI", description: "Documentación API automática", enabled: false },
    { id: "tests", name: "Tests Unitarios", description: "Framework de testing incluido", enabled: false },
    { id: "queue", name: "Queue", description: "Colas de trabajo para tareas", enabled: false },
  ],
  java: [
    { id: "jwt", name: "JWT Authentication", description: "Autenticación basada en tokens JWT", enabled: false },
    { id: "crud", name: "CRUD Básico", description: "Operaciones CRUD para entidades", enabled: false },
    { id: "swagger", name: "Swagger/OpenAPI", description: "Documentación API automática", enabled: false },
    { id: "tests", name: "Tests Unitarios", description: "Framework de testing incluido", enabled: false },
    { id: "lombok", name: "Lombok", description: "Librería Lombok para Java", enabled: false },
  ],
  go: [
    { id: "jwt", name: "JWT Authentication", description: "Autenticación basada en tokens JWT", enabled: false },
    { id: "crud", name: "CRUD Básico", description: "Operaciones CRUD para entidades", enabled: false },
    { id: "swagger", name: "Swagger/OpenAPI", description: "Documentación API automática", enabled: false },
    { id: "tests", name: "Tests Unitarios", description: "Framework de testing incluido", enabled: false },
    { id: "gorilla", name: "Gorilla Toolkit", description: "Herramientas Gorilla para Go", enabled: false },
  ],
}

export default function FeatureSelector() {
  const { config, updateFeature, generateCode } = useProject()
  const [features, setFeatures] = useState<Feature[]>(
    defaultFeatures.map((feature) => ({
      ...feature,
      enabled: false, // Inicialmente todas desactivadas
    })),
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("")
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)

  // Actualizar el estado local cuando cambia la configuración
  useEffect(() => {
    if (config.features) {
      setFeatures((prevFeatures) =>
        prevFeatures.map((feature) => ({
          ...feature,
          enabled: config.features[feature.id] ?? false,
        })),
      )
    }
  }, [config.features])

  // Modificar la función toggleFeature para no generar código automáticamente
  const toggleFeature = (id: string) => {
    // Update the local state
    setFeatures(features.map((feature) => (feature.id === id ? { ...feature, enabled: !feature.enabled } : feature)))

    // Actualizar la configuración
    const newValue = !features.find((f) => f.id === id)?.enabled
    updateFeature(id, newValue)

    // Ya no generamos código automáticamente, solo marcamos que hay cambios sin guardar
  }

  const handleAddFeature = () => {
    setModalOpen(true)
    setSelectedLanguage("")
    setSelectedFeature(null)
  }

  const handleSelectLanguage = (lang: string) => {
    setSelectedLanguage(lang)
    setSelectedFeature(null)
  }

  const handleSelectFeature = (feature: Feature) => {
    setSelectedFeature(feature)
  }

  const handleConfirmAdd = () => {
    if (selectedFeature && !features.find(f => f.id === selectedFeature.id)) {
      setFeatures([...features, { ...selectedFeature, enabled: false }])
      updateFeature(selectedFeature.id, false)
    }
    setModalOpen(false)
    setSelectedLanguage("")
    setSelectedFeature(null)
  }

  // Eliminar característica
  const handleDeleteFeature = (id: string) => {
    setFeatures(features.filter(f => f.id !== id))
    updateFeature(id, false)
  }

  // Solo mostrar el selector de características si hay un backend seleccionado
  if (!config.backend_type) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400">
        Seleccione un lenguaje de backend primero para ver las características disponibles.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {features.map((feature) => (
        <motion.div
          key={feature.id}
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="flex-1">
            <Label htmlFor={`feature-${feature.id}`} className="text-sm font-medium cursor-pointer">
              {feature.name}
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id={`feature-${feature.id}`}
              checked={feature.enabled}
              onCheckedChange={() => toggleFeature(feature.id)}
            />
            <button
              className="ml-2 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
              title="Eliminar característica"
              onClick={() => handleDeleteFeature(feature.id)}
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </motion.div>
      ))}
      <div className="mt-4">
        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAddFeature}>
          Agregar nueva característica
        </Button>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar característica por lenguaje</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <Label className="mb-2 block">Selecciona un lenguaje</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(languageFeatures).map((lang) => (
                <Button
                  key={lang}
                  variant={selectedLanguage === lang ? "default" : "outline"}
                  onClick={() => handleSelectLanguage(lang)}
                >
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          {selectedLanguage && (
            <div className="mb-4">
              <Label className="mb-2 block">Selecciona una característica</Label>
              <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                {languageFeatures[selectedLanguage].map((feature) => (
                  <Button
                    key={feature.id}
                    variant={selectedFeature?.id === feature.id ? "default" : "outline"}
                    onClick={() => handleSelectFeature(feature)}
                    disabled={features.some(f => f.id === feature.id)}
                  >
                    {feature.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleConfirmAdd} disabled={!selectedFeature || features.some(f => f.id === selectedFeature.id)}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
