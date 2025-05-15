"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { motion } from "framer-motion"

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // Evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md ${
          theme === "light" ? "bg-white text-orange-500 shadow-sm" : "text-gray-500 dark:text-gray-400"
        }`}
        aria-label="Tema claro"
      >
        <Sun className="h-4 w-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md ${
          theme === "dark" ? "bg-gray-700 text-orange-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
        }`}
        aria-label="Tema oscuro"
      >
        <Moon className="h-4 w-4" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md ${
          theme === "system"
            ? "bg-white dark:bg-gray-700 text-orange-500 dark:text-orange-400 shadow-sm"
            : "text-gray-500 dark:text-gray-400"
        }`}
        aria-label="Tema del sistema"
      >
        <Laptop className="h-4 w-4" />
      </motion.button>
    </div>
  )
}
