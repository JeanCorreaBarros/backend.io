"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Copy, Check, FileCode, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/contexts/project-context"

// Enhance the getLanguageFromFilePath function to better handle database-related files
const getLanguageFromFilePath = (filePath: string): string => {
  const extension = filePath.split(".").pop()?.toLowerCase() || ""
  const fileName = filePath.split("/").pop()?.toLowerCase() || ""

  // Special handling for database configuration files
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

export default function CodePreview() {
  const { files, selectedFile, setSelectedFile, config, setFiles } = useProject()
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState("")
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [originalCode, setOriginalCode] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiError, setAiError] = useState("")
  const [aiType, setAiType] = useState("chatgpt")
  const aiOptions = [
    { value: "chatgpt", label: "ChatGPT" },
    { value: "gemini", label: "Gemini" },
    { value: "claude", label: "Claude" },
  ]

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    setAiError("")
    // Aquí deberías conectar tu API de IA real
    // Simulación de respuesta IA
    setTimeout(() => {
      setCode(code + "\n// Código generado por IA: " + aiPrompt)
      setIsGenerating(false)
    }, 1500)
  }

  // Actualizar el código cuando cambia el archivo seleccionado
  useEffect(() => {
    if (selectedFile && files[selectedFile]) {
      setCode(files[selectedFile])
      setOriginalCode(files[selectedFile])
      setIsEditing(false)
    } else if (Object.keys(files).length > 0) {
      // Si el archivo seleccionado no existe, mostrar el primero
      const firstFile = Object.keys(files)[0]
      setSelectedFile(firstFile)
      setCode(files[firstFile])
      setOriginalCode(files[firstFile])
      setIsEditing(false)
    } else {
      setCode("")
      setOriginalCode("")
      setIsEditing(false)
    }
  }, [selectedFile, files, setSelectedFile])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFileSelect = (file: string) => {
    setSelectedFile(file)
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setCode(originalCode)
    setIsEditing(false)
  }

  const handleSave = () => {
    if (selectedFile && isModified) {
      setFiles({ ...files, [selectedFile]: code })
      setOriginalCode(code)
      setIsEditing(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value)
  }

  const isModified = code !== originalCode

  // Si no hay backend seleccionado, mostrar un mensaje
  if (!config.backend_type) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex justify-between items-center">
          <h3 className="text-sm font-medium">Vista Previa del Código</h3>
          <button
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Seleccione un lenguaje de backend para ver la vista previa del código.
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all duration-300",
        expanded ? "fixed top-20 left-4 right-4 bottom-4 z-50 bg-white dark:bg-gray-800" : "",
      )}
    >
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex items-center justify-between">
        <div className="flex items-center">
          <FileCode className="h-4 w-4 text-orange-500 mr-2" />
          <h3 className="text-sm font-medium truncate max-w-[200px]">{selectedFile || "Sin archivo seleccionado"}</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Mostrar botones de guardar/cancelar en expandido si hay cambios o está editando */}
          {expanded && (isEditing || isModified) && (
            <>
              <button
                className="px-3 py-1 rounded bg-gray-700 text-gray-100 hover:bg-gray-600 text-xs"
                onClick={handleCancelEdit}
                disabled={!isEditing && !isModified}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 text-xs disabled:opacity-50"
                onClick={handleSave}
                disabled={!isModified}
              >
                Guardar cambios
              </button>
            </>
          )}
          <button
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition mr-2"
            disabled={!code}
            title="Copiar código"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar con lista de archivos */}
        <div
          className={cn(
            "border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-y-auto",
            expanded ? "w-64" : "w-64 max-h-[400px] hidden md:block",
          )}
        >
          <div className="p-2">
            {Object.keys(files).length > 0 ? (
              Object.keys(files).map((file) => (
                <motion.button
                  key={file}
                  className={cn(
                    "w-full text-left px-2 py-1 rounded text-xs mb-1 truncate",
                    selectedFile === file
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700",
                    // Highlight database-related files
                    file.includes("database") || file.includes("db.") || file.includes("connection") || file === ".env"
                      ? "font-medium"
                      : "",
                  )}
                  whileHover={{ x: 2 }}
                  onClick={() => handleFileSelect(file)}
                >
                  {file}
                </motion.button>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs">
                No hay archivos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* Contenido del archivo */}
        <div className="relative flex-1">
          {code ? (
            isEditing ? (
              <div className="h-full flex flex-col">
                <textarea
                  className={cn(
                    "p-4 text-sm w-full h-full flex-1 bg-gray-900 text-gray-100 font-mono rounded-none border-0 resize-none outline-none",
                    expanded ? "h-[calc(100vh-180px)]" : "max-h-[320px]"
                  )}
                  value={code}
                  onChange={handleCodeChange}
                  autoFocus
                />
                {/* Caja de texto para IA */}
                <div className="bg-gray-900 border-t border-gray-700 p-2 flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <select
                      className="px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 text-xs"
                      value={aiType}
                      onChange={e => setAiType(e.target.value)}
                    >
                      {aiOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <textarea
                      className="flex-1 px-2 py-1 rounded bg-gray-800 text-gray-100 border border-gray-700 text-xs"
                      rows={2}
                      placeholder="Describe lo que quieres que la IA genere..."
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                    />
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 text-xs disabled:opacity-50"
                      onClick={handleAIGenerate}
                      disabled={!aiPrompt || isGenerating}
                    >
                      {isGenerating ? "Generando..." : "Generar con IA"}
                    </button>
                  </div>
                  {aiError && <div className="text-xs text-red-500">{aiError}</div>}
                </div>
                <div className="flex gap-2 p-2 bg-gray-900 border-t border-gray-700 justify-end">
                  <button
                    className="px-3 py-1 rounded bg-gray-700 text-gray-100 hover:bg-gray-600 text-xs"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 text-xs disabled:opacity-50"
                    onClick={handleSave}
                    disabled={!isModified}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative h-full">
                <pre
                  className={cn(
                    `p-4 text-sm overflow-x-auto bg-gray-900 text-gray-100 overflow-y-auto language-${getLanguageFromFilePath(selectedFile)}`,
                    expanded ? "h-[calc(100vh-120px)]" : "max-h-[400px]"
                  )}
                >
                  <code>{code}</code>
                </pre>
                <button
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 text-xs"
                  onClick={handleEditClick}
                  title="Editar código"
                >
                  Editar
                </button>
              </div>
            )
          ) : (
            <div
              className={cn(
                "flex items-center justify-center bg-gray-900 text-gray-500",
                expanded ? "h-[calc(100vh-120px)]" : "h-[400px]"
              )}
            >
              <p>No hay código para mostrar</p>
            </div>
          )}
        </div>
      </div>

      {/* Selector de archivos móvil */}
      <div
        className={cn(
          "md:hidden border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-2",
          expanded ? "hidden" : "",
        )}
      >
        <select
          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
          value={selectedFile}
          onChange={(e) => handleFileSelect(e.target.value)}
        >
          {Object.keys(files).length > 0 ? (
            Object.keys(files).map((file) => (
              <option key={file} value={file}>
                {file}
              </option>
            ))
          ) : (
            <option value="">No hay archivos disponibles</option>
          )}
        </select>
      </div>
    </div>
  )
}
