"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronRight, ChevronDown, File, Folder, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProject } from "@/lib/contexts/project-context"

type FileItem = {
  id: string
  name: string
  type: "file" | "folder"
  children?: FileItem[]
  expanded?: boolean
}

export default function ProjectStructure() {
  const { files, setSelectedFile, config } = useProject()
  const [fileTree, setFileTree] = useState<FileItem[]>([])
  const [expanded, setExpanded] = useState(false)

  // Construir el árbol de archivos a partir de los archivos disponibles
  useEffect(() => {
    if (Object.keys(files).length === 0) {
      setFileTree([])
      return
    }

    const tree: Record<string, FileItem> = {}
    const root: FileItem[] = []

    // Crear nodos para todos los archivos
    Object.keys(files).forEach((filePath) => {
      const parts = filePath.split("/")
      const fileName = parts.pop() || filePath

      // Crear el nodo del archivo
      const fileNode: FileItem = {
        id: filePath,
        name: fileName,
        type: "file",
      }

      tree[filePath] = fileNode

      // Si no hay directorios, añadir directamente a la raíz
      if (parts.length === 0) {
        root.push(fileNode)
        return
      }

      // Crear nodos para todos los directorios en la ruta
      let currentPath = ""
      let parentPath = ""

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part

        // Crear el nodo del directorio si no existe
        if (!tree[currentPath]) {
          tree[currentPath] = {
            id: currentPath,
            name: part,
            type: "folder",
            children: [],
            expanded: true,
          }

          // Si es el primer directorio, añadirlo a la raíz
          if (index === 0) {
            root.push(tree[currentPath])
          } else {
            // Añadir al directorio padre
            if (tree[parentPath] && tree[parentPath].children) {
              tree[parentPath].children!.push(tree[currentPath])
            }
          }
        }

        parentPath = currentPath
      })

      // Añadir el archivo al último directorio
      if (tree[parentPath] && tree[parentPath].children) {
        tree[parentPath].children!.push(fileNode)
      }
    })

    // Ordenar: primero carpetas, luego archivos, ambos alfabéticamente
    const sortItems = (items: FileItem[]): FileItem[] => {
      return items
        .sort((a, b) => {
          if (a.type === b.type) {
            return a.name.localeCompare(b.name)
          }
          return a.type === "folder" ? -1 : 1
        })
        .map((item) => {
          if (item.children) {
            return {
              ...item,
              children: sortItems(item.children),
            }
          }
          return item
        })
    }

    setFileTree(sortItems(root))
  }, [files])

  const toggleFolder = (id: string) => {
    const updateFiles = (items: FileItem[]): FileItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, expanded: !item.expanded }
        }
        if (item.children) {
          return { ...item, children: updateFiles(item.children) }
        }
        return item
      })
    }

    setFileTree(updateFiles(fileTree))
  }

  const handleFileClick = (id: string) => {
    setSelectedFile(id)
  }

  const toggleExpand = () => {
    setExpanded(!expanded)
  }

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id} style={{ paddingLeft: `${level * 16}px` }}>
        <motion.div
          className={cn(
            "flex items-center py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer",
            item.type === "file" && "hover:text-orange-500 dark:hover:text-orange-400",
          )}
          whileHover={{ x: 2 }}
          onClick={() => (item.type === "folder" ? toggleFolder(item.id) : handleFileClick(item.id))}
        >
          {item.type === "folder" && (
            <button className="mr-1 text-gray-500 dark:text-gray-400">
              {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}

          {item.type === "folder" ? (
            <Folder className="h-4 w-4 text-orange-500 mr-2" />
          ) : (
            <FileIcon filePath={item.name} />
          )}

          <span className="text-sm truncate">{item.name}</span>
        </motion.div>

        {item.type === "folder" && item.expanded && item.children && (
          <div className={cn("transition-all duration-200", item.expanded ? "block" : "hidden")}>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ))
  }

  // Add this function to determine file icons based on extension
  const FileIcon = ({ filePath }: { filePath: string }) => {
    const extension = filePath.split(".").pop()?.toLowerCase() || ""
    const fileName = filePath.split("/").pop()?.toLowerCase() || ""

    // Database-specific icons
    if (
      fileName.includes("database") ||
      fileName.includes("db") ||
      fileName.includes("connection") ||
      fileName.includes("mongo") ||
      fileName.includes("mysql") ||
      fileName.includes("postgres") ||
      fileName.includes("sqlite") ||
      fileName.includes("h2")
    ) {
      return <File className="h-4 w-4 text-blue-600 mr-2" />
    }

    // Language-specific icons
    if (extension === "js" || extension === "jsx" || extension === "ts" || extension === "tsx") {
      return <File className="h-4 w-4 text-yellow-500 mr-2" />
    } else if (extension === "py") {
      return <File className="h-4 w-4 text-blue-500 mr-2" />
    } else if (extension === "php") {
      return <File className="h-4 w-4 text-purple-500 mr-2" />
    } else if (extension === "java") {
      return <File className="h-4 w-4 text-red-500 mr-2" />
    } else if (extension === "go") {
      return <File className="h-4 w-4 text-blue-400 mr-2" />
    } else if (extension === "json" || extension === "xml") {
      return <File className="h-4 w-4 text-green-500 mr-2" />
    } else if (extension === "md") {
      return <File className="h-4 w-4 text-gray-500 mr-2" />
    } else if (extension === "sql") {
      return <File className="h-4 w-4 text-blue-600 mr-2" />
    } else if (extension === "env" || fileName === ".env") {
      return <File className="h-4 w-4 text-green-600 mr-2" />
    } else {
      return <File className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
    }
  }

  // Si no hay backend seleccionado, mostrar un mensaje
  if (!config.backend_type) {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex justify-between items-center">
          <h3 className="text-sm font-medium">Estructura del Proyecto</h3>
          <button
            onClick={toggleExpand}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={expanded ? "Minimizar" : "Expandir"}
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          Seleccione un lenguaje de backend para ver la estructura del proyecto.
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
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-2 px-3 flex justify-between items-center">
        <h3 className="text-sm font-medium">Estructura del Proyecto</h3>
        <button
          onClick={toggleExpand}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title={expanded ? "Minimizar" : "Expandir"}
        >
          {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
      <div className={cn("p-2 overflow-y-auto", expanded ? "h-[calc(100%-40px)]" : "max-h-[300px]")}>
        {fileTree.length > 0 ? (
          renderFileTree(fileTree)
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No hay archivos para mostrar. Genera código primero.
          </div>
        )}
      </div>
    </div>
  )
}
