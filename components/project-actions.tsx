"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Save, Loader2, Code, Download, Check, Eye, X, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/contexts/project-context"

export default function ProjectActions() {
  const {
    saveConfig,
    generateCode,
    exportProject,
    isLoading,
    error: projectError,
    hasUnsavedChanges,
    isCodeGenerated,
    config,
    files,
    projectName,
    selectedFile,
    setSelectedFile,
  } = useProject()

  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  const [isExported, setIsExported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showExportPreview, setShowExportPreview] = useState(false)
  const [previewTab, setPreviewTab] = useState<"summary" | "code">("summary")
  const [previewFile, setPreviewFile] = useState<string>("")

  // Verificar si hay un backend seleccionado
  const hasBackendSelected = !!config.backend_type

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await saveConfig()
      // Mostrar mensaje de éxito
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateCode = async () => {
    setIsGenerating(true)
    setIsGenerated(false)
    setError(null)

    try {
      await generateCode()
      setIsGenerated(true)
      setTimeout(() => {
        setIsGenerated(false)
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    setIsExported(false)
    setError(null)

    try {
      await exportProject()
      setIsExported(true)
      setTimeout(() => {
        setIsExported(false)
      }, 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const toggleExportPreview = () => {
    if (!showExportPreview && Object.keys(files).length > 0) {
      setPreviewFile(Object.keys(files)[0])
    }
    setShowExportPreview(!showExportPreview)
  }

  // Función para obtener el lenguaje del archivo para resaltado de sintaxis
  const getLanguageFromFilePath = (filePath: string): string => {
    const extension = filePath.split(".").pop()?.toLowerCase() || ""
    const fileName = filePath.split("/").pop()?.toLowerCase() || ""

    if (
      fileName.includes("database") ||
      fileName.includes("db.") ||
      fileName.includes("connection") ||
      fileName === ".env"
    ) {
      if (extension === "js" || extension === "ts") {
        return "javascript"
      } else if (extension === "py") {
        return "python"
      } else if (extension === "php") {
        return "php"
      } else if (extension === "java") {
        return "java"
      } else if (extension === "go") {
        return "go"
      } else if (extension === "env" || fileName === ".env") {
        return "bash"
      }
    }

    switch (extension) {
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return "javascript"
      case "py":
        return "python"
      case "php":
        return "php"
      case "java":
        return "java"
      case "go":
        return "go"
      case "json":
        return "json"
      case "xml":
        return "xml"
      case "md":
        return "markdown"
      case "sql":
        return "sql"
      case "html":
        return "html"
      case "css":
        return "css"
      case "env":
        return "bash"
      default:
        return "plaintext"
    }
  }

  // Generar una vista previa de los archivos que se exportarán
  const renderExportPreview = () => {
    const fileCount = Object.keys(files).length
    const folderCount = new Set(
      Object.keys(files)
        .map((path) => path.split("/")[0])
        .filter((folder) => folder !== ""),
    ).size

    return (
      <AnimatePresence>
        {showExportPreview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Vista Previa de Exportación</h2>
                <button
                  onClick={toggleExportPreview}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex">
                  <button
                    className={cn(
                      "px-4 py-2 font-medium text-sm",
                      previewTab === "summary"
                        ? "border-b-2 border-orange-500 text-orange-600"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                    )}
                    onClick={() => setPreviewTab("summary")}
                  >
                    Resumen
                  </button>
                  <button
                    className={cn(
                      "px-4 py-2 font-medium text-sm",
                      previewTab === "code"
                        ? "border-b-2 border-orange-500 text-orange-600"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200",
                    )}
                    onClick={() => setPreviewTab("code")}
                  >
                    Código
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                {previewTab === "summary" ? (
                  <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Resumen</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="mb-1">
                          <span className="font-medium">Nombre del archivo:</span> {projectName.replace(/\s+/g, "-")}
                          .zip
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">Tipo de backend:</span> {config.backend_type}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">Versión:</span> {config.backend_version}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">Base de datos:</span>{" "}
                          {config.database_type || "No seleccionada"}
                        </p>
                        <p className="mb-1">
                          <span className="font-medium">Total de archivos:</span> {fileCount}
                        </p>
                        <p>
                          <span className="font-medium">Total de carpetas:</span> {folderCount}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-lg font-medium mb-2">Archivos incluidos</h3>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg max-h-60 overflow-y-auto">
                        <ul className="space-y-1">
                          {Object.keys(files).map((file, index) => (
                            <li key={index} className="text-sm">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[calc(90vh-120px)]">
                    {/* Lista de archivos */}
                    <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto">
                      <div className="p-2">
                        {Object.keys(files).length > 0 ? (
                          Object.keys(files).map((file) => (
                            <button
                              key={file}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-xs mb-1 truncate",
                                previewFile === file
                                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-700",
                              )}
                              onClick={() => setPreviewFile(file)}
                            >
                              {file}
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                            No hay archivos para mostrar
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contenido del archivo */}
                    <div className="flex-1 overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex items-center">
                        <FileCode className="h-4 w-4 text-orange-500 mr-2" />
                        <h3 className="text-sm font-medium truncate">{previewFile}</h3>
                      </div>
                      <pre
                        className={`p-4 text-sm overflow-auto bg-gray-900 text-gray-100 h-[calc(90vh-160px)] language-${getLanguageFromFilePath(
                          previewFile,
                        )}`}
                      >
                        <code>{files[previewFile]}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={toggleExportPreview}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    toggleExportPreview()
                    handleExport()
                  }}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                >
                  Exportar Ahora
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className="space-y-4">
      {(error || projectError) && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
          {error || projectError}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <motion.button
          className={cn(
            "flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition",
            isSaving || isLoading || !hasBackendSelected
              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              : hasUnsavedChanges
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
          )}
          whileHover={!isSaving && !isLoading && hasBackendSelected && hasUnsavedChanges ? { scale: 1.02 } : {}}
          whileTap={!isSaving && !isLoading && hasBackendSelected && hasUnsavedChanges ? { scale: 0.98 } : {}}
          onClick={handleSave}
          disabled={isSaving || isLoading || !hasBackendSelected || !hasUnsavedChanges}
          title={
            !hasBackendSelected
              ? "Seleccione un lenguaje de backend primero"
              : !hasUnsavedChanges
                ? "No hay cambios para guardar"
                : ""
          }
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              <span>Guardar</span>
            </>
          )}
        </motion.button>

        <motion.button
          className={cn(
            "flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition",
            isGenerating || isLoading || !hasBackendSelected || hasUnsavedChanges
              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              : isGenerated
                ? "bg-green-500 text-white"
                : "bg-orange-500 hover:bg-orange-600 text-white",
          )}
          whileHover={!isGenerating && !isLoading && hasBackendSelected && !hasUnsavedChanges ? { scale: 1.02 } : {}}
          whileTap={!isGenerating && !isLoading && hasBackendSelected && !hasUnsavedChanges ? { scale: 0.98 } : {}}
          onClick={handleGenerateCode}
          disabled={isGenerating || isLoading || !hasBackendSelected || hasUnsavedChanges}
          title={
            !hasBackendSelected
              ? "Seleccione un lenguaje de backend primero"
              : hasUnsavedChanges
                ? "Guarde los cambios primero"
                : ""
          }
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              <span>Generando...</span>
            </>
          ) : isGenerated ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              <span>¡Generado!</span>
            </>
          ) : (
            <>
              <Code className="h-5 w-5 mr-2" />
              <span>Generar Código</span>
            </>
          )}
        </motion.button>

        <div className="flex-1 flex gap-2">
          <motion.button
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 px-4 rounded-lg font-medium transition",
              isExporting || isLoading || !hasBackendSelected || hasUnsavedChanges || !isCodeGenerated
                ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                : isExported
                  ? "bg-green-500 text-white"
                  : "bg-orange-500 hover:bg-orange-600 text-white",
            )}
            whileHover={
              !isExporting && !isLoading && hasBackendSelected && !hasUnsavedChanges && isCodeGenerated
                ? { scale: 1.02 }
                : {}
            }
            whileTap={
              !isExporting && !isLoading && hasBackendSelected && !hasUnsavedChanges && isCodeGenerated
                ? { scale: 0.98 }
                : {}
            }
            onClick={handleExport}
            disabled={isExporting || isLoading || !hasBackendSelected || hasUnsavedChanges || !isCodeGenerated}
            title={
              !hasBackendSelected
                ? "Seleccione un lenguaje de backend primero"
                : hasUnsavedChanges
                  ? "Guarde los cambios primero"
                  : !isCodeGenerated
                    ? "Genere el código primero"
                    : ""
            }
          >
            {isExporting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                <span>Exportando...</span>
              </>
            ) : isExported ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                <span>¡Exportado!</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                <span>Exportar</span>
              </>
            )}
          </motion.button>

          {/* Botón de vista previa de exportación */}
          <motion.button
            className={cn(
              "flex items-center justify-center py-2.5 px-3 rounded-lg font-medium transition",
              !hasBackendSelected || hasUnsavedChanges || !isCodeGenerated
                ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600",
            )}
            whileHover={hasBackendSelected && !hasUnsavedChanges && isCodeGenerated ? { scale: 1.02 } : {}}
            whileTap={hasBackendSelected && !hasUnsavedChanges && isCodeGenerated ? { scale: 0.98 } : {}}
            onClick={toggleExportPreview}
            disabled={!hasBackendSelected || hasUnsavedChanges || !isCodeGenerated}
            title={
              !hasBackendSelected
                ? "Seleccione un lenguaje de backend primero"
                : hasUnsavedChanges
                  ? "Guarde los cambios primero"
                  : !isCodeGenerated
                    ? "Genere el código primero"
                    : "Ver vista previa de exportación"
            }
          >
            <Eye className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Vista previa de exportación */}
      {renderExportPreview()}
    </div>
  )
}
