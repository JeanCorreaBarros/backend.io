"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Code, Database, Settings, SlidersHorizontal, Trash2 } from "lucide-react"
import DashboardHeader from "@/components/dashboard-header"
import BackendSelector from "@/components/backend-selector"
import FeatureSelector from "@/components/feature-selector"
import ProjectStructure from "@/components/project-structure"
import CodePreview from "@/components/code-preview"
import DatabaseSelector from "@/components/database-selector"
import ProjectActions from "@/components/project-actions"
import { ProjectProvider, useProject } from "@/lib/contexts/project-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id)
  const [activeTab, setActiveTab] = useState("backend")
  // Estado para características personalizadas
  const [customFeatures, setCustomFeatures] = useState<any[]>([])
  const [featureModalOpen, setFeatureModalOpen] = useState(false)
  const [newFeature, setNewFeature] = useState({
    name: "",
    language: "",
    ai: "chatgpt",
    prompt: ""
  })

  const aiOptions = [
    { value: "chatgpt", label: "ChatGPT" },
    { value: "gemini", label: "Gemini" },
    { value: "claude", label: "Claude" },
  ]
  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "php", label: "PHP" },
    { value: "java", label: "Java" },
    { value: "go", label: "Go" },
  ]

  const handleOpenFeatureModal = () => {
    setFeatureModalOpen(true)
    setNewFeature({ name: "", language: "", ai: "chatgpt", prompt: "" })
  }
  const handleSaveFeature = () => {
    setCustomFeatures([...customFeatures, { ...newFeature, id: Date.now() }])
    setFeatureModalOpen(false)
  }

  if (isNaN(projectId)) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <p>ID de proyecto inválido</p>
            <Link
              href="/dashboard"
              className="mt-2 text-sm font-medium underline hover:text-red-700 dark:hover:text-red-300 inline-block"
            >
              Volver al dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProjectProvider projectId={projectId}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <DashboardHeader />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver al dashboard
            </Link>

            <ProjectHeader />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex overflow-x-auto">
                <button
                  onClick={() => setActiveTab("backend")}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "backend"
                      ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Code className="h-4 w-4 inline-block mr-2" />
                  Backend
                </button>
                <button
                  onClick={() => setActiveTab("database")}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "database"
                      ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Database className="h-4 w-4 inline-block mr-2" />
                  Base de Datos
                </button>
                <button
                  onClick={() => setActiveTab("features")}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "features"
                      ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4 inline-block mr-2 text-blue-500" />
                  Características
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "settings"
                      ? "border-b-2 border-orange-500 text-orange-600 dark:text-orange-400"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <Settings className="h-4 w-4 inline-block mr-2 text-orange-500" />
                  Configuración
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "backend" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Configuración del Backend</h2>
                    <BackendSelector />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold mb-4">Características</h2>
                    <FeatureSelector />
                  </div>
                </div>
              )}

              {activeTab === "database" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Base de Datos</h2>
                  <DatabaseSelector />
                </div>
              )}

              {activeTab === "features" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Características Personalizadas</h2>
                  <div className="mb-4 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleOpenFeatureModal}>
                      Crear nueva característica
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-100 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">ID</th>
                          <th className="px-4 py-2 text-left">Nombre</th>
                          <th className="px-4 py-2 text-left">Lenguaje</th>
                          <th className="px-4 py-2 text-left">IA</th>
                          <th className="px-4 py-2 text-left">Prompt</th>
                          <th className="px-4 py-2 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customFeatures.length === 0 && (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-gray-400">No hay características creadas.</td>
                          </tr>
                        )}
                        {customFeatures.map((f) => (
                          <tr key={f.id} className="border-t border-gray-200 dark:border-gray-700">
                            <td className="px-4 py-2">{f.id}</td>
                            <td className="px-4 py-2">{f.name}</td>
                            <td className="px-4 py-2">{f.language}</td>
                            <td className="px-4 py-2">{aiOptions.find(a => a.value === f.ai)?.label}</td>
                            <td className="px-4 py-2 max-w-xs truncate" title={f.prompt}>{f.prompt}</td>
                            <td className="px-4 py-2">
                              <button
                                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900"
                                title="Eliminar característica"
                                onClick={() => setCustomFeatures(customFeatures.filter(cf => cf.id !== f.id))}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Dialog open={featureModalOpen} onOpenChange={setFeatureModalOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear nueva característica</DialogTitle>
                      </DialogHeader>
                      <div className="mb-4">
                        <label className="block mb-1 font-medium">Nombre</label>
                        <input
                          className="w-full border rounded px-3 py-2 mb-2 dark:bg-gray-800 dark:text-white"
                          value={newFeature.name}
                          onChange={e => setNewFeature({ ...newFeature, name: e.target.value })}
                        />
                        <label className="block mb-1 font-medium">Lenguaje asociado</label>
                        <select
                          className="w-full border rounded px-3 py-2 mb-2 dark:bg-gray-800 dark:text-white"
                          value={newFeature.language}
                          onChange={e => setNewFeature({ ...newFeature, language: e.target.value })}
                        >
                          <option value="">Selecciona un lenguaje</option>
                          {languageOptions.map(l => (
                            <option key={l.value} value={l.value}>{l.label}</option>
                          ))}
                        </select>
                        <label className="block mb-1 font-medium">Tipo de IA</label>
                        <select
                          className="w-full border rounded px-3 py-2 mb-2 dark:bg-gray-800 dark:text-white"
                          value={newFeature.ai}
                          onChange={e => setNewFeature({ ...newFeature, ai: e.target.value })}
                        >
                          {aiOptions.map(a => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                        <label className="block mb-1 font-medium">Prompt</label>
                        <textarea
                          className="w-full border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
                          rows={4}
                          value={newFeature.prompt}
                          onChange={e => setNewFeature({ ...newFeature, prompt: e.target.value })}
                        />
                      </div>
                      <DialogFooter>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSaveFeature}>
                          Guardar característica
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Configuración del Proyecto</h2>
                  <ProjectSettings />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Estructura del Proyecto</h2>
              <ProjectStructure />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Vista Previa del Código</h2>
              <CodePreview />
            </div>
          </div>
        </main>
      </div>
    </ProjectProvider>
  )
}

function ProjectHeader() {
  const { projectName, projectDescription, isLoading } = useProject()

  return (
    <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold">{isLoading ? "Cargando..." : projectName}</h1>
        {projectDescription && <p className="text-gray-500 dark:text-gray-400 mt-1">{projectDescription}</p>}
      </div>

      <div className="mt-4 md:mt-0">
        <ProjectActions />
      </div>
    </div>
  )
}

function ProjectSettings() {
  const { projectName, projectDescription, updateConfig, saveConfig } = useProject()
  const [name, setName] = useState(projectName)
  const [description, setDescription] = useState(projectDescription || "")

  // Actualizar el estado local cuando cambian los datos del proyecto
  useEffect(() => {
    setName(projectName)
    setDescription(projectDescription || "")
  }, [projectName, projectDescription])

  const handleSave = async () => {
    // Aquí iría la lógica para actualizar el nombre y descripción del proyecto
    // Por ahora, solo guardamos la configuración
    await saveConfig({ name, description })
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium mb-2">
          Nombre del Proyecto
        </label>
        <input
          id="project-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="project-description" className="block text-sm font-medium mb-2">
          Descripción
        </label>
        <textarea
          id="project-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
          rows={3}
        />
      </div>

      <div className="pt-4">
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg" onClick={handleSave}>
          Guardar Cambios
        </button>
      </div>
    </div>
  )
}
