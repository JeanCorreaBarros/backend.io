"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/contexts/project-context"

type BackendOption = {
  id: string
  name: string
  icon: string
  color: string
}

const backendOptions: BackendOption[] = [
  { id: "node", name: "Node.js", icon: "JS", color: "bg-green-500" },
  { id: "python", name: "Python", icon: "PY", color: "bg-blue-500" },
  { id: "php", name: "PHP", icon: "PHP", color: "bg-purple-500" },
  { id: "java", name: "Java", icon: "JV", color: "bg-red-500" },
  { id: "go", name: "Go", icon: "GO", color: "bg-blue-400" },
]

const versionOptions: Record<string, string[]> = {
  node: ["v18.x (LTS)", "v20.x (Current)", "v16.x"],
  python: ["v3.11", "v3.10", "v3.9"],
  php: ["v8.2", "v8.1", "v8.0"],
  java: ["Java 17 (LTS)", "Java 21 (LTS)", "Java 11 (LTS)"],
  go: ["Go 1.21", "Go 1.20", "Go 1.19"],
}

export default function BackendSelector() {
  const { config, updateConfig, generateCode } = useProject()
  const [selectedBackend, setSelectedBackend] = useState<string>(config.backend_type || "")
  const [selectedVersion, setSelectedVersion] = useState<string>(config.backend_version || "")

  // Actualizar el estado local cuando cambia la configuración
  useEffect(() => {
    setSelectedBackend(config.backend_type || "")
    setSelectedVersion(config.backend_version || "")
  }, [config.backend_type, config.backend_version])

  // Modificar la función handleBackendChange para no generar código automáticamente
  const handleBackendChange = (backendId: string) => {
    // Immediately update the local state
    setSelectedBackend(backendId)

    // Seleccionar la primera versión disponible para este backend
    const firstVersion = versionOptions[backendId][0]
    setSelectedVersion(firstVersion)

    // Actualizar la base de datos predeterminada según el lenguaje
    let defaultDbType = "mongodb"
    let defaultDbConnectionString = "mongodb://localhost:27017/myapp"

    // Set appropriate default database type based on backend language
    if (backendId === "java") {
      defaultDbType = "h2"
      defaultDbConnectionString = "jdbc:h2:mem:testdb"
    } else if (backendId === "php" || backendId === "go") {
      defaultDbType = "mysql"
      defaultDbConnectionString = "mysql://user:password@localhost:3306/myapp"
    } else if (backendId === "python") {
      // Python soporta todas las bases de datos, mantener MongoDB como predeterminada
    }

    // Actualizar la configuración con todas las propiedades a la vez
    updateConfig({
      backend_type: backendId,
      backend_version: firstVersion,
      database_type: defaultDbType,
      database_connection_string: defaultDbConnectionString,
    })

    // Ya no generamos código automáticamente, solo marcamos que hay cambios sin guardar
  }

  // Modificar la función handleVersionChange para no generar código automáticamente
  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const version = e.target.value
    setSelectedVersion(version)

    // Actualizar la configuración
    updateConfig({
      backend_version: version,
    })

    // Ya no generamos código automáticamente, solo marcamos que hay cambios sin guardar
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {backendOptions.map((option) => (
          <motion.button
            key={option.id}
            className={cn(
              "relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
              selectedBackend === option.id
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleBackendChange(option.id)}
          >
            {selectedBackend === option.id && (
              <div className="absolute top-2 right-2 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <div className={cn("h-10 w-10 rounded-lg text-white flex items-center justify-center mb-2", option.color)}>
              <span className="text-xs font-bold">{option.icon}</span>
            </div>
            <span className="text-sm font-medium">{option.name}</span>
          </motion.button>
        ))}
      </div>

      {selectedBackend && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-2">Versión</h3>
          <select
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
            value={selectedVersion}
            onChange={handleVersionChange}
          >
            {versionOptions[selectedBackend]?.map((version) => (
              <option key={version} value={version}>
                {selectedBackend === "node"
                  ? "Node.js "
                  : selectedBackend === "python"
                    ? "Python "
                    : selectedBackend === "php"
                      ? "PHP "
                      : selectedBackend === "java"
                        ? ""
                        : ""}
                {version}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
