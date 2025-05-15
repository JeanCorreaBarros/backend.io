"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Edit, Trash2, MoreVertical, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProjectCardProps {
  id: number
  name: string
  description: string | null
  backendType?: string
  createdAt: string
  onDelete: (id: number) => void
}

export default function ProjectCard({ id, name, description, backendType, createdAt, onDelete }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este proyecto?")) {
      onDelete(id)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const getBackendColor = (type?: string) => {
    switch (type) {
      case "node":
        return "bg-green-500"
      case "python":
        return "bg-blue-500"
      case "php":
        return "bg-purple-500"
      case "java":
        return "bg-red-500"
      case "go":
        return "bg-blue-400"
      default:
        return "bg-gray-400"
    }
  }

  const getBackendIcon = (type?: string) => {
    switch (type) {
      case "node":
        return "JS"
      case "python":
        return "PY"
      case "php":
        return "PHP"
      case "java":
        return "JV"
      case "go":
        return "GO"
      default:
        return "?"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {backendType && (
              <div
                className={cn(
                  "h-8 w-8 rounded-lg text-white flex items-center justify-center mr-3",
                  getBackendColor(backendType),
                )}
              >
                <span className="text-xs font-bold">{getBackendIcon(backendType)}</span>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{name}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Creado el {formatDate(createdAt)}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Opciones del proyecto"
            >
              <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <Link
                  href={`/projects/${id}`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver proyecto
                </Link>
                <Link
                  href={`/projects/${id}/edit`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar proyecto
                </Link>
                <button
                  onClick={handleDelete}
                  className="flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg w-full text-left"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar proyecto
                </button>
              </div>
            )}
          </div>
        </div>

        {description && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{description}</p>}

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            href={`/projects/${id}`}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center"
          >
            Abrir proyecto
            <ExternalLink className="h-4 w-4 ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
