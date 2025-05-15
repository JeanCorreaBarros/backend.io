"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Plus, Loader2 } from "lucide-react"
import ProjectCard from "@/components/dashboard/project-card"
import CreateProjectModal from "@/components/dashboard/create-project-modal"
import DashboardHeader from "@/components/dashboard-header"
import { projectService, type Project } from "@/lib/local-storage-service"

export default function DashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadProjects = () => {
    setIsLoading(true)
    setError("")

    try {
      const userProjects = projectService.getProjects()
      setProjects(userProjects)
    } catch (error: any) {
      console.error("Error loading projects:", error)
      setError(error.message || "Error al cargar los proyectos")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDeleteProject = (id: number) => {
    try {
      const success = projectService.deleteProject(id)

      if (success) {
        // Actualizar la lista de proyectos
        setProjects((prevProjects) => prevProjects.filter((project) => project.id !== id))
      } else {
        throw new Error("No se pudo eliminar el proyecto")
      }
    } catch (error: any) {
      console.error("Error deleting project:", error)
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Mis Proyectos</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gestiona tus proyectos de generación de backends</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Proyecto
          </motion.button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            <p>{error}</p>
            <button
              onClick={loadProjects}
              className="mt-2 text-sm font-medium underline hover:text-red-700 dark:hover:text-red-300"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <h3 className="text-lg font-medium mb-2">No tienes proyectos aún</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Crea tu primer proyecto para comenzar a generar backends
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Proyecto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                createdAt={project.created_at}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={loadProjects} />
    </div>
  )
}
