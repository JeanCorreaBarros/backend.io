"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/contexts/project-context"

type DatabaseOption = {
  id: string
  name: string
  icon: string
  color: string
}

const databaseOptions: DatabaseOption[] = [
  { id: "mongodb", name: "MongoDB", icon: "MDB", color: "bg-green-600" },
  { id: "mysql", name: "MySQL", icon: "SQL", color: "bg-blue-600" },
  { id: "postgres", name: "PostgreSQL", icon: "PG", color: "bg-blue-700" },
  { id: "sqlite", name: "SQLite", icon: "SL", color: "bg-blue-500" },
  { id: "h2", name: "H2 (Java)", icon: "H2", color: "bg-gray-600" },
]

export default function DatabaseSelector() {
  const { config, updateConfig, generateCode } = useProject()
  const [selectedDatabase, setSelectedDatabase] = useState<string>(config.database_type || "")
  const [connectionString, setConnectionString] = useState<string>(config.database_connection_string || "")

  // Actualizar el estado local cuando cambia la configuración
  useEffect(() => {
    setSelectedDatabase(config.database_type || "")
    setConnectionString(config.database_connection_string || "")
  }, [config.database_type, config.database_connection_string])

  useEffect(() => {
    // Hide or show database options based on the selected backend type
    const backendType = config.backend_type || ""

    // Si no hay backend seleccionado, no hacemos nada
    if (!backendType) return

    // Get all database option elements
    const dbOptions = document.querySelectorAll("[data-database-option]")

    dbOptions.forEach((option) => {
      const dbType = option.getAttribute("data-database-id")

      // Show/hide based on compatibility
      if (backendType === "java" && dbType === "h2") {
        // Show H2 only for Java
        option.classList.remove("hidden")
      } else if (backendType === "java" && dbType === "mongodb") {
        // Hide MongoDB for Java
        option.classList.add("hidden")
      } else if (dbType === "h2" && backendType !== "java") {
        // Hide H2 for non-Java backends
        option.classList.add("hidden")
      } else {
        // Show all other combinations
        option.classList.remove("hidden")
      }
    })
  }, [config.backend_type])

  // Modify the handleDatabaseChange function for immediate updates
  const handleDatabaseChange = (dbId: string) => {
    setSelectedDatabase(dbId)

    // Establecer una cadena de conexión predeterminada según el tipo de base de datos
    let defaultConnectionString = ""
    switch (dbId) {
      case "mongodb":
        defaultConnectionString = "mongodb://localhost:27017/myapp"
        break
      case "mysql":
        defaultConnectionString = "mysql://user:password@localhost:3306/myapp"
        break
      case "postgres":
        defaultConnectionString = "postgresql://user:password@localhost:5432/myapp"
        break
      case "sqlite":
        defaultConnectionString = "file:./database.sqlite"
        break
      case "h2":
        defaultConnectionString = "jdbc:h2:mem:testdb"
        break
    }

    setConnectionString(defaultConnectionString)

    // Actualizar la configuración
    updateConfig({
      database_type: dbId,
      database_connection_string: defaultConnectionString,
    })

    // Ya no generamos código automáticamente, solo marcamos que hay cambios sin guardar
  }

  const handleConnectionStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConnectionString(value)

    // Actualizar la configuración
    updateConfig({
      database_connection_string: value,
    })
  }

  const handleConnectionStringBlur = () => {
    // Ya no generamos código automáticamente, solo marcamos que hay cambios sin guardar
    // Los cambios ya se han guardado en updateConfig cuando se modificó el valor
  }

  // Solo mostrar el selector de base de datos si hay un backend seleccionado
  if (!config.backend_type) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-500 dark:text-gray-400">
        Seleccione un lenguaje de backend primero para configurar la base de datos.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {databaseOptions.map((option) => (
          <motion.button
            key={option.id}
            data-database-option
            data-database-id={option.id}
            className={cn(
              "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all",
              selectedDatabase === option.id
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800",
              // Hide H2 by default (only show for Java)
              option.id === "h2" ? "hidden" : "",
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleDatabaseChange(option.id)}
          >
            {selectedDatabase === option.id && (
              <div className="absolute top-2 right-2 h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
            <div className={cn("h-8 w-8 rounded-lg text-white flex items-center justify-center mb-2", option.color)}>
              <span className="text-xs font-bold">{option.icon}</span>
            </div>
            <span className="text-sm font-medium">{option.name}</span>
          </motion.button>
        ))}
      </div>

      {selectedDatabase && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium mb-2 text-sm">Configuración de conexión</h3>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">URL de conexión</label>
              <input
                type="text"
                placeholder={
                  selectedDatabase === "mongodb"
                    ? "mongodb://localhost:27017/myapp"
                    : selectedDatabase === "mysql"
                      ? "mysql://user:password@localhost:3306/myapp"
                      : selectedDatabase === "postgres"
                        ? "postgresql://user:password@localhost:5432/myapp"
                        : selectedDatabase === "sqlite"
                          ? "file:./database.sqlite"
                          : selectedDatabase === "h2"
                            ? "jdbc:h2:mem:testdb"
                            : "Ingrese la URL de conexión"
                }
                value={connectionString}
                onChange={handleConnectionStringChange}
                onBlur={handleConnectionStringBlur}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Esta es una URL de conexión de prueba. Reemplácela con su URL real cuando implemente el proyecto.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
