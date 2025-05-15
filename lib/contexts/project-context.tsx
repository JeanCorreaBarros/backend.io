"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { projectService, configService, fileService } from "@/lib/local-storage-service"
import { generateNodeJSCode } from "@/lib/code-generators/node-generator"

// Añadir estos estados al ProjectContextType
interface ProjectContextType {
  projectId: number | null
  projectName: string
  projectDescription: string | null
  config: ProjectConfig
  files: Record<string, string>
  selectedFile: string
  isLoading: boolean
  error: string | null
  hasUnsavedChanges: boolean // Nuevo estado para cambios sin guardar
  isCodeGenerated: boolean // Nuevo estado para código generado
  updateConfig: (newConfig: Partial<ProjectConfig>) => void
  updateFeature: (featureId: string, enabled: boolean) => void
  saveConfig: (data?: { name?: string; description?: string }) => Promise<void>
  generateCode: () => Promise<void>
  exportProject: () => Promise<void>
  setSelectedFile: (filePath: string) => void
  setFiles: React.Dispatch<React.SetStateAction<Record<string, string>>> // <-- Añadir esto
}

interface ProjectConfig {
  backend_type: string
  backend_version: string
  database_type: string | null
  database_connection_string: string | null
  features: Record<string, boolean>
}

// Modificar el defaultConfig para que no tenga selecciones predeterminadas
const defaultConfig: ProjectConfig = {
  backend_type: "", // Vacío en lugar de "node"
  backend_version: "",
  database_type: null,
  database_connection_string: null,
  features: {
    jwt: false, // Todas las características desactivadas por defecto
    crud: false,
    swagger: false,
    tests: false,
  },
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Añadir estos estados al componente ProjectProvider
export function ProjectProvider({ children, projectId }: { children: React.ReactNode; projectId: number }) {
  const router = useRouter()
  const [projectName, setProjectName] = useState<string>("")
  const [projectDescription, setProjectDescription] = useState<string | null>(null)
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig)
  const [files, setFiles] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false) // Nuevo estado
  const [isCodeGenerated, setIsCodeGenerated] = useState<boolean>(false) // Nuevo estado

  // Cargar datos del proyecto
  useEffect(() => {
    const loadProjectData = () => {
      setIsLoading(true)
      setError(null)

      try {
        // Obtener datos del proyecto
        const project = projectService.getProjectById(projectId)

        if (!project) {
          throw new Error("Proyecto no encontrado")
        }

        setProjectName(project.name)
        setProjectDescription(project.description)

        // Obtener configuración del proyecto
        const projectConfig = configService.getConfigByProjectId(projectId)

        if (projectConfig) {
          setConfig({
            backend_type: projectConfig.backend_type,
            backend_version: projectConfig.backend_version,
            database_type: projectConfig.database_type,
            database_connection_string: projectConfig.database_connection_string,
            features: projectConfig.features,
          })
        }

        // Obtener archivos del proyecto
        const projectFiles = fileService.getFilesByProjectId(projectId)
        const filesMap: Record<string, string> = {}

        projectFiles.forEach((file) => {
          filesMap[file.file_path] = file.file_content
        })

        setFiles(filesMap)

        if (Object.keys(filesMap).length > 0) {
          setSelectedFile(Object.keys(filesMap)[0])
        }
      } catch (error: any) {
        setError(error.message)
        console.error("Error loading project data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

  // Modificar updateConfig para marcar cambios sin guardar
  const updateConfig = (newConfig: Partial<ProjectConfig>) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...newConfig,
    }))
    setHasUnsavedChanges(true) // Marcar que hay cambios sin guardar
    setIsCodeGenerated(false) // Resetear el estado de código generado
  }

  // Modificar updateFeature para marcar cambios sin guardar
  const updateFeature = (featureId: string, enabled: boolean) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      features: {
        ...prevConfig.features,
        [featureId]: enabled,
      },
    }))
    setHasUnsavedChanges(true) // Marcar que hay cambios sin guardar
    setIsCodeGenerated(false) // Resetear el estado de código generado
  }

  // Modificar saveConfig para marcar que no hay cambios sin guardar
  const saveConfig = async (data?: { name?: string; description?: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      // Actualizar el proyecto si se proporcionan datos
      if (data) {
        const updatedProject = projectService.updateProject(projectId, {
          name: data.name || projectName,
          description: data.description || projectDescription,
        })

        if (updatedProject) {
          setProjectName(updatedProject.name)
          setProjectDescription(updatedProject.description)
        }
      }

      // Guardar la configuración
      configService.createOrUpdateConfig(projectId, config)

      // Marcar que no hay cambios sin guardar
      setHasUnsavedChanges(false)

      return
    } catch (error: any) {
      setError(error.message)
      console.error("Error saving config:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Modificar generateCode para marcar que el código ha sido generado
  const generateCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Primero guardamos la configuración
      await saveConfig()

      // Si no hay backend seleccionado, no generamos código
      if (!config.backend_type) {
        setFiles({})
        setSelectedFile("")
        setIsLoading(false)
        return
      }

      // Generar código según el tipo de backend
      let generatedFiles: Record<string, string> = {}

      // Ensure we have valid database settings
      const dbType = config.database_type || "mongodb"
      const dbConnStr = config.database_connection_string || getDefaultConnectionString(dbType)

      switch (config.backend_type) {
        case "node":
          generatedFiles = generateNodeJSCode({
            version: config.backend_version || "v18.x",
            features: config.features as any,
            database: {
              type: dbType as any,
              connectionString: dbConnStr,
            },
          })
          break
        case "python":
          try {
            const { generatePythonCode } = await import("../code-generators/python-generator")
            generatedFiles = generatePythonCode({
              version: config.backend_version.replace("v", "") || "3.11",
              features: config.features as any,
              database: {
                type: dbType as any,
                connectionString: dbConnStr,
              },
            })
          } catch (error) {
            console.error("Error loading Python generator:", error)
            throw new Error("Error al cargar el generador de Python")
          }
          break
        case "php":
          try {
            const { generatePHPCode } = await import("../code-generators/php-generator")
            generatedFiles = generatePHPCode({
              version: config.backend_version.replace("v", "") || "8.2",
              features: config.features as any,
              database: {
                type: dbType as any,
                connectionString: dbConnStr,
              },
            })
          } catch (error) {
            console.error("Error loading PHP generator:", error)
            throw new Error("Error al cargar el generador de PHP")
          }
          break
        case "java":
          try {
            const { generateJavaCode } = await import("../code-generators/java-generator")
            generatedFiles = generateJavaCode({
              version: config.backend_version || "Java 17 (LTS)",
              features: config.features as any,
              database: {
                type: dbType as any,
                connectionString: dbConnStr,
              },
            })
          } catch (error) {
            console.error("Error loading Java generator:", error)
            throw new Error("Error al cargar el generador de Java")
          }
          break
        case "go":
          try {
            const { generateGoCode } = await import("../code-generators/go-generator")
            generatedFiles = generateGoCode({
              version: config.backend_version.replace("Go ", "") || "1.21",
              features: config.features as any,
              database: {
                type: dbType as any,
                connectionString: dbConnStr,
              },
            })
          } catch (error) {
            console.error("Error loading Go generator:", error)
            throw new Error("Error al cargar el generador de Go")
          }
          break
        default:
          throw new Error(`Tipo de backend no soportado: ${config.backend_type}`)
      }

      // Eliminar archivos existentes
      fileService.deleteFilesByProjectId(projectId)

      // Guardar los archivos generados
      const newFiles: Record<string, string> = {}

      for (const [filePath, fileContent] of Object.entries(generatedFiles)) {
        fileService.createFile(projectId, filePath, fileContent)
        newFiles[filePath] = fileContent
      }

      setFiles(newFiles)

      if (Object.keys(newFiles).length > 0) {
        setSelectedFile(Object.keys(newFiles)[0])
      }

      // Marcar que el código ha sido generado
      setIsCodeGenerated(true)

      return
    } catch (error: any) {
      setError(error.message)
      console.error("Error generating code:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Add a helper function to get default connection strings
  const getDefaultConnectionString = (dbType: string): string => {
    switch (dbType) {
      case "mongodb":
        return "mongodb://localhost:27017/myapp"
      case "mysql":
        return "mysql://user:password@localhost:3306/myapp"
      case "postgres":
        return "postgresql://user:password@localhost:5432/myapp"
      case "sqlite":
        return "file:./database.sqlite"
      case "h2":
        return "jdbc:h2:mem:testdb"
      default:
        return "mongodb://localhost:27017/myapp"
    }
  }

  // Exportar proyecto
  const exportProject = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Primero generamos el código para asegurarnos de que esté actualizado
      await generateCode()

      // Crear un archivo ZIP con JSZip
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      // Añadir los archivos al ZIP
      Object.entries(files).forEach(([filePath, content]) => {
        // Crear carpetas si es necesario
        const pathParts = filePath.split("/")
        const fileName = pathParts.pop() || filePath
        let folder = zip

        if (pathParts.length > 0) {
          for (const part of pathParts) {
            folder = folder.folder(part)
          }
        }

        folder.file(fileName, content)
      })

      // Generar el archivo ZIP
      const zipContent = await zip.generateAsync({ type: "blob" })

      // Crear un enlace de descarga
      const url = URL.createObjectURL(zipContent)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectName.replace(/\s+/g, "-")}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return
    } catch (error: any) {
      setError(error.message)
      console.error("Error exporting project:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Incluir los nuevos estados en el valor del contexto
  const value = {
    projectId,
    projectName,
    projectDescription,
    config,
    files,
    selectedFile,
    isLoading,
    error,
    hasUnsavedChanges,
    isCodeGenerated,
    updateConfig,
    updateFeature,
    saveConfig,
    generateCode,
    exportProject,
    setSelectedFile,
    setFiles, // <-- Exponer setFiles en el contexto
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}